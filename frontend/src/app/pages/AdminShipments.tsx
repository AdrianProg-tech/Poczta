import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreditCard, RefreshCw, Search } from 'lucide-react';
import {
  acceptPointShipment,
  assignCourierToShipment,
  collectOfflinePaymentAndReleaseShipment,
  formatDateTime,
  getAdminUsers,
  getOpsCourierDispatch,
  getOpsShipmentBoard,
  releasePointShipment,
  routeShipmentToPickup,
  type AdminUserSummary,
  type OpsCourierDispatchResponse,
  type OpsShipmentBoardItem,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';
import { useTranslation } from 'react-i18next';

function formatOwner(owner: string, t: (key: string) => string) {
  return t(`adminShipments.owner.${owner}`) !== `adminShipments.owner.${owner}` ? t(`adminShipments.owner.${owner}`) : owner;
}

function formatAction(action: string, t: (key: string) => string) {
  return t(`adminShipments.action.${action}`) !== `adminShipments.action.${action}` ? t(`adminShipments.action.${action}`) : action;
}

function explainAction(action: string, t: (key: string) => string) {
  const key = `adminShipments.explain.${action}`;
  const translated = t(key);
  return translated !== key ? translated : t('adminShipments.explainDefault');
}

function formatTaskType(taskType: string | null | undefined, t: (key: string) => string) {
  if (taskType === 'PICKUP') return t('adminShipments.taskTypePickup');
  if (taskType === 'DELIVERY') return t('adminShipments.taskTypeDelivery');
  return null;
}

function describeResponsibleActor(shipment: OpsShipmentBoardItem, t: (key: string, opts?: object) => string) {
  if (shipment.activeTaskType === 'PICKUP') {
    return shipment.assignedCourierEmail
      ? t('adminShipments.actorPickupCourier', { email: shipment.assignedCourierEmail })
      : t('adminShipments.actorPickupCity', { city: shipment.sourceCity ?? t('common.noData') });
  }
  if (shipment.nextActionOwner === 'POINT') {
    const pointCode =
      shipment.nextSuggestedAction === 'ACCEPT_REDIRECTED_SHIPMENT' || shipment.nextSuggestedAction === 'PICKUP_AT_POINT'
        ? shipment.targetPointCode
        : shipment.sourcePointCode ?? shipment.targetPointCode;
    return pointCode ? t('adminShipments.actorPoint', { code: pointCode }) : t('adminShipments.actorPointGeneric');
  }
  if (shipment.nextActionOwner === 'HUB') {
    return t('adminShipments.actorHub', { city: shipment.destinationCity ?? shipment.sourceCity ?? t('common.noData') });
  }
  if (shipment.assignedCourierEmail) {
    const taskType = formatTaskType(shipment.activeTaskType, t);
    return taskType
      ? `${taskType}: ${shipment.assignedCourierEmail}`
      : t('adminShipments.actorCourier', { email: shipment.assignedCourierEmail });
  }
  return null;
}

export default function AdminShipments() {
  const { t } = useTranslation();
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [shipments, setShipments] = useState<OpsShipmentBoardItem[]>([]);
  const [dispatch, setDispatch] = useState<OpsCourierDispatchResponse | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyShipmentId, setBusyShipmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<'ALL' | string>('ALL');
  const [actionFilter, setActionFilter] = useState<'ALL' | string>('ALL');
  const [courierSelections, setCourierSelections] = useState<Map<string, string>>(new Map());
  const isFullAdmin = currentUser?.adminScope !== 'DISPATCHER';

  const suggestions = useMemo(
    () => new Map((dispatch?.shipmentsAwaitingAssignment ?? []).map((item) => [item.shipmentId, item])),
    [dispatch],
  );
  const pointWorkerEmailByCode = useMemo(() => {
    const entries = adminUsers
      .filter((user) => user.roles.includes('point') && user.pointCode)
      .map((user) => [user.pointCode!, user.email] as const);
    return new Map(entries);
  }, [adminUsers]);

  const loadBoard = useCallback(async () => {
    if (!currentUser?.email) {
      setShipments([]);
      setDispatch(null);
      setAdminUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [shipmentsData, dispatchData, adminUsersData] = await Promise.all([
        getOpsShipmentBoard(currentUser.email),
        getOpsCourierDispatch(currentUser.email),
        isFullAdmin ? getAdminUsers(currentUser.email) : Promise.resolve([]),
      ]);
      setShipments(shipmentsData);
      setDispatch(dispatchData);
      setAdminUsers(adminUsersData);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('adminShipments.errorLoad'));
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email, isFullAdmin]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  async function runShipmentAction(shipmentId: string, action: () => Promise<unknown>) {
    setBusyShipmentId(shipmentId);
    setError(null);
    try {
      await action();
      await loadBoard();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('adminShipments.errorAction'));
    } finally {
      setBusyShipmentId(null);
    }
  }

  const filteredShipments = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    return shipments.filter((shipment) => {
      const matchesSearch =
        !searchValue ||
        shipment.trackingNumber.toLowerCase().includes(searchValue) ||
        (shipment.destinationCity ?? '').toLowerCase().includes(searchValue) ||
        (shipment.assignedCourierEmail ?? '').toLowerCase().includes(searchValue);
      const matchesOwner = ownerFilter === 'ALL' || shipment.nextActionOwner === ownerFilter;
      const matchesAction = actionFilter === 'ALL' || shipment.nextSuggestedAction === actionFilter;
      return matchesSearch && matchesOwner && matchesAction;
    });
  }, [actionFilter, ownerFilter, search, shipments]);

  const actionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    shipments.forEach((shipment) => {
      counts.set(shipment.nextSuggestedAction, (counts.get(shipment.nextSuggestedAction) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort((left, right) => right[1] - left[1]);
  }, [shipments]);
  const boardSummary = useMemo(
    () => ({
      prepare: shipments.filter((shipment) =>
        ['PREPARE_FOR_DISPATCH', 'ASSIGN_PICKUP_COURIER', 'POST_FROM_SOURCE'].includes(shipment.nextSuggestedAction),
      ).length,
      assign: shipments.filter((shipment) => shipment.nextSuggestedAction === 'ASSIGN_COURIER').length,
      courierCheckout: shipments.filter((shipment) => shipment.nextSuggestedAction === 'COLLECT_PAYMENT_AND_DELIVER').length,
      point: shipments.filter(
        (shipment) =>
          shipment.nextSuggestedAction === 'ACCEPT_REDIRECTED_SHIPMENT' || shipment.nextSuggestedAction === 'PICKUP_AT_POINT',
      ).length,
      blocked: shipments.filter((shipment) => Boolean(shipment.blockedReason)).length,
    }),
    [shipments],
  );

  const ownerOptions = Array.from(new Set(shipments.map((shipment) => shipment.nextActionOwner)));
  const actionOptions = Array.from(new Set(shipments.map((shipment) => shipment.nextSuggestedAction)));

  return (
    <DashboardShell role="admin" title={t('adminShipments.pageTitle')}>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl">{t('adminShipments.heading')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('adminShipments.desc')}</p>
        </div>

        <button
          type="button"
          onClick={() => void loadBoard()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.5fr,1fr,1fr,1fr]">
        <label className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('adminShipments.searchPlaceholder')}
            className="w-full bg-transparent outline-none"
          />
        </label>

        <select
          value={ownerFilter}
          onChange={(event) => setOwnerFilter(event.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm outline-none"
        >
          <option value="ALL">{t('common.filter')}</option>
          {ownerOptions.map((owner) => (
            <option key={owner} value={owner}>
              {formatOwner(owner, t)}
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm outline-none"
        >
          <option value="ALL">{t('common.filter')}</option>
          {actionOptions.map((action) => (
            <option key={action} value={action}>
              {formatAction(action, t)}
            </option>
          ))}
        </select>

        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="text-sm text-muted-foreground">{t('adminShipments.afterFilters')}</div>
          <div className="mt-1 text-2xl">{isLoading ? '...' : filteredShipments.length}</div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() => setActionFilter('PREPARE_FOR_DISPATCH')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="text-sm text-muted-foreground">{t('adminShipments.statPrepareTitle')}</div>
          <div className="mt-2 text-2xl">{boardSummary.prepare}</div>
          <div className="mt-2 text-sm text-muted-foreground">{t('adminShipments.statPrepareDesc')}</div>
        </button>
        <button
          type="button"
          onClick={() => setActionFilter('ASSIGN_COURIER')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="text-sm text-muted-foreground">{t('adminShipments.statAssignTitle')}</div>
          <div className="mt-2 text-2xl">{boardSummary.assign}</div>
          <div className="mt-2 text-sm text-muted-foreground">{t('adminShipments.statAssignDesc')}</div>
        </button>
        <button
          type="button"
          onClick={() => setActionFilter('COLLECT_PAYMENT_AND_DELIVER')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">{t('adminShipments.statCourierCheckoutTitle')}</div>
              <div className="mt-2 text-2xl">{boardSummary.courierCheckout}</div>
            </div>
            <CreditCard className="h-5 w-5 text-warning" />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">{t('adminShipments.statCourierCheckoutDesc')}</div>
        </button>
        <button
          type="button"
          onClick={() => setOwnerFilter('POINT')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="text-sm text-muted-foreground">{t('adminShipments.statPointTitle')}</div>
          <div className="mt-2 text-2xl">{boardSummary.point}</div>
          <div className="mt-2 text-sm text-muted-foreground">{t('adminShipments.statPointDesc')}</div>
        </button>
        <button
          type="button"
          onClick={() => {
            setOwnerFilter('ALL');
            setActionFilter('ALL');
          }}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="text-sm text-muted-foreground">{t('adminShipments.statBlockedTitle')}</div>
          <div className="mt-2 text-2xl">{boardSummary.blocked}</div>
          <div className="mt-2 text-sm text-muted-foreground">{t('adminShipments.statBlockedDesc')}</div>
        </button>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {actionCounts.slice(0, 4).map(([action, count]) => (
          <button
            key={action}
            type="button"
            onClick={() => setActionFilter(action)}
            className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
          >
            <div className="text-sm text-muted-foreground">{formatAction(action, t)}</div>
            <div className="mt-2 text-2xl">{count}</div>
            <div className="mt-2 text-sm text-muted-foreground">{explainAction(action, t)}</div>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? <div className="p-6">{t('adminShipments.loading')}</div> : null}

        {!isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('adminShipments.colTracking')}</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('adminShipments.colStatus')}</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('adminShipments.colDestination')}</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('adminShipments.colOwner')}</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('adminShipments.colSuggestion')}</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('adminShipments.colCourier')}</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('adminShipments.colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredShipments.map((shipment) => {
                  const suggestion = suggestions.get(shipment.shipmentId);
                  const isBusy = busyShipmentId === shipment.shipmentId;
                  const responsiblePointCode =
                    shipment.nextSuggestedAction === 'ACCEPT_REDIRECTED_SHIPMENT' || shipment.nextSuggestedAction === 'PICKUP_AT_POINT'
                      ? shipment.targetPointCode
                      : shipment.sourcePointCode ?? shipment.targetPointCode;
                  const pointWorkerEmail = responsiblePointCode
                    ? pointWorkerEmailByCode.get(responsiblePointCode)
                    : undefined;

                  return (
                    <tr key={shipment.shipmentId} className="align-top transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div>{shipment.trackingNumber}</div>
                        <div className="text-sm text-muted-foreground">{formatDateTime(shipment.createdAt)}</div>
                        {shipment.nextSuggestedAction === 'COLLECT_PAYMENT_AND_DELIVER' ? (
                          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1 text-xs text-warning">
                            <CreditCard className="h-3.5 w-3.5" />
                            {t('adminShipments.courierCollectionBadge')}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <div className="mb-2">
                          <StatusBadge status={shipment.shipmentStatus} />
                        </div>
                        <StatusBadge status={shipment.paymentStatus} type="payment" />
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div>{shipment.destinationCity ?? t('adminShipments.noCity')}</div>
                        <div>{shipment.targetPointCode ? t('adminShipments.actorPoint', { code: shipment.targetPointCode }) : t('adminShipments.doorDelivery')}</div>
                        {shipment.activeTaskType === 'PICKUP' ? (
                          <div className="mt-1">{t('adminShipments.pickupFromSenderNote', { city: shipment.sourceCity ?? t('adminShipments.noCity').toLowerCase() })}</div>
                        ) : null}
                        {shipment.nextSuggestedAction === 'COLLECT_PAYMENT_AND_DELIVER' ? (
                          <div className="mt-1 text-warning">{t('adminShipments.collectionPaymentNote')}</div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>{formatOwner(shipment.nextActionOwner, t)}</div>
                        {describeResponsibleActor(shipment, t) ? (
                          <div className="mt-1 text-xs text-muted-foreground">{describeResponsibleActor(shipment, t)}</div>
                        ) : null}
                        {pointWorkerEmail && shipment.nextActionOwner === 'POINT' ? (
                          <div className="mt-1 text-xs text-muted-foreground">{t('adminShipments.operatorLabel', { email: pointWorkerEmail })}</div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div>{formatAction(shipment.nextSuggestedAction, t)}</div>
                        {shipment.blockedReason ? <div className="mt-1">{shipment.blockedReason}</div> : null}
                        {suggestion?.suggestionReason ? <div className="mt-1">{suggestion.suggestionReason}</div> : null}
                        {shipment.nextSuggestedAction === 'COLLECT_PAYMENT_AND_DELIVER' ? (
                          <div className="mt-1">{t('adminShipments.courierMonitorDetail')}</div>
                        ) : null}
                        <div className="mt-2 rounded-lg bg-secondary p-3 text-sm">{explainAction(shipment.nextSuggestedAction, t)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div>{shipment.assignedCourierEmail ?? suggestion?.suggestedCourierEmail ?? t('adminShipments.noCourier')}</div>
                        {formatTaskType(shipment.activeTaskType, t) ? (
                          <div className="mt-1">{formatTaskType(shipment.activeTaskType, t)}</div>
                        ) : null}
                        {shipment.nextSuggestedAction === 'COLLECT_PAYMENT_AND_DELIVER' ? (
                          <div className="mt-1 text-warning">{t('adminShipments.courierMonitorNote')}</div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        {shipment.nextSuggestedAction === 'PREPARE_FOR_DISPATCH' ? (
                          <div className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                            {t('adminShipments.pointAcceptsShipment')}
                          </div>
                        ) : null}

                        {shipment.nextSuggestedAction === 'ASSIGN_COURIER' || shipment.nextSuggestedAction === 'ASSIGN_PICKUP_COURIER' ? (() => {
                          const selectedId = courierSelections.get(shipment.shipmentId) ?? suggestion?.suggestedCourierId ?? '';
                          return (
                            <div className="space-y-2">
                              <select
                                value={selectedId}
                                onChange={(e) =>
                                  setCourierSelections((prev) => new Map(prev).set(shipment.shipmentId, e.target.value))
                                }
                                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none"
                              >
                                <option value="">{t('adminShipments.chooseCourier')}</option>
                                {(dispatch?.couriers ?? []).map((courier) => (
                                  <option key={courier.courierId} value={courier.courierId}>
                                    {courier.courierEmail}
                                    {courier.inferredServiceCity ? ` (${courier.inferredServiceCity})` : ''}
                                    {courier.courierId === suggestion?.suggestedCourierId ? ' ★' : ''}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={isBusy || !currentUser?.email || !selectedId}
                                onClick={() =>
                                  currentUser?.email &&
                                  selectedId &&
                                  runShipmentAction(shipment.shipmentId, () =>
                                    assignCourierToShipment(currentUser.email, shipment.shipmentId, selectedId),
                                  )
                                }
                                className="w-full rounded-lg bg-success px-3 py-2 text-sm text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                              >
                                {isBusy
                                  ? t('adminShipments.assigning')
                                  : shipment.nextSuggestedAction === 'ASSIGN_PICKUP_COURIER'
                                    ? t('adminShipments.assignPickupCourier')
                                    : t('adminShipments.assignCourier')}
                              </button>
                            </div>
                          );
                        })() : null}

                        {shipment.nextSuggestedAction === 'ACCEPT_REDIRECTED_SHIPMENT' ? (
                          pointWorkerEmail ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                runShipmentAction(shipment.shipmentId, () =>
                                  acceptPointShipment(pointWorkerEmail, shipment.trackingNumber),
                                )
                              }
                              className="rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                            >
                              {t('adminShipments.acceptAtPoint')}
                            </button>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {t('adminShipments.pointActionNote')}{!isFullAdmin ? ' i scope ADMIN.' : '.'}
                            </div>
                          )
                        ) : null}

                        {shipment.nextSuggestedAction === 'ROUTE_TO_PICKUP_POINT' ? (
                          <button
                            type="button"
                            disabled={isBusy || !currentUser?.email}
                            onClick={() =>
                              currentUser?.email &&
                              runShipmentAction(shipment.shipmentId, () =>
                                routeShipmentToPickup(currentUser.email, shipment.shipmentId),
                              )
                            }
                            className="rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                          >
                            {t('adminShipments.routeToPoint')}
                          </button>
                        ) : null}

                        {shipment.nextSuggestedAction === 'CONFIRM_OFFLINE_PAYMENT' ? (
                          pointWorkerEmail ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                runShipmentAction(shipment.shipmentId, () =>
                                  collectOfflinePaymentAndReleaseShipment(pointWorkerEmail, shipment.trackingNumber),
                                )
                              }
                              className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                            >
                              {t('adminShipments.collectAndRelease')}
                            </button>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {t('adminShipments.pointActionNote')}{!isFullAdmin ? ' i scope ADMIN.' : '.'}
                            </div>
                          )
                        ) : null}

                        {shipment.nextSuggestedAction === 'PICKUP_AT_POINT' ? (
                          pointWorkerEmail ? (
                            shipment.paymentStatus === 'OFFLINE_PENDING' ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  runShipmentAction(shipment.shipmentId, () =>
                                    collectOfflinePaymentAndReleaseShipment(pointWorkerEmail, shipment.trackingNumber),
                                  )
                                }
                                className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                              >
                                {t('adminShipments.collectAndRelease')}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  runShipmentAction(shipment.shipmentId, () =>
                                    releasePointShipment(pointWorkerEmail, shipment.trackingNumber),
                                  )
                                }
                                className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                              >
                                {t('adminShipments.releaseAtPoint')}
                              </button>
                            )
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {t('adminShipments.pointActionNote')}{!isFullAdmin ? ' i scope ADMIN.' : '.'}
                            </div>
                          )
                        ) : null}

                        {shipment.nextSuggestedAction === 'COLLECT_PAYMENT_AND_DELIVER' ? (
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div>{t('adminShipments.courierMonitorNote')}</div>
                            <div className="rounded-lg bg-secondary px-3 py-2">
                              {t('adminShipments.courierMonitorDetail')}
                            </div>
                          </div>
                        ) : null}

                        {['ACCEPT_PICKUP_TASK', 'START_PICKUP_ROUTE', 'COMPLETE_PICKUP_FROM_SENDER'].includes(shipment.nextSuggestedAction) ? (
                          <div className="text-sm text-muted-foreground">
                            {t('adminShipments.pickupCourierNote')}
                          </div>
                        ) : null}

                        {![
                          'PREPARE_FOR_DISPATCH',
                          'POST_FROM_SOURCE',
                          'ASSIGN_PICKUP_COURIER',
                          'ASSIGN_COURIER',
                          'ROUTE_TO_PICKUP_POINT',
                          'ACCEPT_REDIRECTED_SHIPMENT',
                          'PICKUP_AT_POINT',
                          'CONFIRM_OFFLINE_PAYMENT',
                          'COLLECT_PAYMENT_AND_DELIVER',
                          'ACCEPT_PICKUP_TASK',
                          'START_PICKUP_ROUTE',
                          'COMPLETE_PICKUP_FROM_SENDER',
                        ].includes(shipment.nextSuggestedAction) ? (
                          <div className="text-sm text-muted-foreground">{t('adminShipments.noQuickAction')}</div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
