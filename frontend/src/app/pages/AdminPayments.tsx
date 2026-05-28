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

function formatAdminPaymentMethod(method: string | null | undefined) {
  switch (method) {
    case 'ONLINE':
      return 'Online';
    case 'OFFLINE_AT_POINT':
      return 'Platnosc w punkcie';
    case 'OFFLINE_AT_COURIER':
      return 'Platnosc u kuriera';
    default:
      return method ?? 'Nieznana';
  }
}

function formatCollectionMethod(method: string | null | undefined) {
  switch (method) {
    case 'CASH':
      return 'Gotowka';
    case 'CARD':
      return 'Karta';
    default:
      return 'Do wyboru';
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

export function getPaymentOpsHint(payment: AdminPaymentSummary) {
  if (payment.status === 'PENDING') {
    return 'Czeka na finalne potwierdzenie online albo reczna decyzje zespolu finansowego.';
  }

  if (payment.status === 'FAILED') {
    return 'Platnosc nie przeszla i wymaga decyzji: ponowienia po stronie klienta albo anulowania.';
  }

  if (payment.status === 'OFFLINE_PENDING' && payment.method === 'OFFLINE_AT_POINT') {
    return 'Punkt powinien domknac platnosc przy wydaniu albo w osobnym kroku finansowym.';
  }

  if (payment.status === 'OFFLINE_PENDING' && payment.method === 'OFFLINE_AT_COURIER') {
    return 'Kurier musi pobrac gotowke albo karte i dopiero potem zamknac zadanie doreczenia.';
  }

  if (payment.status === 'OFFLINE_CONFIRMED') {
    return 'Platnosc offline jest zamknieta. Warto tylko sprawdzic sposob pobrania i finalny status przesylki.';
  }

  return 'Platnosc nie wymaga teraz aktywnej interwencji operacyjnej.';
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

function formatOwnerLabel(owner: PaymentOwnerBucket) {
  switch (owner) {
    case 'FINANCE':
      return 'Finanse';
    case 'POINT':
      return 'Punkt';
    case 'COURIER':
      return 'Kurier';
    default:
      return 'Archiwum';
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
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie pobrac platnosci.');
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
      setError(requestError instanceof Error ? requestError.message : 'Operacja na platnosci nie powiodla sie.');
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
    <DashboardShell role="admin" title="Platnosci">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl">Finanse i platnosci offline</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Widok rozdziela platnosci online, rozliczenia w punkcie i rozliczenia u kuriera, zeby od razu bylo widac,
            kto ma domknac dany etap.
          </p>
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
          <div className="text-sm text-muted-foreground">Wszystkie platnosci</div>
          <div className="mt-2 text-2xl">{summary.total}</div>
        </div>
        <button
          type="button"
          onClick={() => setOwnerFilter('FINANCE')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="text-sm text-muted-foreground">Kolejka finansowa</div>
          <div className="mt-2 text-2xl">{summary.finance}</div>
          <div className="mt-2 text-sm text-muted-foreground">Platnosci online oczekujace albo nieudane do recznej decyzji.</div>
        </button>
        <button
          type="button"
          onClick={() => setOwnerFilter('POINT')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">Platnosc w punkcie</div>
              <div className="mt-2 text-2xl">{summary.point}</div>
            </div>
            <MapPin className="h-5 w-5 text-info" />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">Platnosci offline oczekujace, ktore powinny zejsc przez punkt.</div>
        </button>
        <button
          type="button"
          onClick={() => setOwnerFilter('COURIER')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">Platnosc u kuriera</div>
              <div className="mt-2 text-2xl">{summary.courier}</div>
            </div>
            <Truck className="h-5 w-5 text-warning" />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">Cash/card collection do domkniecia przy doreczeniu.</div>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('OFFLINE_CONFIRMED')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">Offline potwierdzone</div>
              <div className="mt-2 text-2xl">{summary.confirmedOffline}</div>
            </div>
            <CreditCard className="h-5 w-5 text-success" />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">Zamkniete rozliczenia ze sposobem pobrania do audytu.</div>
        </button>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.5fr,1fr,1fr,1fr]">
        <label className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Szukaj po trackingu, kliencie albo referencji"
            className="w-full bg-transparent outline-none"
          />
        </label>

        <select
          value={ownerFilter}
          onChange={(event) => setOwnerFilter(event.target.value as 'ALL' | PaymentOwnerBucket)}
          className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm outline-none"
        >
          <option value="ALL">Wszyscy ownerzy</option>
          {ownerOptions.map((owner) => (
            <option key={owner} value={owner}>
              {formatOwnerLabel(owner)}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm outline-none"
        >
          <option value="ALL">Wszystkie statusy</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {formatPaymentStatus(status)}
            </option>
          ))}
        </select>

        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="text-sm text-muted-foreground">Po filtrach</div>
          <div className="mt-1 text-2xl">{isLoading ? '...' : filteredPayments.length}</div>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
              <h3 className="text-lg">Kolejka finansowa</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Platnosci online, ktore wymagaja recznej decyzji po stronie finansow albo admina.
            </p>
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
                          {payment.clientEmail ?? 'brak klienta'} | {formatDateTime(payment.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div>{formatCurrency(payment.amount)}</div>
                        <StatusBadge status={payment.status} type="payment" />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatAdminPaymentMethod(payment.method)} | Przesylka: {formatShipmentStatus(payment.shipmentStatus)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{getPaymentOpsHint(payment)}</div>
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
                          Oznacz jako oplacona
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
                          Oznacz jako nieudana
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
                          Anuluj
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-muted-foreground">Brak wyjatkow platniczych po filtrach.</div>
            )}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-6">
              <h3 className="text-lg">Kolejka platnosci w punkcie</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Przypadki `OFFLINE_PENDING`, ktore powinny domknac sie przy wydaniu w punkcie.
              </p>
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
                      {formatCurrency(payment.amount)} | Przesylka: {formatShipmentStatus(payment.shipmentStatus)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{getPaymentOpsHint(payment)}</div>
                    <div className="mt-3 rounded-lg bg-card px-3 py-2 text-sm text-muted-foreground">
                      Tylko do monitoringu: szybka akcja pozostaje w `point/payment-verification` albo `admin/shipments`.
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
                          Anuluj
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground">Brak przypadkow platnosci w punkcie po filtrach.</div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-6">
              <h3 className="text-lg">Kolejka platnosci u kuriera</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Oczekujace platnosci gotowka lub karta, ktore musza zejsc po stronie kuriera przed `DELIVERED`.
              </p>
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
                    <div className="mt-1 text-sm text-muted-foreground">{getPaymentOpsHint(payment)}</div>
                    <div className="mt-3 rounded-lg bg-card px-3 py-2 text-sm text-muted-foreground">
                      Tylko do monitoringu: sposob pobrania pojawi sie dopiero po poprawnym zamknieciu platnosci u kuriera.
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
                          Anuluj
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground">Brak przypadkow platnosci u kuriera po filtrach.</div>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h3 className="text-lg">Zamkniete i zarchiwizowane</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Potwierdzone offline, oplacone albo anulowane przypadki do szybkiego audytu sposobu pobrania i finalnego
              statusu przesylki.
            </p>
          </div>
          <div className="space-y-4 p-6">
            {archiveQueue.length ? (
              archiveQueue.map((payment) => (
                <div key={payment.paymentId} className="rounded-lg bg-secondary p-4">
                  <div className="mb-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div>{payment.trackingNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {payment.clientEmail ?? 'brak klienta'} | {formatDateTime(payment.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div>{formatCurrency(payment.amount)}</div>
                      <StatusBadge status={payment.status} type="payment" />
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                    <div>Metoda: {formatAdminPaymentMethod(payment.method)}</div>
                    <div>Sposob pobrania: {formatCollectionMethod(payment.collectionMethod)}</div>
                    <div>Przesylka: {formatShipmentStatus(payment.shipmentStatus)}</div>
                    <div>Referencja: {payment.externalReference ?? 'brak'}</div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{getPaymentOpsHint(payment)}</div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">Brak archived payments po filtrach.</div>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
