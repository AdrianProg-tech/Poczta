import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import {
  assignCourierToShipment,
  formatDateTime,
  getOpsCourierDispatch,
  getOpsShipmentBoard,
  prepareShipmentForDispatch,
  type OpsCourierDispatchResponse,
  type OpsShipmentBoardItem,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';

function formatOwner(owner: string) {
  const labels: Record<string, string> = {
    CLIENT: 'Klient',
    ADMIN: 'Admin',
    POINT: 'Punkt',
    DISPATCH: 'Dispatch',
    OPS: 'Ops',
    COURIER: 'Kurier',
    SYSTEM: 'System',
  };
  return labels[owner] ?? owner;
}

function formatAction(action: string) {
  const labels: Record<string, string> = {
    MARK_PAYMENT_PAID: 'Potwierdz platnosc',
    RESTART_PAYMENT: 'Ponow platnosc klienta',
    CONFIRM_OFFLINE_PAYMENT: 'Potwierdz offline payment',
    PREPARE_FOR_DISPATCH: 'Prepare for dispatch',
    ASSIGN_COURIER: 'Przypisz kuriera',
    HAND_OVER_TO_COURIER: 'Przekaz kurierowi',
    ACCEPT_TASK: 'Kurier ma przyjac task',
    START_ROUTE: 'Kurier ma ruszyc w trase',
    COMPLETE_OR_RECORD_ATTEMPT: 'Dorecz albo zapisz probe',
    ACCEPT_REDIRECTED_SHIPMENT: 'Przyjmij w punkcie',
    PICKUP_AT_POINT: 'Odbior przez klienta',
    REVIEW_EXCEPTION: 'Sprawdz wyjatek',
    NONE: 'Brak',
  };
  return labels[action] ?? action;
}

export default function AdminShipments() {
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [shipments, setShipments] = useState<OpsShipmentBoardItem[]>([]);
  const [dispatch, setDispatch] = useState<OpsCourierDispatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyShipmentId, setBusyShipmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<'ALL' | string>('ALL');
  const [actionFilter, setActionFilter] = useState<'ALL' | string>('ALL');

  const suggestions = useMemo(
    () => new Map((dispatch?.shipmentsAwaitingAssignment ?? []).map((item) => [item.shipmentId, item])),
    [dispatch],
  );

  const loadBoard = useCallback(async () => {
    if (!currentUser?.email) {
      setShipments([]);
      setDispatch(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [shipmentsData, dispatchData] = await Promise.all([
        getOpsShipmentBoard(currentUser.email),
        getOpsCourierDispatch(currentUser.email),
      ]);
      setShipments(shipmentsData);
      setDispatch(dispatchData);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie pobrac boardu przesylek.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email]);

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

  const ownerOptions = Array.from(new Set(shipments.map((shipment) => shipment.nextActionOwner)));
  const actionOptions = Array.from(new Set(shipments.map((shipment) => shipment.nextSuggestedAction)));

  return (
    <DashboardShell role="admin" title="Shipments Board">
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
          Odswiez board
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

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {actionCounts.slice(0, 4).map(([action, count]) => (
          <div key={action} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">{formatAction(action)}</div>
            <div className="mt-2 text-2xl">{count}</div>
          </div>
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

                  return (
                    <tr key={shipment.shipmentId} className="align-top transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div>{shipment.trackingNumber}</div>
                        <div className="text-sm text-muted-foreground">{formatDateTime(shipment.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="mb-2">
                          <StatusBadge status={shipment.shipmentStatus} />
                        </div>
                        <StatusBadge status={shipment.paymentStatus} type="payment" />
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div>{shipment.destinationCity ?? 'Brak miasta'}</div>
                        <div>{shipment.targetPointCode ? `Punkt: ${shipment.targetPointCode}` : 'Door delivery'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">{formatOwner(shipment.nextActionOwner)}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div>{formatAction(shipment.nextSuggestedAction)}</div>
                        {shipment.blockedReason ? <div className="mt-1">{shipment.blockedReason}</div> : null}
                        {suggestion?.suggestionReason ? <div className="mt-1">{suggestion.suggestionReason}</div> : null}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {shipment.assignedCourierEmail ?? suggestion?.suggestedCourierEmail ?? 'Brak'}
                      </td>
                      <td className="px-6 py-4">
                        {shipment.nextSuggestedAction === 'PREPARE_FOR_DISPATCH' ? (
                          <button
                            type="button"
                            disabled={isBusy || !currentUser?.email}
                            onClick={() =>
                              currentUser?.email &&
                              runShipmentAction(shipment.shipmentId, () =>
                                prepareShipmentForDispatch(currentUser.email, shipment.shipmentId),
                              )
                            }
                            className="rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                          >
                            Prepare
                          </button>
                        ) : null}

                        {shipment.nextSuggestedAction === 'ASSIGN_COURIER' && suggestion?.suggestedCourierId ? (
                          <button
                            type="button"
                            disabled={isBusy || !currentUser?.email}
                            onClick={() =>
                              currentUser?.email &&
                              runShipmentAction(shipment.shipmentId, () =>
                                assignCourierToShipment(currentUser.email, shipment.shipmentId, suggestion.suggestedCourierId!),
                              )
                            }
                            className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                          >
                            Auto-assign
                          </button>
                        ) : null}

                        {!['PREPARE_FOR_DISPATCH', 'ASSIGN_COURIER'].includes(shipment.nextSuggestedAction) ? (
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
