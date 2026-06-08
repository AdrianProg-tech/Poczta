import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreditCard, MapPin, RefreshCw, Search, Truck } from 'lucide-react';
import {
  cancelPayment,
  failPayment,
  formatCurrency,
  formatDateTime,
  formatPaymentStatus,
  formatShipmentStatus,
  getAdminPayments,
  markPaymentPaid,
  type AdminPaymentSummary,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';
import { useTranslation } from 'react-i18next';

type PaymentOwnerBucket = 'FINANCE' | 'POINT' | 'COURIER' | 'ARCHIVE';

function formatAdminPaymentMethod(method: string | null | undefined, t: (key: string) => string) {
  switch (method) {
    case 'ONLINE':
      return t('adminPayments.methodOnline');
    case 'OFFLINE_AT_POINT':
      return t('adminPayments.methodAtPoint');
    case 'OFFLINE_AT_COURIER':
      return t('adminPayments.methodAtCourier');
    default:
      return method ?? t('adminPayments.methodUnknown');
  }
}

function formatCollectionMethod(method: string | null | undefined, t: (key: string) => string) {
  switch (method) {
    case 'CASH':
      return t('adminPayments.collectionCash');
    case 'CARD':
      return t('adminPayments.collectionCard');
    default:
      return t('adminPayments.collectionChoose');
  }
}

export function getPaymentOpsOwner(payment: AdminPaymentSummary): PaymentOwnerBucket {
  if (payment.status === 'PENDING' || payment.status === 'FAILED') {
    return 'FINANCE';
  }

  if (payment.status === 'OFFLINE_PENDING' && payment.method === 'OFFLINE_AT_POINT') {
    return 'POINT';
  }

  if (payment.status === 'OFFLINE_PENDING' && payment.method === 'OFFLINE_AT_COURIER') {
    return 'COURIER';
  }

  return 'ARCHIVE';
}

export function getPaymentOpsHint(payment: AdminPaymentSummary, t: (key: string) => string) {
  if (payment.status === 'PENDING') {
    return t('adminPayments.hintPending');
  }

  if (payment.status === 'FAILED') {
    return t('adminPayments.hintFailed');
  }

  if (payment.status === 'OFFLINE_PENDING' && payment.method === 'OFFLINE_AT_POINT') {
    return t('adminPayments.hintOfflinePoint');
  }

  if (payment.status === 'OFFLINE_PENDING' && payment.method === 'OFFLINE_AT_COURIER') {
    return t('adminPayments.hintOfflineCourier');
  }

  if (payment.status === 'OFFLINE_CONFIRMED') {
    return t('adminPayments.hintOfflineConfirmed');
  }

  return t('adminPayments.hintDefault');
}

export function canMarkPaymentPaid(payment: AdminPaymentSummary) {
  return payment.method === 'ONLINE' && payment.status === 'PENDING';
}

export function canFailPayment(payment: AdminPaymentSummary) {
  return payment.method === 'ONLINE' && payment.status === 'PENDING';
}

export function canCancelPayment(payment: AdminPaymentSummary) {
  return payment.status === 'PENDING' || payment.status === 'OFFLINE_PENDING';
}

function formatOwnerLabel(owner: PaymentOwnerBucket, t: (key: string) => string) {
  switch (owner) {
    case 'FINANCE':
      return t('adminPayments.ownerFinance');
    case 'POINT':
      return t('adminPayments.ownerPoint');
    case 'COURIER':
      return t('adminPayments.ownerCourier');
    default:
      return t('adminPayments.ownerArchive');
  }
}

export default function AdminPayments() {
  const { t } = useTranslation();
  const {
    state: { currentUser },
  } = useAppStateContext();

  const [payments, setPayments] = useState<AdminPaymentSummary[]>([]);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<'ALL' | PaymentOwnerBucket>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL');

  const loadPayments = useCallback(async () => {
    if (!currentUser?.email) {
      setPayments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setPayments(await getAdminPayments(currentUser.email));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('adminPayments.errorLoad'));
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  async function runPaymentAction(paymentId: string, action: () => Promise<unknown>) {
    setBusyPaymentId(paymentId);
    setError(null);
    try {
      await action();
      await loadPayments();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('adminPayments.errorAction'));
    } finally {
      setBusyPaymentId(null);
    }
  }

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return payments.filter((payment) => {
      const owner = getPaymentOpsOwner(payment);
      const matchesSearch =
        !query ||
        payment.trackingNumber.toLowerCase().includes(query) ||
        (payment.clientEmail ?? '').toLowerCase().includes(query) ||
        (payment.externalReference ?? '').toLowerCase().includes(query);
      const matchesOwner = ownerFilter === 'ALL' || owner === ownerFilter;
      const matchesStatus = statusFilter === 'ALL' || payment.status === statusFilter;
      return matchesSearch && matchesOwner && matchesStatus;
    });
  }, [ownerFilter, payments, search, statusFilter]);

  const summary = useMemo(
    () => ({
      total: payments.length,
      finance: payments.filter((payment) => getPaymentOpsOwner(payment) === 'FINANCE').length,
      point: payments.filter((payment) => getPaymentOpsOwner(payment) === 'POINT').length,
      courier: payments.filter((payment) => getPaymentOpsOwner(payment) === 'COURIER').length,
      confirmedOffline: payments.filter((payment) => payment.status === 'OFFLINE_CONFIRMED').length,
    }),
    [payments],
  );

  const ownerOptions: PaymentOwnerBucket[] = ['FINANCE', 'POINT', 'COURIER', 'ARCHIVE'];
  const statusOptions = Array.from(new Set(payments.map((payment) => payment.status)));

  const financeQueue = filteredPayments.filter((payment) => getPaymentOpsOwner(payment) === 'FINANCE');
  const pointQueue = filteredPayments.filter((payment) => getPaymentOpsOwner(payment) === 'POINT');
  const courierQueue = filteredPayments.filter((payment) => getPaymentOpsOwner(payment) === 'COURIER');
  const archiveQueue = filteredPayments.filter((payment) => getPaymentOpsOwner(payment) === 'ARCHIVE');

  return (
    <DashboardShell role="admin" title={t('adminPayments.pageTitle')}>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl">{t('adminPayments.heading')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('adminPayments.desc')}</p>
        </div>

        <button
          type="button"
          onClick={() => void loadPayments()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">{t('adminPayments.statAll')}</div>
          <div className="mt-2 text-2xl">{summary.total}</div>
        </div>
        <button
          type="button"
          onClick={() => setOwnerFilter('FINANCE')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="text-sm text-muted-foreground">{t('adminPayments.statFinanceTitle')}</div>
          <div className="mt-2 text-2xl">{summary.finance}</div>
          <div className="mt-2 text-sm text-muted-foreground">{t('adminPayments.statFinanceDesc')}</div>
        </button>
        <button
          type="button"
          onClick={() => setOwnerFilter('POINT')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">{t('adminPayments.statPointTitle')}</div>
              <div className="mt-2 text-2xl">{summary.point}</div>
            </div>
            <MapPin className="h-5 w-5 text-info" />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">{t('adminPayments.statPointDesc')}</div>
        </button>
        <button
          type="button"
          onClick={() => setOwnerFilter('COURIER')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">{t('adminPayments.statCourierTitle')}</div>
              <div className="mt-2 text-2xl">{summary.courier}</div>
            </div>
            <Truck className="h-5 w-5 text-warning" />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">{t('adminPayments.statCourierDesc')}</div>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('OFFLINE_CONFIRMED')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">{t('adminPayments.statConfirmedTitle')}</div>
              <div className="mt-2 text-2xl">{summary.confirmedOffline}</div>
            </div>
            <CreditCard className="h-5 w-5 text-success" />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">{t('adminPayments.statConfirmedDesc')}</div>
        </button>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.5fr,1fr,1fr,1fr]">
        <label className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('adminPayments.searchPlaceholder')}
            className="w-full bg-transparent outline-none"
          />
        </label>

        <select
          value={ownerFilter}
          onChange={(event) => setOwnerFilter(event.target.value as 'ALL' | PaymentOwnerBucket)}
          className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm outline-none"
        >
          <option value="ALL">{t('adminPayments.filterAllOwners')}</option>
          {ownerOptions.map((owner) => (
            <option key={owner} value={owner}>
              {formatOwnerLabel(owner, t)}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm outline-none"
        >
          <option value="ALL">{t('adminPayments.filterAllStatuses')}</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {formatPaymentStatus(status)}
            </option>
          ))}
        </select>

        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="text-sm text-muted-foreground">{t('adminPayments.afterFilters')}</div>
          <div className="mt-1 text-2xl">{isLoading ? '...' : filteredPayments.length}</div>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
              <h3 className="text-lg">{t('adminPayments.financeQueueTitle')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('adminPayments.financeQueueDesc')}</p>
          </div>
          <div className="space-y-4 p-6">
            {financeQueue.length ? (
              financeQueue.map((payment) => {
                const isBusy = busyPaymentId === payment.paymentId;
                return (
                  <div key={payment.paymentId} className="rounded-lg bg-secondary p-4">
                    <div className="mb-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div>{payment.trackingNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {payment.clientEmail ?? t('adminPayments.noClient')} | {formatDateTime(payment.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div>{formatCurrency(payment.amount)}</div>
                        <StatusBadge status={payment.status} type="payment" />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatAdminPaymentMethod(payment.method, t)} | {t('adminPayments.shipmentLabel')}: {formatShipmentStatus(payment.shipmentStatus)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{getPaymentOpsHint(payment, t)}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {canMarkPaymentPaid(payment) ? (
                        <button
                          type="button"
                          disabled={isBusy || !currentUser?.email}
                          onClick={() =>
                            currentUser?.email &&
                            runPaymentAction(payment.paymentId, () => markPaymentPaid(currentUser.email, payment.paymentId))
                          }
                          className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                        >
                          {t('adminPayments.markPaid')}
                        </button>
                      ) : null}
                      {canFailPayment(payment) ? (
                        <button
                          type="button"
                          disabled={isBusy || !currentUser?.email}
                          onClick={() =>
                            currentUser?.email &&
                            runPaymentAction(payment.paymentId, () => failPayment(currentUser.email, payment.paymentId))
                          }
                          className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                        >
                          {t('adminPayments.markFailed')}
                        </button>
                      ) : null}
                      {canCancelPayment(payment) ? (
                        <button
                          type="button"
                          disabled={isBusy || !currentUser?.email}
                          onClick={() =>
                            currentUser?.email &&
                            runPaymentAction(payment.paymentId, () => cancelPayment(currentUser.email, payment.paymentId))
                          }
                          className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                        >
                          {t('adminPayments.cancel')}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-muted-foreground">{t('adminPayments.emptyFinance')}</div>
            )}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-6">
              <h3 className="text-lg">{t('adminPayments.pointQueueTitle')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t('adminPayments.pointQueueDesc')}</p>
            </div>
            <div className="space-y-4 p-6">
              {pointQueue.length ? (
                pointQueue.map((payment) => (
                  <div key={payment.paymentId} className="rounded-lg bg-secondary p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>{payment.trackingNumber}</div>
                      <StatusBadge status={payment.status} type="payment" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(payment.amount)} | {t('adminPayments.shipmentLabel')}: {formatShipmentStatus(payment.shipmentStatus)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{getPaymentOpsHint(payment, t)}</div>
                    <div className="mt-3 rounded-lg bg-card px-3 py-2 text-sm text-muted-foreground">
                      {t('adminPayments.monitoringOnlyPoint')}
                    </div>
                    {canCancelPayment(payment) ? (
                      <div className="mt-3">
                        <button
                          type="button"
                          disabled={busyPaymentId === payment.paymentId || !currentUser?.email}
                          onClick={() =>
                            currentUser?.email &&
                            runPaymentAction(payment.paymentId, () => cancelPayment(currentUser.email, payment.paymentId))
                          }
                          className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                        >
                          {t('adminPayments.cancel')}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground">{t('adminPayments.emptyPoint')}</div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-6">
              <h3 className="text-lg">{t('adminPayments.courierQueueTitle')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t('adminPayments.courierQueueDesc')}</p>
            </div>
            <div className="space-y-4 p-6">
              {courierQueue.length ? (
                courierQueue.map((payment) => (
                  <div key={payment.paymentId} className="rounded-lg bg-secondary p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>{payment.trackingNumber}</div>
                      <StatusBadge status={payment.status} type="payment" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(payment.amount)} | Przesylka: {formatShipmentStatus(payment.shipmentStatus)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{getPaymentOpsHint(payment, t)}</div>
                    <div className="mt-3 rounded-lg bg-card px-3 py-2 text-sm text-muted-foreground">
                      {t('adminPayments.monitoringOnlyCourier')}
                    </div>
                    {canCancelPayment(payment) ? (
                      <div className="mt-3">
                        <button
                          type="button"
                          disabled={busyPaymentId === payment.paymentId || !currentUser?.email}
                          onClick={() =>
                            currentUser?.email &&
                            runPaymentAction(payment.paymentId, () => cancelPayment(currentUser.email, payment.paymentId))
                          }
                          className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                        >
                          {t('adminPayments.cancel')}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground">{t('adminPayments.emptyCourier')}</div>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h3 className="text-lg">{t('adminPayments.archiveTitle')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('adminPayments.archiveDesc')}</p>
          </div>
          <div className="space-y-4 p-6">
            {archiveQueue.length ? (
              archiveQueue.map((payment) => (
                <div key={payment.paymentId} className="rounded-lg bg-secondary p-4">
                  <div className="mb-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div>{payment.trackingNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {payment.clientEmail ?? t('adminPayments.noClient')} | {formatDateTime(payment.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div>{formatCurrency(payment.amount)}</div>
                      <StatusBadge status={payment.status} type="payment" />
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                    <div>{t('adminPayments.methodLabel')}: {formatAdminPaymentMethod(payment.method, t)}</div>
                    <div>{t('adminPayments.collectionLabel')}: {formatCollectionMethod(payment.collectionMethod, t)}</div>
                    <div>{t('adminPayments.shipmentLabel')}: {formatShipmentStatus(payment.shipmentStatus)}</div>
                    <div>{t('adminPayments.referenceLabel')}: {payment.externalReference ?? t('adminPayments.noReference')}</div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{getPaymentOpsHint(payment, t)}</div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">{t('adminPayments.emptyArchive')}</div>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
