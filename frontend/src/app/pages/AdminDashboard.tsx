import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, CreditCard, Package, RefreshCw, Truck } from 'lucide-react';
import {
  acceptComplaint,
  assignCourierToShipment,
  failPayment,
  formatComplaintStatus,
  formatComplaintType,
  formatCurrency,
  formatDateTime,
  formatPaymentMethod,
  formatPaymentStatus,
  getAdminComplaints,
  getAdminPayments,
  getOpsCourierDispatch,
  getOpsDashboardSummary,
  getOpsRecentEvents,
  getOpsShipmentBoard,
  markPaymentPaid,
  prepareShipmentForDispatch,
  reassignCourierForShipment,
  startComplaintReview,
  type AdminComplaintSummary,
  type AdminPaymentSummary,
  type OpsCourierDispatchResponse,
  type OpsDashboardSummary,
  type OpsRecentEvent,
  type OpsShipmentBoardItem,
} from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';
import { useTranslation } from 'react-i18next';

function formatCourierLoadLabel(openTasks: number, inProgressTasks: number, failedTasks: number) {
  return `otwarte ${openTasks} / w trasie ${inProgressTasks} / nieudane ${failedTasks}`;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [summary, setSummary] = useState<OpsDashboardSummary | null>(null);
  const [dispatch, setDispatch] = useState<OpsCourierDispatchResponse | null>(null);
  const [shipmentBoard, setShipmentBoard] = useState<OpsShipmentBoardItem[]>([]);
  const [payments, setPayments] = useState<AdminPaymentSummary[]>([]);
  const [complaints, setComplaints] = useState<AdminComplaintSummary[]>([]);
  const [events, setEvents] = useState<OpsRecentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFullAdmin = currentUser?.adminScope !== 'DISPATCHER';

  const loadDashboard = useCallback(async () => {
    if (!currentUser?.email) {
      setSummary(null);
      setDispatch(null);
      setShipmentBoard([]);
      setPayments([]);
      setComplaints([]);
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [summaryData, dispatchData, shipmentBoardData, eventData, paymentsData, complaintsData] = await Promise.all([
        getOpsDashboardSummary(currentUser.email),
        getOpsCourierDispatch(currentUser.email),
        getOpsShipmentBoard(currentUser.email),
        getOpsRecentEvents(currentUser.email),
        isFullAdmin ? getAdminPayments(currentUser.email) : Promise.resolve([]),
        isFullAdmin ? getAdminComplaints(currentUser.email) : Promise.resolve([]),
      ]);

      setSummary(summaryData);
      setDispatch(dispatchData);
      setShipmentBoard(shipmentBoardData);
      setEvents(eventData);
      setPayments(paymentsData);
      setComplaints(complaintsData);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie odswiezyc panelu operacyjnego.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email, isFullAdmin]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function runDashboardAction(key: string, action: () => Promise<unknown>) {
    setBusyKey(key);
    setError(null);
    try {
      await action();
      await loadDashboard();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Operacja z dashboardu nie powiodla sie.');
    } finally {
      setBusyKey(null);
    }
  }

  const stats = [
    { label: 'Wszystkie przesylki', value: summary?.totalShipments ?? 0, icon: Package, color: 'text-accent' },
    { label: 'Bledne platnosci', value: summary?.paymentFailedShipments ?? 0, icon: CreditCard, color: 'text-destructive' },
    { label: 'Aktywne taski kurierow', value: summary?.activeCourierTasks ?? 0, icon: Truck, color: 'text-info' },
    { label: 'Reklamacje w analizie', value: summary?.complaintsInReview ?? 0, icon: AlertCircle, color: 'text-warning' },
  ];

  const focusItems = useMemo(
    () => [
      {
        title: 'Do przygotowania',
        value: summary?.readyForDispatchShipments ?? 0,
        description: 'Oplacone przesylki czekajace na przygotowanie do wysylki.',
      },
      {
        title: 'Czekaja na kuriera',
        value: summary?.awaitingCourierAssignmentShipments ?? 0,
        description: 'Przesylki gotowe do dispatchu, ale bez zadania kuriera.',
      },
      {
        title: 'Platnosc u kuriera',
        value: shipmentBoard.filter((item) => item.nextSuggestedAction === 'COLLECT_PAYMENT_AND_DELIVER').length,
        description: 'Dostawy z pobraniem, w ktorych kurier musi domknac gotowke albo karte przy drzwiach.',
      },
      {
        title: 'Redirect do punktu',
        value: summary?.redirectedToPickupShipments ?? 0,
        description: 'Przesylki po nieudanej probie doreczenia, jeszcze nie przyjete w punkcie.',
      },
      {
        title: 'Do odbioru',
        value: summary?.awaitingPickupShipments ?? 0,
        description: 'Przesylki czekajace na klienta w flow odbioru.',
      },
    ],
    [shipmentBoard, summary],
  );

  const prepareQueue = useMemo(
    () => shipmentBoard.filter((item) => item.nextSuggestedAction === 'PREPARE_FOR_DISPATCH').slice(0, 6),
    [shipmentBoard],
  );

  const dispatcherQueue = useMemo(
    () =>
      shipmentBoard
        .filter((item) => item.nextSuggestedAction === 'ASSIGN_COURIER')
        .map((item) => ({
          shipment: item,
          suggestion: dispatch?.shipmentsAwaitingAssignment.find((candidate) => candidate.shipmentId === item.shipmentId) ?? null,
        }))
        .slice(0, 6),
    [dispatch, shipmentBoard],
  );

  const courierCheckoutQueue = useMemo(
    () => shipmentBoard.filter((item) => item.nextSuggestedAction === 'COLLECT_PAYMENT_AND_DELIVER').slice(0, 6),
    [shipmentBoard],
  );

  const paymentQueue = useMemo(
    () => payments.filter((payment) => payment.status === 'PENDING' || payment.status === 'FAILED').slice(0, 5),
    [payments],
  );

  const reassignmentQueue = useMemo(() => dispatch?.shipmentsAwaitingReassignment.slice(0, 6) ?? [], [dispatch]);

  const complaintQueue = useMemo(
    () => complaints.filter((complaint) => complaint.status === 'NEW' || complaint.status === 'IN_REVIEW').slice(0, 5),
    [complaints],
  );

  return (
    <DashboardShell role="admin" title="Panel operacyjny">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="mb-2 text-2xl">Panel operacyjny</h2>
          <p className="text-muted-foreground">
            Widok jest oparty o biezacy model operacyjny `/api/ops/*` i pozwala wykonywac najwazniejsze akcje bez
            schodzenia do osobnych ekranow.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div className="text-3xl">{isLoading ? '...' : stat.value}</div>
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {focusItems.map((item) => (
          <div key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="text-sm text-muted-foreground">{item.title}</div>
            <div className="mt-2 text-3xl">{isLoading ? '...' : item.value}</div>
            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>

      {isFullAdmin && (paymentQueue.length > 0 || complaintQueue.length > 0) ? (
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          {paymentQueue.length > 0 ? (
            <Link
              to="/admin/payments"
              className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-5 transition-colors hover:bg-destructive/15"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-destructive" />
                <div>
                  <div className="text-sm text-destructive">Płatności wymagają uwagi</div>
                  <div className="text-2xl text-destructive">{paymentQueue.length}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Zarządzaj płatnościami →
              </div>
            </Link>
          ) : null}
          {complaintQueue.length > 0 ? (
            <Link
              to="/admin/complaints"
              className="flex items-center justify-between rounded-xl border border-warning/30 bg-warning/10 p-5 transition-colors hover:bg-warning/15"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-warning" />
                <div>
                  <div className="text-sm text-warning">Reklamacje w kolejce</div>
                  <div className="text-2xl text-warning">{complaintQueue.length}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Zarządzaj reklamacjami →
              </div>
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mb-8 rounded-xl border border-dashed border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-lg">Techniczne narzedzia demo</h3>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Ukryte strony operacyjne do demonstracji cyklu zycia przesylki, przejazdow miedzy hubami oraz
              technicznych flow odbioru i wydania. Sa podlinkowane tylko z warstwy administracyjnej.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/demo-lab"
              className="rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90"
            >
              Otworz laboratorium demo
            </Link>
            <Link
              to="/admin/demo/locker"
              className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
            >
              Otworz laboratorium skrytek
            </Link>
            <Link
              to="/admin/demo/transit"
              className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
            >
              Otworz laboratorium tranzytu
            </Link>
            <Link
              to="/admin/demo/handover"
              className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
            >
              Otworz laboratorium przekazan
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h3 className="text-lg">Kolejka przygotowania</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Przesylki oplacone i gotowe do pierwszego operacyjnego ruchu.
            </p>
          </div>
          <div className="space-y-4 p-6">
            {prepareQueue.length ? (
              prepareQueue.map((shipment) => {
                const actionKey = `prepare-${shipment.shipmentId}`;
                return (
                  <div key={shipment.shipmentId} className="rounded-lg bg-secondary p-4">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <div>{shipment.trackingNumber}</div>
                      <StatusBadge status={shipment.shipmentStatus} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Cel: {shipment.destinationCity ?? 'brak miasta'} | Platnosc: {shipment.paymentStatus ?? 'brak'}
                    </div>
                    <div className="mt-3">
                      <button
                        type="button"
                        disabled={!currentUser?.email || busyKey === actionKey}
                        onClick={() =>
                          currentUser?.email &&
                          runDashboardAction(actionKey, () =>
                            prepareShipmentForDispatch(currentUser.email, shipment.shipmentId),
                          )
                        }
                        className="rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                      >
                        Przygotuj do wysylki
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-muted-foreground">Brak przesylek czekajacych na przygotowanie do wysylki.</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h3 className="text-lg">Kolejka dispatchera</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Przesylki, ktore mozna przypisac do kuriera bez schodzenia do surowego API.
            </p>
          </div>
          <div className="space-y-4 p-6">
            {dispatcherQueue.length ? (
              dispatcherQueue.map(({ shipment, suggestion }) => {
                const actionKey = `assign-${shipment.shipmentId}`;
                return (
                  <div key={shipment.shipmentId} className="rounded-lg bg-secondary p-4">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <div>{shipment.trackingNumber}</div>
                      <StatusBadge status={shipment.shipmentStatus} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Cel: {shipment.destinationCity ?? 'brak miasta'} | Sugestia: {suggestion?.suggestedCourierEmail ?? 'brak'}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {suggestion?.suggestionReason ?? shipment.blockedReason ?? 'Brak sugestii.'}
                    </div>
                    <div className="mt-3">
                      <button
                        type="button"
                        disabled={!currentUser?.email || !suggestion?.suggestedCourierId || busyKey === actionKey}
                        onClick={() =>
                          currentUser?.email &&
                          suggestion?.suggestedCourierId &&
                          runDashboardAction(actionKey, () =>
                            assignCourierToShipment(currentUser.email, shipment.shipmentId, suggestion.suggestedCourierId),
                          )
                        }
                        className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                      >
                        Auto-przypisz
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-muted-foreground">Brak shipmentow czekajacych na przypisanie kuriera.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-6">
          <h3 className="text-lg">Kolejka przepiecia kuriera</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Taski jeszcze nieuruchomione, ktore mozna szybko przepiac na innego kuriera bez schodzenia do osobnego flow.
          </p>
        </div>
        <div className="space-y-4 p-6">
          {reassignmentQueue.length ? (
            reassignmentQueue.map((candidate) => {
              const actionKey = `reassign-${candidate.currentTaskId}`;
              return (
                <div key={candidate.currentTaskId} className="rounded-lg bg-secondary p-4">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <div>{candidate.trackingNumber}</div>
                    <StatusBadge status={candidate.shipmentStatus} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Aktualny kurier: {candidate.currentCourierEmail ?? 'brak'} | Zadanie: {candidate.currentTaskStatus}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Sugestia: {candidate.suggestedCourierEmail ?? 'brak'} | {candidate.suggestionReason}
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      disabled={!currentUser?.email || !candidate.suggestedCourierId || busyKey === actionKey}
                      onClick={() =>
                        currentUser?.email &&
                        candidate.suggestedCourierId &&
                        runDashboardAction(actionKey, () =>
                          reassignCourierForShipment(currentUser.email, candidate.shipmentId, candidate.suggestedCourierId),
                        )
                      }
                      className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                    >
                      Zmien kuriera
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-muted-foreground">Brak taskow oczekujacych na reczne przepisanie kuriera.</div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-6">
          <h3 className="text-lg">Kolejka platnosci u kuriera</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Przesylki z `OFFLINE_AT_COURIER`, gdzie delivery jest juz po stronie kuriera, ale pobranie gotowki lub
            karty musi zostac zamkniete przed finalnym doreczeniem.
          </p>
        </div>
        <div className="space-y-4 p-6">
          {courierCheckoutQueue.length ? (
            courierCheckoutQueue.map((shipment) => (
              <div key={shipment.shipmentId} className="rounded-lg bg-secondary p-4">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div>{shipment.trackingNumber}</div>
                  <StatusBadge status={shipment.shipmentStatus} />
                </div>
                <div className="text-sm text-muted-foreground">
                  Kurier: {shipment.assignedCourierEmail ?? 'brak'} | Cel: {shipment.destinationCity ?? 'brak miasta'}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Platnosc: {shipment.paymentStatus ?? 'brak'} | Sugerowana akcja: pobierz platnosc i dorecz
                </div>
                <div className="mt-3 rounded-lg bg-card px-3 py-2 text-sm text-muted-foreground">
                  Tylko do monitoringu: to rozliczenie zamyka kurier w szczegolach zadania. Po stronie boardu warto
                  pilnowac, czy przesylka nie utknela zbyt dlugo przed `DELIVERED`.
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground">Brak aktywnych przypadkow platnosci u kuriera.</div>
          )}
        </div>
      </div>

      {isFullAdmin ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-6">
              <h3 className="text-lg">Kolejka wyjatkow platniczych</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Najblizsze platnosci wymagajace potwierdzenia albo recznej decyzji.
              </p>
            </div>
            <div className="space-y-4 p-6">
              {paymentQueue.length ? (
                paymentQueue.map((payment) => {
                  const markPaidKey = `payment-paid-${payment.paymentId}`;
                  const failKey = `payment-fail-${payment.paymentId}`;
                  return (
                    <div key={payment.paymentId} className="rounded-lg bg-secondary p-4">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <div>{payment.trackingNumber}</div>
                        <StatusBadge status={payment.status} type="payment" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {payment.clientEmail ?? 'brak klienta'} | {formatCurrency(payment.amount)} | {formatPaymentMethod(payment.method)}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">{formatPaymentStatus(payment.status)}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {payment.status === 'PENDING' ? (
                          <>
                            <button
                              type="button"
                              disabled={!currentUser?.email || busyKey === markPaidKey}
                              onClick={() =>
                                currentUser?.email &&
                                runDashboardAction(markPaidKey, () => markPaymentPaid(currentUser.email, payment.paymentId))
                              }
                              className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                            >
                              Oznacz jako oplacona
                            </button>
                            <button
                              type="button"
                              disabled={!currentUser?.email || busyKey === failKey}
                              onClick={() =>
                                currentUser?.email &&
                                runDashboardAction(failKey, () => failPayment(currentUser.email, payment.paymentId))
                              }
                              className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                            >
                              Oznacz jako nieudana
                            </button>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">Wymaga decyzji klienta lub dodatkowej analizy.</div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-muted-foreground">Brak wyjatkow platniczych do obslugi.</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-6">
              <h3 className="text-lg">Kolejka reklamacji</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Reklamacje, ktore mozna od razu ruszyc z poziomu panelu.
              </p>
            </div>
            <div className="space-y-4 p-6">
              {complaintQueue.length ? (
                complaintQueue.map((complaint) => {
                  const reviewKey = `complaint-review-${complaint.complaintId}`;
                  const acceptKey = `complaint-accept-${complaint.complaintId}`;
                  return (
                    <div key={complaint.complaintId} className="rounded-lg bg-secondary p-4">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <div>{complaint.complaintNumber}</div>
                        <StatusBadge status={complaint.status} type="complaint" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {complaint.trackingNumber} | {formatComplaintType(complaint.type)} | {complaint.clientEmail ?? 'brak klienta'}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">{formatComplaintStatus(complaint.status)}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {complaint.status === 'NEW' ? (
                          <button
                            type="button"
                            disabled={!currentUser?.email || busyKey === reviewKey}
                            onClick={() =>
                              currentUser?.email &&
                              runDashboardAction(reviewKey, () => startComplaintReview(currentUser.email, complaint.complaintId))
                            }
                            className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                          >
                            Rozpocznij analize
                          </button>
                        ) : null}
                        {complaint.status === 'IN_REVIEW' ? (
                          <button
                            type="button"
                            disabled={!currentUser?.email || busyKey === acceptKey}
                            onClick={() =>
                              currentUser?.email &&
                              runDashboardAction(acceptKey, () =>
                                acceptComplaint(currentUser.email, complaint.complaintId, 'Zaakceptowano z panelu operacyjnego'),
                              )
                            }
                            className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                          >
                            Akceptuj
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-muted-foreground">Brak reklamacji w kolejce analizy.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h3 className="text-lg">Flota kurierska</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Zestawienie obciazenia kurierow po aktualnym seedzie i zywych operacjach.
            </p>
          </div>
          <div className="space-y-4 p-6">
            {dispatch?.couriers.map((courier) => (
              <div key={courier.courierId} className="flex items-center justify-between rounded-lg bg-secondary p-4">
                <div>
                  <div>{courier.displayName}</div>
                  <div className="text-sm text-muted-foreground">
                    {courier.courierEmail} | {courier.inferredServiceCity ?? 'brak miasta'}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>{formatCourierLoadLabel(courier.openTaskCount, courier.inProgressTaskCount, courier.failedTaskCount)}</div>
                  <div>{courier.availableForAutoAssignment ? 'auto-assign: tak' : 'auto-assign: nie'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h3 className="text-lg">Ostatnie zdarzenia</h3>
          </div>
          <div className="divide-y divide-border">
            {events.map((event, index) => (
              <div
                key={`${event.trackingNumber}-${event.eventTime}-${index}`}
                className="flex flex-col gap-3 p-6 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="mb-1 flex items-center gap-3">
                    <div>{event.trackingNumber}</div>
                    <StatusBadge status={event.status} />
                  </div>
                  <div className="text-sm text-muted-foreground">{event.description}</div>
                  <div className="text-sm text-muted-foreground">{event.locationName}</div>
                </div>
                <div className="text-sm text-muted-foreground">{formatDateTime(event.eventTime)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
