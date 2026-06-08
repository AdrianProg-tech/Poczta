import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, CheckSquare, CreditCard, MapPin, PackageX, RefreshCw, RotateCcw, Truck, Undo2 } from 'lucide-react';
import {
  acceptCourierTask,
  completeCourierTask,
  formatDate,
  formatDateTime,
  getCourierTaskDetails,
  getPublicPoints,
  getPublicTracking,
  initiateCourierReturn,
  issueCourierNotice,
  recordCourierAttempt,
  startCourierTask,
  type CourierTaskDetails as CourierTaskDetailsRecord,
  type IssueNoticeResponse,
  type PublicPoint,
  type PublicTrackingResponse,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';
import { useTranslation } from 'react-i18next';

function canonicalizeCity(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

  switch (normalized) {
    case 'WARSZAWA':
    case 'WARSAW':
      return 'WARSAW';
    case 'KRAKOW':
    case 'CRACOW':
      return 'KRAKOW';
    case 'GDANSK':
      return 'GDANSK';
    case 'WROCLAW':
      return 'WROCLAW';
    case 'POZNAN':
      return 'POZNAN';
    default:
      return normalized;
  }
}

function extractCityFromAddress(address: string | null | undefined) {
  if (!address) {
    return '';
  }

  return canonicalizeCity(address.split(',')[0]);
}

function findPickupPointByCity(points: PublicPoint[], city: string | null | undefined) {
  const pickupPoints = points.filter((point) => point.type === 'PICKUP_POINT');
  if (pickupPoints.length === 0) {
    return points[0];
  }

  const normalizedCity = canonicalizeCity(city);
  if (!normalizedCity) {
    return pickupPoints[0];
  }

  return pickupPoints.find((point) => canonicalizeCity(point.city) === normalizedCity) ?? pickupPoints[0];
}

function pickRedirectPoint(
  points: PublicPoint[],
  address: string | null | undefined,
  preferredCity?: string | null | undefined,
) {
  return findPickupPointByCity(points, extractCityFromAddress(address)) ?? findPickupPointByCity(points, preferredCity);
}

function buildHistoricNotice(trackingData: PublicTrackingResponse | null): IssueNoticeResponse | null {
  if (!trackingData) {
    return null;
  }

  const noticeEvent = trackingData.history.find((item) => {
    const description = `${item.description ?? ''} ${item.status ?? ''}`.toLowerCase();
    return description.includes('awizo') || description.includes('notice issued');
  });

  if (!noticeEvent) {
    return null;
  }

  const pickupPointCode = trackingData.destinationSummary.match(/[A-Z]{3}-[A-Z]{3}-\d{2}/)?.[0] ?? 'PICKUP_POINT';
  const issuedAt = noticeEvent.eventTime;
  const expiresAt = new Date(new Date(issuedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    noticeId: `historic-${trackingData.trackingNumber}`,
    noticeNumber: 'zapisane-w-historii',
    issuedAt,
    expiresAt,
    pickupPointCode,
    trackingNumber: trackingData.trackingNumber,
  };
}

function isPickupTask(taskType: string | null | undefined) {
  return taskType?.toUpperCase() === 'PICKUP';
}


export default function CourierTaskDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [task, setTask] = useState<CourierTaskDetailsRecord | null>(null);
  const [points, setPoints] = useState<PublicPoint[]>([]);
  const [tracking, setTracking] = useState<PublicTrackingResponse | null>(null);
  const [redirectPointCode, setRedirectPointCode] = useState('');
  const [collectionMethod, setCollectionMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issuedNotice, setIssuedNotice] = useState<IssueNoticeResponse | null>(null);

  const loadTask = useCallback(async () => {
    if (!currentUser?.email || !id) {
      setTask(null);
      setTracking(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [taskData, pointsData] = await Promise.all([getCourierTaskDetails(currentUser.email, id), getPublicPoints()]);
      const trackingData = await getPublicTracking(taskData.trackingNumber);
      const pickupPoint = pickRedirectPoint(pointsData, taskData.targetAddress, currentUser?.serviceCity);

      setTask(taskData);
      setPoints(pointsData);
      setTracking(trackingData);
      setIssuedNotice(buildHistoricNotice(trackingData));
      setRedirectPointCode(pickupPoint?.pointCode || '');
      setError(null);
    } catch (requestError) {
      setTask(null);
      setTracking(null);
      setError(requestError instanceof Error ? requestError.message : t('courierTaskDetails.actionError'));
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email, currentUser?.serviceCity, id]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  useEffect(() => {
    if (task?.paymentCollectionMethod === 'CARD' || task?.paymentCollectionMethod === 'CASH') {
      setCollectionMethod(task.paymentCollectionMethod);
    } else if (task?.requiresPaymentCollection) {
      setCollectionMethod('CASH');
    }
  }, [task?.paymentCollectionMethod, task?.requiresPaymentCollection]);

  async function runTaskAction(actionKey: string, action: () => Promise<unknown>) {
    setBusyAction(actionKey);
    setError(null);
    try {
      await action();
      await loadTask();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('courierTaskDetails.actionError'));
    } finally {
      setBusyAction(null);
    }
  }

  const pickupPoints = useMemo(() => points.filter((point) => point.type === 'PICKUP_POINT'), [points]);
  const timelineItems = useMemo(
    () => (tracking?.history?.length ? tracking.history : task?.history ?? []),
    [task?.history, tracking?.history],
  );
  const returnAlreadyStarted = useMemo(() => {
    if ((task?.shipmentStatus ?? tracking?.currentStatus) === 'RETURNED') {
      return true;
    }

    return timelineItems.some((item) => {
      const description = `${item.description ?? ''} ${item.status ?? ''}`.toLowerCase();
      return description.includes('return') || description.includes('zwrot');
    });
  }, [task?.shipmentStatus, tracking?.currentStatus, timelineItems]);
  const routeStatus = task?.shipmentStatus ?? tracking?.currentStatus ?? null;
  const hasPickupPointContext = useMemo(() => {
    const destinationSummary = tracking?.destinationSummary ?? '';
    if (/[A-Z]{3}-[A-Z]{3}-\d{2}/.test(destinationSummary)) {
      return true;
    }

    return ['REDIRECTED_TO_PICKUP', 'RETURN_IN_TRANSIT', 'IN_TRANSIT_TO_TARGET_POINT', 'AWAITING_PICKUP'].includes(
      routeStatus ?? '',
    );
  }, [routeStatus, tracking?.destinationSummary]);
  const canIssueNotice = task?.taskStatus === 'FAILED' && !issuedNotice && !returnAlreadyStarted && hasPickupPointContext;
  const actionPlanKeys = useMemo(() => {
    if (!task) return null;

    if (isPickupTask(task.taskType)) {
      if (task.taskStatus === 'ASSIGNED') return { prefix: 'pickupAssigned' };
      if (task.taskStatus === 'ACCEPTED') return { prefix: 'pickupAccepted' };
      if (task.taskStatus === 'IN_PROGRESS') return { prefix: 'pickupInProgress' };
      if (task.taskStatus === 'FAILED') return { prefix: 'pickupFailed' };
    }

    if (task.taskStatus === 'ASSIGNED') return { prefix: 'assigned' };
    if (task.taskStatus === 'ACCEPTED') return { prefix: 'accepted' };
    if (task.taskStatus === 'IN_PROGRESS') {
      return { prefix: task.requiresPaymentCollection ? 'inProgressPayment' : 'inProgress' };
    }
    if (task.taskStatus === 'FAILED') return { prefix: 'failed' };
    return { prefix: 'completed' };
  }, [task]);

  return (
    <DashboardShell role="courier" title={t('courierTaskDetails.title')}>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3">
            <Link to="/courier/tasks" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {t('courierTaskDetails.backToList')}
            </Link>
          </div>
          <h2 className="mb-2 text-2xl">{t('courierTaskDetails.heading')}</h2>
          <p className="text-muted-foreground">{t('courierTaskDetails.desc')}</p>
        </div>

        <button
          type="button"
          onClick={() => void loadTask()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}
      {isLoading ? <div className="rounded-xl border border-border bg-card p-6 shadow-sm">{t('courierTaskDetails.loading')}</div> : null}

      {!isLoading && !task ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-muted-foreground">
          {t('courierTaskDetails.notFound')}
        </div>
      ) : null}

      {!isLoading && task ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr),360px]">
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl">{task.trackingNumber}</h3>
                    <StatusBadge status={task.shipmentStatus ?? task.taskStatus} />
                    <StatusBadge status={task.taskStatus} />
                  </div>
                  <p className="text-sm text-muted-foreground">Task ID: {task.taskId}</p>
                </div>
                <div className="rounded-lg bg-secondary px-4 py-2 text-sm">{isPickupTask(task.taskType) ? t('courierTaskDetails.taskType') + ': ' + t('courierTasks.taskTypePickup') : t('courierTaskDetails.taskType') + ': ' + t('courierTasks.taskTypeDelivery')}</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">{isPickupTask(task.taskType) ? t('courierTaskDetails.sender') : t('courierTaskDetails.recipient')}</div>
                  <div>{task.recipientName}</div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">{t('courierTaskDetails.phone')}</div>
                  <div>{task.recipientPhone}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="mb-1 text-sm text-muted-foreground">{isPickupTask(task.taskType) ? t('courierTaskDetails.pickupAddress') : t('courierTaskDetails.destination')}</div>
                  <div>{task.targetAddress}</div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">{t('courierTaskDetails.plannedDate')}</div>
                  <div>{formatDate(task.plannedDate)}</div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">{t('courierTaskDetails.shipmentStatus')}</div>
                  <div>{task.shipmentStatus ?? t('courierTaskDetails.noData')}</div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">{t('courierTaskDetails.payment')}</div>
                  <div>
                    {task.paymentMethod ?? t('common.noData')} {task.paymentStatus ? `| ${task.paymentStatus}` : ''}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">{t('courierTaskDetails.collectionOnDelivery')}</div>
                  <div>
                    {isPickupTask(task.taskType)
                      ? t('courierTaskDetails.collectionPickupNote')
                      : task.requiresPaymentCollection
                        ? t('courierTaskDetails.collectionYes')
                        : t('courierTaskDetails.collectionNo')}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg">{t('courierTaskDetails.trackingHistory')}</h3>
              {timelineItems.length ? (
                <div className="space-y-6">
                  {timelineItems.map((item, index) => (
                    <div key={`${item.eventTime}-${item.status}-${index}`} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-accent' : 'bg-muted'}`} />
                        {index !== timelineItems.length - 1 ? <div className="mt-2 h-full w-0.5 bg-border" /> : null}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="mb-1 flex items-center gap-3">
                          <StatusBadge status={item.status} />
                          <span className="text-sm text-muted-foreground">{formatDateTime(item.eventTime)}</span>
                        </div>
                        <div className="mb-1">{item.description}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {item.locationName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">{t('courierTaskDetails.noHistory')}</div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              {actionPlanKeys ? (
                <div className="mb-5 rounded-xl bg-secondary p-4">
                  <div className="mb-1 text-sm text-muted-foreground">{t('courierTaskDetails.suggestedStep')}</div>
                  <div className="text-lg">{t(`courierTaskDetails.actionPlan.${actionPlanKeys.prefix}Title`)}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{t(`courierTaskDetails.actionPlan.${actionPlanKeys.prefix}Desc`)}</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div>{t(`courierTaskDetails.actionPlan.${actionPlanKeys.prefix}Bullet0`)}</div>
                    <div>{t(`courierTaskDetails.actionPlan.${actionPlanKeys.prefix}Bullet1`)}</div>
                  </div>
                </div>
              ) : null}

              <h3 className="mb-4 text-lg">{t('courierTaskDetails.courierActions')}</h3>
              <div className="space-y-3">
                {task.taskStatus === 'ASSIGNED' ? (
                  <button
                    type="button"
                    disabled={busyAction === 'accept' || !currentUser?.email}
                    onClick={() =>
                      currentUser?.email && runTaskAction('accept', () => acceptCourierTask(currentUser.email, task.taskId))
                    }
                    className="w-full rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                  >
                    {t('courierTaskDetails.acceptTask')}
                  </button>
                ) : null}

                {task.taskStatus === 'ACCEPTED' ? (
                  <button
                    type="button"
                    disabled={busyAction === 'start' || !currentUser?.email}
                    onClick={() =>
                      currentUser?.email && runTaskAction('start', () => startCourierTask(currentUser.email, task.taskId))
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                  >
                    <Truck className="h-4 w-4" />
                    {isPickupTask(task.taskType) ? t('courierTaskDetails.startPickup') : t('courierTaskDetails.startRoute')}
                  </button>
                ) : null}

                {task.taskStatus === 'IN_PROGRESS' ? (
                  <>
                    {isPickupTask(task.taskType) ? (
                      <button
                        type="button"
                        disabled={busyAction === 'complete' || !currentUser?.email}
                        onClick={() =>
                          currentUser?.email &&
                          runTaskAction('complete', () =>
                            completeCourierTask(currentUser.email, task.taskId, {
                              note: 'Paczka odebrana od nadawcy z widoku szczegolow kuriera',
                            }),
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                      >
                        <CheckSquare className="h-4 w-4" />
                        {t('courierTaskDetails.confirmPickupFromSender')}
                      </button>
                    ) : task.requiresPaymentCollection ? (
                      <div className="space-y-3 rounded-lg border border-border p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CreditCard className="h-4 w-4" />
                          {t('courierTaskDetails.checkout')}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="flex items-center gap-2 rounded-lg border border-border p-3">
                            <input
                              type="radio"
                              name="collectionMethod"
                              checked={collectionMethod === 'CASH'}
                              onChange={() => setCollectionMethod('CASH')}
                            />
                            <span>{t('courierTaskDetails.cash')}</span>
                          </label>
                          <label className="flex items-center gap-2 rounded-lg border border-border p-3">
                            <input
                              type="radio"
                              name="collectionMethod"
                              checked={collectionMethod === 'CARD'}
                              onChange={() => setCollectionMethod('CARD')}
                            />
                            <span>{t('courierTaskDetails.card')}</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          disabled={busyAction === 'complete' || !currentUser?.email}
                          onClick={() =>
                            currentUser?.email &&
                            runTaskAction('complete', () =>
                              completeCourierTask(currentUser.email, task.taskId, {
                                note: 'Doreczono z widoku szczegolow kuriera',
                                collectPayment: true,
                                collectionMethod,
                              }),
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                        >
                          <CheckSquare className="h-4 w-4" />
                          {t('courierTaskDetails.collectAndDeliver')}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={busyAction === 'complete' || !currentUser?.email}
                        onClick={() =>
                          currentUser?.email &&
                          runTaskAction('complete', () =>
                            completeCourierTask(currentUser.email, task.taskId, {
                              note: 'Doreczono z widoku szczegolow kuriera',
                            }),
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                      >
                        <CheckSquare className="h-4 w-4" />
                        {t('courierTaskDetails.markDelivered')}
                      </button>
                    )}

                    {!isPickupTask(task.taskType) ? (
                      <div className="space-y-2 rounded-lg border border-border p-3">
                        <div className="text-sm text-muted-foreground">{t('courierTaskDetails.redirectLabel')}</div>
                        <select
                          value={redirectPointCode}
                          onChange={(event) => setRedirectPointCode(event.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 outline-none"
                        >
                          {pickupPoints.map((point) => (
                            <option key={point.pointCode} value={point.pointCode}>
                              {point.pointCode} | {point.city}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={busyAction === 'attempt' || !currentUser?.email || !redirectPointCode}
                          onClick={() =>
                            currentUser?.email &&
                            redirectPointCode &&
                            runTaskAction('attempt', () =>
                              recordCourierAttempt(currentUser.email, task.taskId, {
                                result: 'RECIPIENT_ABSENT',
                                note: 'Recipient unavailable during frontend demo',
                                redirectToPickup: true,
                                redirectPointCode,
                              }),
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                        >
                          <RotateCcw className="h-4 w-4" />
                          {t('courierTaskDetails.saveAttempt')}
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                        {t('courierTaskDetails.pickupNetworkNote')}
                      </div>
                    )}
                  </>
                ) : null}

                {task.taskStatus === 'FAILED' && !isPickupTask(task.taskType) ? (
                  <div className="space-y-3">
                    {issuedNotice ? (
                      <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm">
                        <div className="mb-1 font-medium">{t('courierTaskDetails.noticeIssued')}</div>
                        <div className="text-muted-foreground">
                          {t('courierTaskDetails.noticeNumber')} <span className="font-mono">{issuedNotice.noticeNumber}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {t('courierTaskDetails.noticePoint')} {issuedNotice.pickupPointCode} — {t('courierTaskDetails.noticeValidTo')}{' '}
                          {new Date(issuedNotice.expiresAt).toLocaleDateString('pl-PL')}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={busyAction === 'notice' || !currentUser?.email || !canIssueNotice}
                        onClick={() =>
                          currentUser?.email &&
                          runTaskAction('notice', async () => {
                            const result = await issueCourierNotice(currentUser.email, task.taskId);
                            setIssuedNotice(result as IssueNoticeResponse);
                          })
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                      >
                        <PackageX className="h-4 w-4" />
                        {busyAction === 'notice' ? t('courierTaskDetails.issuingNotice') : t('courierTaskDetails.issueNotice')}
                      </button>
                    )}
                    {!issuedNotice && !canIssueNotice && !returnAlreadyStarted ? (
                      <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-muted-foreground">
                        {t('courierTaskDetails.noticeUnavailable')}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      disabled={busyAction === 'return' || !currentUser?.email || returnAlreadyStarted}
                      onClick={() => {
                        if (!currentUser?.email) return;
                        if (!window.confirm(t('courierTaskDetails.confirmReturn'))) return;
                        void runTaskAction('return', () =>
                          initiateCourierReturn(currentUser.email, task.taskId, 'Nieudana proba doreczenia'),
                        );
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-70"
                    >
                      <Undo2 className="h-4 w-4" />
                      {busyAction === 'return'
                        ? t('courierTaskDetails.initiatingReturn')
                        : returnAlreadyStarted
                          ? t('courierTaskDetails.returnAlreadyStarted')
                          : t('courierTaskDetails.initiateReturn')}
                    </button>
                    {returnAlreadyStarted ? (
                      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-muted-foreground">
                        {t('courierTaskDetails.returnInProgress')}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {task.taskStatus === 'FAILED' && isPickupTask(task.taskType) ? (
                  <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
                    {t('courierTaskDetails.failedPickupNote')}
                  </div>
                ) : null}

                {task.taskStatus !== 'ASSIGNED' && task.taskStatus !== 'ACCEPTED' && task.taskStatus !== 'IN_PROGRESS' && task.taskStatus !== 'FAILED' ? (
                  <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
                    {t('courierTaskDetails.completedNote')}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg">{t('courierTaskDetails.quickContext')}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('courierTaskDetails.tracking')}</span>
                  <span>{tracking?.trackingNumber ?? task.trackingNumber}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{isPickupTask(task.taskType) ? t('courierTaskDetails.pickupAddress') : t('courierTaskDetails.destination')}</span>
                  <span className="text-right">{tracking?.destinationSummary ?? task.targetAddress}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">ETA</span>
                  <span>{formatDate(tracking?.estimatedDeliveryDate ?? task.plannedDate)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('courierTaskDetails.pickupPoints')}</span>
                  <span>{pickupPoints.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('courierTaskDetails.eventHistory')}</span>
                  <span>{timelineItems.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('courierTaskDetails.collectionMethod')}</span>
                  <span>
                    {isPickupTask(task.taskType)
                      ? t('courierTaskDetails.collectionNA')
                      : task.paymentCollectionMethod ?? (task.requiresPaymentCollection ? t('courierTaskDetails.collectionChoose') : t('courierTaskDetails.collectionNo'))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
