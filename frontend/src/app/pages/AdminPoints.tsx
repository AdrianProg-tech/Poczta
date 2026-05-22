import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { MapPin, Package, RefreshCw, Search, Users } from 'lucide-react';
import {
  formatPointType,
  getAdminUsers,
  getPointQueue,
  getPublicPoints,
  type AdminUserSummary,
  type PointQueueResponse,
  type PublicPoint,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

interface PointOperationsRow {
  point: PublicPoint;
  operators: AdminUserSummary[];
  queue: PointQueueResponse | null;
}

export function getPointReadinessLabel(row: PointOperationsRow) {
  if (!row.point.active) {
    return 'Nieaktywny';
  }
  if (row.operators.length === 0) {
    return 'Brak operatora';
  }
  if (!row.queue) {
    return 'Operator bez live kolejki';
  }
  return 'Gotowy operacyjnie';
}

export function getPointQueueLoad(row: PointOperationsRow) {
  return (row.queue?.acceptQueue.length ?? 0) + (row.queue?.pickupQueue.length ?? 0) + (row.queue?.offlinePaymentQueue.length ?? 0);
}

export default function AdminPoints() {
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [rows, setRows] = useState<PointOperationsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | PublicPoint['type']>('ALL');

  const loadPoints = useCallback(async () => {
    if (!currentUser?.email) {
      setRows([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [points, users] = await Promise.all([getPublicPoints(), getAdminUsers(currentUser.email)]);
      const pointOperatorsByCode = users
        .filter((user) => user.roles.includes('point') && user.pointCode)
        .reduce<Record<string, AdminUserSummary[]>>((accumulator, user) => {
          const pointCode = user.pointCode!;
          accumulator[pointCode] = [...(accumulator[pointCode] ?? []), user];
          return accumulator;
        }, {});

      const queueEntries = await Promise.all(
        points.map(async (point) => {
          const operators = pointOperatorsByCode[point.pointCode] ?? [];
          const queueOwner = operators[0]?.email;
          if (!queueOwner) {
            return [point.pointCode, null] as const;
          }

          try {
            const queue = await getPointQueue(queueOwner);
            return [point.pointCode, queue] as const;
          } catch {
            return [point.pointCode, null] as const;
          }
        }),
      );

      const queueByPointCode = new Map(queueEntries);
      setRows(
        points.map((point) => ({
          point,
          operators: pointOperatorsByCode[point.pointCode] ?? [],
          queue: queueByPointCode.get(point.pointCode) ?? null,
        })),
      );
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie pobrac punktow operacyjnych.');
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    void loadPoints();
  }, [loadPoints]);

  const filteredRows = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesType = typeFilter === 'ALL' || row.point.type === typeFilter;
      if (!matchesType) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const haystack = [
        row.point.name,
        row.point.pointCode,
        row.point.city,
        row.point.address,
        row.operators.map((operator) => operator.displayName).join(' '),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchValue);
    });
  }, [rows, search, typeFilter]);

  const stats = useMemo(
    () => [
      { label: 'Wszystkie punkty', value: rows.length },
      { label: 'Punkty odbioru', value: rows.filter((row) => row.point.type === 'PICKUP_POINT').length },
      { label: 'Paczkomaty', value: rows.filter((row) => row.point.type === 'PARCEL_LOCKER').length },
      { label: 'Bez operatora', value: rows.filter((row) => row.operators.length === 0).length },
    ],
    [rows],
  );

  return (
    <DashboardShell role="admin" title="Punkty odbioru">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl">Points operations view</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-model laczy katalog punktow, przypisanych operatorow i live queue load dla szybkiej oceny readiness.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPoints()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Odswiez points view
        </button>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="text-sm text-muted-foreground">{item.label}</div>
            <div className="mt-2 text-3xl">{isLoading ? '...' : item.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.5fr,1fr,1fr]">
        <label className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Szukaj po nazwie, pointCode, miescie lub operatorze"
            className="w-full bg-transparent outline-none"
          />
        </label>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as 'ALL' | PublicPoint['type'])}
          className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm outline-none"
        >
          <option value="ALL">Wszystkie typy</option>
          <option value="PICKUP_POINT">Punkt odbioru</option>
          <option value="PARCEL_LOCKER">Paczkomat</option>
        </select>

        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="text-sm text-muted-foreground">Po filtrach</div>
          <div className="mt-1 text-2xl">{isLoading ? '...' : filteredRows.length}</div>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? <div className="rounded-xl border border-border bg-card p-6 shadow-sm">Ladowanie punktow...</div> : null}

        {!isLoading && filteredRows.map((row) => {
          const readinessLabel = getPointReadinessLabel(row);
          const queueLoad = getPointQueueLoad(row);

          return (
            <div key={row.point.pointCode} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <div className="text-lg">{row.point.name}</div>
                    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                      {row.point.pointCode}
                    </span>
                    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                      {formatPointType(row.point.type)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        readinessLabel === 'Gotowy operacyjnie'
                          ? 'bg-success/10 text-success'
                          : readinessLabel === 'Nieaktywny'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {readinessLabel}
                    </span>
                  </div>

                  <div className="mb-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <div className="mb-1 text-muted-foreground">Lokalizacja</div>
                      <div>{row.point.city}, {row.point.address}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-muted-foreground">Godziny</div>
                      <div>{row.point.openingHours}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-muted-foreground">Operatorzy punktu</div>
                      <div>{row.operators.length}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-muted-foreground">Laczna kolejka</div>
                      <div>{queueLoad}</div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-secondary p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        Queue load
                      </div>
                      <div className="text-sm">
                        Przyjecie: {row.queue?.acceptQueue.length ?? 0}
                      </div>
                      <div className="text-sm">
                        Wydanie: {row.queue?.pickupQueue.length ?? 0}
                      </div>
                      <div className="text-sm">
                        Offline: {row.queue?.offlinePaymentQueue.length ?? 0}
                      </div>
                    </div>

                    <div className="rounded-lg bg-secondary p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Owner readiness
                      </div>
                      {row.operators.length ? (
                        <div className="space-y-1 text-sm">
                          {row.operators.map((operator) => (
                            <div key={operator.userId}>
                              {operator.displayName} ({operator.email})
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Brak przypisanego operatora point-role.</div>
                      )}
                    </div>

                    <div className="rounded-lg bg-secondary p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Quick ops links
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {row.point.type === 'PARCEL_LOCKER' ? (
                          <Link
                            to="/admin/demo/locker"
                            className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
                          >
                            Locker lab
                          </Link>
                        ) : (
                          <>
                            <Link
                              to="/admin/demo/handover"
                              className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
                            >
                              Handover lab
                            </Link>
                            <Link
                              to="/admin/shipments"
                              className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
                            >
                              Shipments board
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!isLoading && filteredRows.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-muted-foreground">
            Brak punktow dla aktualnego filtra.
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
