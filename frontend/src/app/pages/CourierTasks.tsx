import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CheckSquare, PackageSearch, RefreshCw, RotateCcw, ScanSearch, Truck } from 'lucide-react';
import {
  acceptCourierTask,
  claimShipment,
  completeCourierTask,
  formatDate,
  getAvailableShipments,
  getCourierTasks,
  getPublicPoints,
  recordCourierAttempt,
  startCourierTask,
  type AvailableShipment,
  type CourierTaskListItem,
  type PublicPoint,
} from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';
import { useTranslation } from 'react-i18next';

type TaskFilter = 'ALL' | 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'FAILED' | 'COMPLETED';

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

function isPickupTask(taskType: string | null | undefined) {
  return taskType?.toUpperCase() === 'PICKUP';
}

function getCourierTaskNextStepKey(task: CourierTaskListItem): string {
  if (isPickupTask(task.taskType)) {
    if (task.taskStatus === 'ASSIGNED') return 'courierTasks.nextStepPickupAssigned';
    if (task.taskStatus === 'ACCEPTED') return 'courierTasks.nextStepPickupAccepted';
    if (task.taskStatus === 'IN_PROGRESS') return 'courierTasks.nextStepPickupInProgress';
    if (task.taskStatus === 'FAILED') return 'courierTasks.nextStepPickupFailed';
  }
  if (task.taskStatus === 'ASSIGNED') return 'courierTasks.nextStepAssigned';
  if (task.taskStatus === 'ACCEPTED') return 'courierTasks.nextStepAccepted';
  if (task.taskStatus === 'IN_PROGRESS') {
    return task.requiresPaymentCollection ? 'courierTasks.nextStepInProgressPayment' : 'courierTasks.nextStepInProgress';
  }
  if (task.taskStatus === 'FAILED') return 'courierTasks.nextStepFailed';
  return 'courierTasks.nextStepDone';
}

export default function CourierTasks() {
  const { t } = useTranslation();
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [tasks, setTasks] = useState<CourierTaskListItem[]>([]);
  const [availableShipments, setAvailableShipments] = useState<AvailableShipment[]>([]);
  const [points, setPoints] = useState<PublicPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>('ALL');
  const [query, setQuery] = useState('');
  const [redirectPointByTaskId, setRedirectPointByTaskId] = useState<Record<string, string>>({});
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [batchRedirectPointCode, setBatchRedirectPointCode] = useState('');

  const loadTasks = useCallback(async () => {
    if (!currentUser?.email) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [taskData, pointsData, availableData] = await Promise.all([
        getCourierTasks(currentUser.email),
        getPublicPoints(),
        getAvailableShipments(currentUser.email).catch(() => [] as AvailableShipment[]),
      ]);
      setTasks(taskData);
      setPoints(pointsData);
      setAvailableShipments(availableData);
      setError(null);
      setRedirectPointByTaskId((current) => {
        const firstActiveTask = taskData.find((task) => ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(task.taskStatus));
        const pickupPoint = pickRedirectPoint(
          pointsData,
          firstActiveTask?.targetAddress ?? taskData[0]?.targetAddress,
          currentUser?.serviceCity,
        );
        if (pickupPoint) {
          setBatchRedirectPointCode((currentValue) => currentValue || pickupPoint.pointCode);
        }
        if (!pickupPoint) {
          return current;
        }

        const next = { ...current };
        taskData.forEach((task) => {
          if (!next[task.taskId]) {
            next[task.taskId] =
              pickRedirectPoint(pointsData, task.targetAddress, currentUser?.serviceCity)?.pointCode ?? pickupPoint.pointCode;
          }
        });
        return next;
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('courierTasks.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email, currentUser?.serviceCity]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  async function runTaskAction(taskId: string, action: () => Promise<unknown>) {
    setBusyTaskId(taskId);
    setError(null);
    try {
      await action();
      await loadTasks();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('courierTasks.actionError'));
    } finally {
      setBusyTaskId(null);
    }
  }

  async function runBatchTaskAction(actionKey: string, actions: Array<() => Promise<unknown>>) {
    if (actions.length === 0) {
      return false;
    }

    setBusyTaskId(actionKey);
    setError(null);
    try {
      for (const action of actions) {
        await action();
      }
      await loadTasks();
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('courierTasks.batchActionError'));
      return false;
    } finally {
      setBusyTaskId(null);
    }
  }

  const pickupPoints = useMemo(() => points.filter((point) => point.type === 'PICKUP_POINT'), [points]);
  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesFilter = filter === 'ALL' || task.taskStatus === filter;
      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [task.trackingNumber, task.recipientName, task.recipientPhone, task.targetAddress, task.taskStatus]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [filter, query, tasks]);
  const summary = useMemo(
    () => [
      { label: t('courierTasks.statAssigned'), value: tasks.filter((task) => task.taskStatus === 'ASSIGNED').length },
      { label: t('courierTasks.statAccepted'), value: tasks.filter((task) => task.taskStatus === 'ACCEPTED').length },
      { label: t('courierTasks.statInProgress'), value: tasks.filter((task) => task.taskStatus === 'IN_PROGRESS').length },
      { label: t('courierTasks.statClosed'), value: tasks.filter((task) => ['FAILED', 'COMPLETED'].includes(task.taskStatus)).length },
    ],
    [tasks, t],
  );
  const selectedTasks = useMemo(() => filteredTasks.filter((task) => selectedTaskIds.has(task.taskId)), [filteredTasks, selectedTaskIds]);
  const selectableTasks = useMemo(
    () => filteredTasks.filter((task) => ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(task.taskStatus)),
    [filteredTasks],
  );
  const batchAcceptableTasks = useMemo(
    () => selectedTasks.filter((task) => task.taskStatus === 'ASSIGNED'),
    [selectedTasks],
  );
  const batchStartableTasks = useMemo(
    () => selectedTasks.filter((task) => task.taskStatus === 'ACCEPTED'),
    [selectedTasks],
  );
  const batchCompletableTasks = useMemo(
    () => selectedTasks.filter((task) => task.taskStatus === 'IN_PROGRESS' && !task.requiresPaymentCollection),
    [selectedTasks],
  );
  const selectedTasksNeedingPaymentCollection = useMemo(
    () => selectedTasks.filter((task) => task.requiresPaymentCollection),
    [selectedTasks],
  );
  const visibleAcceptableTasks = useMemo(
    () => selectableTasks.filter((task) => task.taskStatus === 'ASSIGNED'),
    [selectableTasks],
  );
  const visibleStartableTasks = useMemo(
    () => selectableTasks.filter((task) => task.taskStatus === 'ACCEPTED'),
    [selectableTasks],
  );
  const visibleCompletableTasks = useMemo(
    () => selectableTasks.filter((task) => task.taskStatus === 'IN_PROGRESS' && !task.requiresPaymentCollection),
    [selectableTasks],
  );

  useEffect(() => {
    const visibleIds = new Set(filteredTasks.map((task) => task.taskId));
    setSelectedTaskIds((current) => new Set([...current].filter((taskId) => visibleIds.has(taskId))));
  }, [filteredTasks]);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleAllVisibleTasks = () => {
    setSelectedTaskIds((current) =>
      current.size === selectableTasks.length ? new Set() : new Set(selectableTasks.map((task) => task.taskId)),
    );
  };

  return (
    <DashboardShell role="courier" title={t('courierTasks.title')}>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="mb-2 text-2xl">{t('courierTasks.activeTasks')}</h2>
          <p className="text-muted-foreground">{t('courierTasks.activeTasksDesc')}</p>
        </div>

        <button
          type="button"
          onClick={() => void loadTasks()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="text-sm text-muted-foreground">{item.label}</div>
            <div className="mt-2 text-3xl">{isLoading ? '...' : item.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['ALL', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'FAILED', 'COMPLETED'] as TaskFilter[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              filter === value ? 'border-accent bg-accent text-white' : 'border-border bg-card hover:bg-muted'
            }`}
          >
            {value === 'ALL' ? t('common.filter') : t(`status.task.${value}`, { defaultValue: value })}
          </button>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <label className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <ScanSearch className="h-4 w-4" />
          {t('courierTasks.searchLabel')}
        </label>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('courierTasks.searchPlaceholder')}
          className="w-full rounded-lg border border-border bg-input-background px-4 py-3 outline-none transition-colors focus:border-accent"
        />
      </div>

      <div className="mb-6 rounded-xl border border-dashed border-border bg-secondary/60 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm">
              {t('courierTasks.batchSelected', { selected: selectedTasks.length, total: selectableTasks.length })}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{t('courierTasks.batchNote')}</div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div>{t('courierTasks.visibleAcceptable', { count: visibleAcceptableTasks.length })}</div>
              <div>{t('courierTasks.visibleStartable', { count: visibleStartableTasks.length })}</div>
              <div>{t('courierTasks.visibleCompletable', { count: visibleCompletableTasks.length })}</div>
            </div>
            {selectedTasksNeedingPaymentCollection.length > 0 ? (
              <div className="mt-2 text-sm text-warning">
                {t('courierTasks.paymentWarning', { count: selectedTasksNeedingPaymentCollection.length })}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleAllVisibleTasks}
              disabled={selectableTasks.length === 0 || busyTaskId !== null}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-70"
            >
              {selectedTaskIds.size === selectableTasks.length ? t('courierTasks.deselectVisible') : t('courierTasks.selectVisible', { count: selectableTasks.length })}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTaskIds(new Set())}
              disabled={selectedTasks.length === 0 || busyTaskId !== null}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-70"
            >
              {t('courierTasks.clearSelection')}
            </button>
            <button
              type="button"
              disabled={batchAcceptableTasks.length === 0 || busyTaskId !== null || !currentUser?.email}
              onClick={() => {
                if (!currentUser?.email || batchAcceptableTasks.length === 0) {
                  return;
                }

                void (async () => {
                  const success = await runBatchTaskAction(
                    'batch-accept',
                    batchAcceptableTasks.map((task) => () => acceptCourierTask(currentUser.email!, task.taskId)),
                  );
                  if (success) {
                    setSelectedTaskIds(new Set());
                  }
                })();
              }}
              className="rounded-lg bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
            >
              {t('courierTasks.batchAccept')}
            </button>
            <button
              type="button"
              disabled={batchStartableTasks.length === 0 || busyTaskId !== null || !currentUser?.email}
              onClick={() => {
                if (!currentUser?.email || batchStartableTasks.length === 0) {
                  return;
                }

                void (async () => {
                  const success = await runBatchTaskAction(
                    'batch-start',
                    batchStartableTasks.map((task) => () => startCourierTask(currentUser.email!, task.taskId)),
                  );
                  if (success) {
                    setSelectedTaskIds(new Set());
                  }
                })();
              }}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-70"
            >
              {t('courierTasks.batchStart')}
            </button>
            <button
              type="button"
              disabled={batchCompletableTasks.length === 0 || busyTaskId !== null || !currentUser?.email}
              onClick={() => {
                if (!currentUser?.email || batchCompletableTasks.length === 0) {
                  return;
                }

                void (async () => {
                  const success = await runBatchTaskAction(
                    'batch-complete',
                    batchCompletableTasks.map((task) => () =>
                      completeCourierTask(currentUser.email!, task.taskId, {
                        note: 'Doreczono z widoku masowego kuriera',
                      }),
                    ),
                  );
                  if (success) {
                    setSelectedTaskIds(new Set());
                  }
                })();
              }}
              className="rounded-lg bg-success px-4 py-2 text-sm text-white transition-colors hover:bg-success/90 disabled:opacity-70"
            >
              {t('courierTasks.batchDeliver')}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 lg:flex-row lg:items-center">
          <label className="text-sm text-muted-foreground">{t('courierTasks.batchRedirectLabel')}</label>
          <select
            value={batchRedirectPointCode}
            onChange={(event) => setBatchRedirectPointCode(event.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none"
          >
            {pickupPoints.map((point) => (
              <option key={point.pointCode} value={point.pointCode}>
                {point.pointCode} | {point.city}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={batchCompletableTasks.length === 0 || busyTaskId !== null || !currentUser?.email || !batchRedirectPointCode}
            onClick={() => {
              if (!currentUser?.email || batchCompletableTasks.length === 0 || !batchRedirectPointCode) {
                return;
              }

              void (async () => {
                const success = await runBatchTaskAction(
                  'batch-attempt',
                  batchCompletableTasks.map((task) => () =>
                    recordCourierAttempt(currentUser.email!, task.taskId, {
                      result: 'RECIPIENT_ABSENT',
                      note: 'Odbiorca niedostepny podczas masowej obslugi kuriera',
                      redirectToPickup: true,
                      redirectPointCode: batchRedirectPointCode,
                    }),
                  ),
                );
                if (success) {
                  setSelectedTaskIds(new Set());
                }
              })();
            }}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-70"
          >
            {t('courierTasks.batchSaveAttempt')}
          </button>
        </div>
      </div>

      {availableShipments.length > 0 ? (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <PackageSearch className="h-5 w-5 text-accent" />
            <h3 className="text-lg">{t('courierTasks.availableTitle', { count: availableShipments.length })}</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {availableShipments.map((shipment) => (
              <div key={shipment.shipmentId} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="font-mono text-sm">{shipment.trackingNumber}</div>
                  <StatusBadge status={shipment.shipmentStatus} />
                </div>
                <div className="mb-1 text-sm text-muted-foreground">{shipment.recipientName}</div>
                <div className="mb-3 text-xs text-muted-foreground">{shipment.recipientAddress}</div>
                <button
                  type="button"
                  disabled={busyTaskId === shipment.shipmentId}
                  onClick={() => {
                    if (!currentUser?.email) return;
                    setBusyTaskId(shipment.shipmentId);
                    setError(null);
                    claimShipment(currentUser.email, shipment.shipmentId)
                      .then(() => loadTasks())
                      .catch((err: unknown) => setError(err instanceof Error ? err.message : t('courierTasks.actionError')))
                      .finally(() => setBusyTaskId(null));
                  }}
                  className="w-full rounded-lg bg-accent px-3 py-2 text-sm text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                >
                  {busyTaskId === shipment.shipmentId ? t('courierTasks.claiming') : t('courierTasks.claimShipment')}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}

      {isLoading ? <div className="rounded-xl border border-border bg-card p-6 shadow-sm">{t('courierTasks.loading')}</div> : null}

      {!isLoading && tasks.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm text-center">
          <Truck className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
          <div className="mb-2 text-lg">{t('courierTasks.empty')}</div>
          <p className="text-sm text-muted-foreground">{t('courierTasks.emptyDesc')}</p>
        </div>
      ) : null}

      {!isLoading && tasks.length > 0 && filteredTasks.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-muted-foreground">
          {t('courierTasks.noMatch')}
        </div>
      ) : null}

      <div className="grid gap-4">
        {filteredTasks.map((task) => {
          const isBusy = busyTaskId === task.taskId;
          const redirectPoint =
            redirectPointByTaskId[task.taskId] ??
            pickRedirectPoint(points, task.targetAddress, currentUser?.serviceCity)?.pointCode ??
            pickupPoints[0]?.pointCode;

          return (
            <div key={task.taskId} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.has(task.taskId)}
                      disabled={!['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(task.taskStatus)}
                      onChange={() => toggleTaskSelection(task.taskId)}
                      className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                      aria-label={t('courierTasks.ariaSelectTask', { number: task.trackingNumber })}
                    />
                    <div className="text-lg">{task.trackingNumber}</div>
                    <StatusBadge status={task.shipmentStatus ?? task.taskStatus} />
                    <StatusBadge status={task.taskStatus} type="task" />
                  </div>
                  <div className="mb-3">
                    <Link
                      to={`/courier/tasks/${task.taskId}`}
                      className="text-sm text-accent transition-colors hover:text-accent/80"
                    >
                      {t('courierTasks.openDetails')}
                    </Link>
                  </div>
                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <div className="mb-1 text-muted-foreground">{isPickupTask(task.taskType) ? t('courierTasks.sender') : t('courierTasks.recipient')}</div>
                      <div>{task.recipientName}</div>
                      <div className="text-muted-foreground">{task.recipientPhone}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-muted-foreground">{isPickupTask(task.taskType) ? t('courierTasks.pickupAddress') : t('courierTasks.targetAddress')}</div>
                      <div>{task.targetAddress}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-muted-foreground">{t('courierTasks.taskType')}</div>
                      <div>{isPickupTask(task.taskType) ? t('courierTasks.taskTypePickup') : t('courierTasks.taskTypeDelivery')}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-muted-foreground">{t('courierTasks.plannedDate')}</div>
                      <div>{formatDate(task.plannedDate)}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-muted-foreground">{t('courierTasks.payment')}</div>
                      <div>
                        {task.paymentMethod ?? t('common.noData')} {task.paymentStatus ? `| ${task.paymentStatus}` : ''}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-muted-foreground">{t('courierTaskDetails.collectionOnDelivery')}</div>
                      <div>
                        {isPickupTask(task.taskType)
                          ? t('courierTasks.collectionPickup')
                          : task.requiresPaymentCollection
                            ? t('courierTasks.collectionRequired')
                            : t('courierTasks.collectionNone')}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      to={`/courier/tasks/${task.taskId}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
                    >
                      {t('courierTasks.taskDetails')}
                    </Link>
                  </div>
                </div>

                <div className="space-y-3 lg:w-72">
                  <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
                    <div className="mb-2 text-foreground">{t('courierTasks.nextStep')}</div>
                    <div>{t(getCourierTaskNextStepKey(task))}</div>
                  </div>

                  {task.taskStatus === 'ASSIGNED' ? (
                    <button
                      type="button"
                      disabled={isBusy || !currentUser?.email}
                      onClick={() =>
                        currentUser?.email && runTaskAction(task.taskId, () => acceptCourierTask(currentUser.email!, task.taskId))
                      }
                      className="w-full rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                    >
                      {t('courierTasks.acceptTask')}
                    </button>
                  ) : null}

                  {task.taskStatus === 'ACCEPTED' ? (
                    <button
                      type="button"
                      disabled={isBusy || !currentUser?.email}
                      onClick={() =>
                        currentUser?.email && runTaskAction(task.taskId, () => startCourierTask(currentUser.email!, task.taskId))
                      }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                  >
                      <Truck className="h-4 w-4" />
                      {isPickupTask(task.taskType) ? t('courierTasks.startPickup') : t('courierTasks.startRoute')}
                    </button>
                  ) : null}

                  {task.taskStatus === 'IN_PROGRESS' ? (
                    <>
                      {isPickupTask(task.taskType) ? (
                        <button
                          type="button"
                          disabled={isBusy || !currentUser?.email}
                          onClick={() =>
                            currentUser?.email &&
                            runTaskAction(task.taskId, () =>
                              completeCourierTask(currentUser.email!, task.taskId, {
                                note: 'Paczka odebrana od nadawcy z widoku listy kuriera',
                              }),
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                        >
                          <CheckSquare className="h-4 w-4" />
                          {t('courierTasks.confirmPickupFromSender')}
                        </button>
                      ) : task.requiresPaymentCollection ? (
                        <Link
                          to={`/courier/tasks/${task.taskId}`}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90"
                        >
                          <CheckSquare className="h-4 w-4" />
                          {t('courierTasks.collectAndDeliver')}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy || !currentUser?.email}
                          onClick={() =>
                            currentUser?.email &&
                            runTaskAction(task.taskId, () =>
                              completeCourierTask(currentUser.email!, task.taskId, {
                                note: 'Delivered from courier UI',
                              }),
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                        >
                          <CheckSquare className="h-4 w-4" />
                          {t('courierTasks.markDelivered')}
                        </button>
                      )}

                      {!isPickupTask(task.taskType) ? (
                        <div className="space-y-2 rounded-lg border border-border p-3">
                          <div className="text-sm text-muted-foreground">{t('courierTasks.redirectLabel')}</div>
                          <select
                            value={redirectPoint ?? ''}
                            onChange={(event) =>
                              setRedirectPointByTaskId((current) => ({
                                ...current,
                                [task.taskId]: event.target.value,
                              }))
                            }
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
                            disabled={isBusy || !currentUser?.email || !redirectPoint}
                            onClick={() =>
                              currentUser?.email &&
                              redirectPoint &&
                              runTaskAction(task.taskId, () =>
                                recordCourierAttempt(currentUser.email!, task.taskId, {
                                  result: 'RECIPIENT_ABSENT',
                                  note: 'Recipient unavailable during frontend demo',
                                  redirectToPickup: true,
                                  redirectPointCode: redirectPoint,
                                }),
                              )
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                          >
                            <RotateCcw className="h-4 w-4" />
                            {t('courierTasks.saveAttempt')}
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                          {t('courierTasks.pickupNetworkNote')}
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
