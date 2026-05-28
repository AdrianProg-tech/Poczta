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
  prepareShipmentForDispatch,
  releasePointShipment,
  type AdminUserSummary,
  type OpsCourierDispatchResponse,
  type OpsShipmentBoardItem,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';
import { useTranslation } from 'react-i18next';

function formatOwner(owner: string) {
  const labels: Record<string, string> = {
    CLIENT: 'Klient',
    ADMIN: 'Admin',
    POINT: 'Punkt',
    DISPATCH: 'Dispatcher',
    OPS: 'Operacje',
    COURIER: 'Kurier',
    SYSTEM: 'System',
  };
  return labels[owner] ?? owner;
}

function formatAction(action: string) {
  const labels: Record<string, string> = {
    MARK_PAYMENT_PAID: 'Potwierdz platnosc',
    RESTART_PAYMENT: 'Ponow platnosc klienta',
    CONFIRM_OFFLINE_PAYMENT: 'Potwierdz platnosc offline',
    PREPARE_FOR_DISPATCH: 'Przygotuj do wysylki',
    ASSIGN_COURIER: 'Przypisz kuriera',
    HAND_OVER_TO_COURIER: 'Przekaz kurierowi',
    ACCEPT_TASK: 'Kurier ma przyjac task',
    START_ROUTE: 'Kurier ma ruszyc w trase',
    COMPLETE_OR_RECORD_ATTEMPT: 'Dorecz albo zapisz probe',
    COLLECT_PAYMENT_AND_DELIVER: 'Pobierz platnosc i dorecz',
    ACCEPT_REDIRECTED_SHIPMENT: 'Przyjmij w punkcie',
    PICKUP_AT_POINT: 'Odbior przez klienta',
    REVIEW_EXCEPTION: 'Sprawdz wyjatek',
    NONE: 'Brak',
  };
  return labels[action] ?? action;
}

function explainAction(action: string) {
  const explanations: Record<string, string> = {
    PREPARE_FOR_DISPATCH: 'Zespol operacyjny powinien przepchnac przesylke z platnosci do pierwszego przekazania.',
    ASSIGN_COURIER: 'Dispatcher powinien wskazac kuriera, aby przesylka zeszla z kolejki oczekiwania.',
    HAND_OVER_TO_COURIER: 'Kolejny ruch jest po stronie kuriera albo punktu przekazujacego przesylke do final-mile.',
    ACCEPT_TASK: 'Task istnieje, ale kurier nie potwierdzil jeszcze przyjecia.',
    START_ROUTE: 'Task jest przyjety, ale kurier nie ruszyl jeszcze w trase.',
    COMPLETE_OR_RECORD_ATTEMPT: 'Przesylka jest juz w dostawie i wymaga finalnego wyniku po stronie kuriera.',
    COLLECT_PAYMENT_AND_DELIVER: 'Kurier musi domknac platnosc przy odbiorze, a dopiero potem oznaczyc przesylke jako doreczona.',
    ACCEPT_REDIRECTED_SHIPMENT: 'Punkt powinien przyjac redirect, aby przesylka trafila do odbioru klienta.',
    PICKUP_AT_POINT: 'Klient moze odebrac przesylke, a punkt powinien pilnowac release flow.',
    REVIEW_EXCEPTION: 'Przesylka utknela w stanie wymagajacym recznej analizy albo decyzji operacyjnej.',
    NONE: 'Nie ma sugerowanego kolejnego ruchu w tym read-modelu.',
  };
  return explanations[action] ?? 'Sprawdz te przesylke recznie, bo read-model nie ma dla niej prostego playbooka.';
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
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie pobrac boardu przesylek.');
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
      setError(requestError instanceof Error ? requestError.message : 'Operacja dla przesylki nie powiodla sie.');
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
      prepare: shipments.filter((shipment) => shipment.nextSuggestedAction === 'PREPARE_FOR_DISPATCH').length,
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
    <DashboardShell role="admin" title="Tablica przesylek">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl">Operacyjny board przesylek</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live read-model z `/api/ops/shipments-board`, z filtrowaniem pod realne scenariusze operacyjne.
          </p>
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
            placeholder="Szukaj po trackingu, miescie albo kurierze"
            className="w-full bg-transparent outline-none"
          />
        </label>

        <select
          value={ownerFilter}
          onChange={(event) => setOwnerFilter(event.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm outline-none"
        >
          <option value="ALL">Wszyscy ownerzy</option>
          {ownerOptions.map((owner) => (
            <option key={owner} value={owner}>
              {formatOwner(owner)}
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm outline-none"
        >
          <option value="ALL">Wszystkie akcje</option>
          {actionOptions.map((action) => (
            <option key={action} value={action}>
              {formatAction(action)}
            </option>
          ))}
        </select>

        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="text-sm text-muted-foreground">Po filtrach</div>
          <div className="mt-1 text-2xl">{isLoading ? '...' : filteredShipments.length}</div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() => setActionFilter('PREPARE_FOR_DISPATCH')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="text-sm text-muted-foreground">Kolejka przygotowania</div>
          <div className="mt-2 text-2xl">{boardSummary.prepare}</div>
          <div className="mt-2 text-sm text-muted-foreground">Platnosc potwierdzona, ale jeszcze bez operacyjnego handoffu.</div>
        </button>
        <button
          type="button"
          onClick={() => setActionFilter('ASSIGN_COURIER')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="text-sm text-muted-foreground">Do przydzialu kuriera</div>
          <div className="mt-2 text-2xl">{boardSummary.assign}</div>
          <div className="mt-2 text-sm text-muted-foreground">Dispatcher ma tu najwiekszy wplyw na plynne zejscie kolejki.</div>
        </button>
        <button
          type="button"
          onClick={() => setActionFilter('COLLECT_PAYMENT_AND_DELIVER')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">Platnosc u kuriera</div>
              <div className="mt-2 text-2xl">{boardSummary.courierCheckout}</div>
            </div>
            <CreditCard className="h-5 w-5 text-warning" />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Oplacenie przy drzwiach, ktore musi zamknac kurier przed finalnym `DELIVERED`.
          </div>
        </button>
        <button
          type="button"
          onClick={() => setOwnerFilter('POINT')}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="text-sm text-muted-foreground">Punktowe handoffy</div>
          <div className="mt-2 text-2xl">{boardSummary.point}</div>
          <div className="mt-2 text-sm text-muted-foreground">Redirecty i pickupy, ktore wymagaja reakcji punktu odbioru.</div>
        </button>
        <button
          type="button"
          onClick={() => {
            setOwnerFilter('ALL');
            setActionFilter('ALL');
          }}
          className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="text-sm text-muted-foreground">Zablokowane / do analizy</div>
          <div className="mt-2 text-2xl">{boardSummary.blocked}</div>
          <div className="mt-2 text-sm text-muted-foreground">Shipmenty z `blockedReason`, ktore zwykle wymagaja recznego spojrzenia.</div>
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
            <div className="text-sm text-muted-foreground">{formatAction(action)}</div>
            <div className="mt-2 text-2xl">{count}</div>
            <div className="mt-2 text-sm text-muted-foreground">{explainAction(action)}</div>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? <div className="p-6">Ladowanie boardu...</div> : null}

        {!isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Tracking</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Cel</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Owner</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Sugestia</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Kurier</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Akcja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredShipments.map((shipment) => {
                  const suggestion = suggestions.get(shipment.shipmentId);
                  const isBusy = busyShipmentId === shipment.shipmentId;
                  const pointWorkerEmail = shipment.targetPointCode
                    ? pointWorkerEmailByCode.get(shipment.targetPointCode)
                    : undefined;

                  return (
                    <tr key={shipment.shipmentId} className="align-top transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div>{shipment.trackingNumber}</div>
                        <div className="text-sm text-muted-foreground">{formatDateTime(shipment.createdAt)}</div>
                        {shipment.nextSuggestedAction === 'COLLECT_PAYMENT_AND_DELIVER' ? (
                          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1 text-xs text-warning">
                            <CreditCard className="h-3.5 w-3.5" />
                            Platnosc gotowka lub karta u kuriera
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
                        <div>{shipment.destinationCity ?? 'Brak miasta'}</div>
                        <div>{shipment.targetPointCode ? `Punkt: ${shipment.targetPointCode}` : 'Dostawa do drzwi'}</div>
                        {shipment.nextSuggestedAction === 'COLLECT_PAYMENT_AND_DELIVER' ? (
                          <div className="mt-1 text-warning">Platnosc pobraniowa po stronie kuriera.</div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-sm">{formatOwner(shipment.nextActionOwner)}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div>{formatAction(shipment.nextSuggestedAction)}</div>
                        {shipment.blockedReason ? <div className="mt-1">{shipment.blockedReason}</div> : null}
                        {suggestion?.suggestionReason ? <div className="mt-1">{suggestion.suggestionReason}</div> : null}
                        {shipment.nextSuggestedAction === 'COLLECT_PAYMENT_AND_DELIVER' ? (
                          <div className="mt-1">
                            Kurier musi pobrac gotowke albo karte przed zamknieciem zadania dostawy.
                          </div>
                        ) : null}
                        <div className="mt-2 rounded-lg bg-secondary p-3 text-sm">{explainAction(shipment.nextSuggestedAction)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div>{shipment.assignedCourierEmail ?? suggestion?.suggestedCourierEmail ?? 'Brak'}</div>
                        {shipment.nextSuggestedAction === 'COLLECT_PAYMENT_AND_DELIVER' ? (
                          <div className="mt-1 text-warning">Zespol operacyjny powinien monitorowac rozliczenie po stronie kuriera.</div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        {shipment.nextSuggestedAction === 'PREPARE_FOR_DISPATCH' ? (
                          <div className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                            Punkt przyjmuje przesylke
                          </div>
                        ) : null}

                        {shipment.nextSuggestedAction === 'ASSIGN_COURIER' ? (() => {
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
                                <option value="">— wybierz kuriera —</option>
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
                                {isBusy ? 'Przypisywanie...' : 'Przypisz kuriera'}
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
                              Przyjmij w punkcie
                            </button>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Szybka akcja wymaga przypisanego operatora punktu
                              {!isFullAdmin ? ' i scope ADMIN.' : '.'}
                            </div>
                          )
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
                              Pobierz + wydaj
                            </button>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Szybka akcja wymaga przypisanego operatora punktu
                              {!isFullAdmin ? ' i scope ADMIN.' : '.'}
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
                                Pobierz + wydaj
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
                                Wydaj w punkcie
                              </button>
                            )
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Szybka akcja wymaga przypisanego operatora punktu
                              {!isFullAdmin ? ' i scope ADMIN.' : '.'}
                            </div>
                          )
                        ) : null}

                        {shipment.nextSuggestedAction === 'COLLECT_PAYMENT_AND_DELIVER' ? (
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div>Ta szybka akcja zostaje po stronie kuriera.</div>
                            <div className="rounded-lg bg-secondary px-3 py-2">
                              Monitoruj szczegoly zadania i potwierdz, ze rozliczenie zamknie sie przed `DELIVERED`.
                            </div>
                          </div>
                        ) : null}

                        {![
                          'PREPARE_FOR_DISPATCH',
                          'ASSIGN_COURIER',
                          'ACCEPT_REDIRECTED_SHIPMENT',
                          'PICKUP_AT_POINT',
                          'CONFIRM_OFFLINE_PAYMENT',
                          'COLLECT_PAYMENT_AND_DELIVER',
                        ].includes(shipment.nextSuggestedAction) ? (
                          <div className="text-sm text-muted-foreground">Brak szybkiej akcji</div>
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
