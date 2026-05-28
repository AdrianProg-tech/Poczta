import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { MapPin, Package, Pencil, RefreshCw, Search, Users, X } from 'lucide-react';
import {
  formatPointType,
  getAdminUsers,
  getPointQueue,
  getPublicPoints,
  togglePointActive,
  updateAdminPoint,
  type AdminPointUpdatePayload,
  type AdminUserSummary,
  type PointQueueResponse,
  type PublicPoint,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [rows, setRows] = useState<PointOperationsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyPointCode, setBusyPointCode] = useState<string | null>(null);
  const [editPointCode, setEditPointCode] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AdminPointUpdatePayload>({});
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

  async function handleTogglePointActive(pointCode: string) {
    if (!currentUser?.email) return;
    setBusyPointCode(pointCode);
    try {
      const result = await togglePointActive(currentUser.email, pointCode);
      setRows((prev) =>
        prev.map((row) =>
          row.point.pointCode === result.pointCode ? { ...row, point: { ...row.point, active: result.active } } : row,
        ),
      );
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udało się zmienić stanu aktywności punktu.');
    } finally {
      setBusyPointCode(null);
    }
  }

  function handleOpenEditPoint(point: PublicPoint) {
    setEditPointCode(point.pointCode);
    setEditError(null);
    setEditForm({
      name: point.name,
      address: point.address,
      city: point.city,
      postalCode: point.postalCode,
      phone: point.phone,
      openingHours: point.openingHours,
    });
  }

  function handleCloseEditPoint() {
    setEditPointCode(null);
    setEditError(null);
  }

  async function handleSaveEditPoint() {
    if (!currentUser?.email || !editPointCode) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const result = await updateAdminPoint(currentUser.email, editPointCode, editForm);
      setRows((prev) =>
        prev.map((row) =>
          row.point.pointCode === editPointCode ? { ...row, point: { ...row.point, ...result } } : row,
        ),
      );
      handleCloseEditPoint();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Nie udało się zapisać zmian punktu.');
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <DashboardShell role="admin" title="Punkty odbioru">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl">Widok operacyjny punktow</h2>
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
          {t('common.refresh')}
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
                    <button
                      type="button"
                      disabled={busyPointCode === row.point.pointCode}
                      onClick={() => void handleTogglePointActive(row.point.pointCode)}
                      title={row.point.active ? 'Kliknij, aby dezaktywować punkt' : 'Kliknij, aby aktywować punkt'}
                      className={`rounded-full px-3 py-1 text-xs transition-opacity hover:opacity-75 disabled:opacity-50 ${
                        row.point.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {busyPointCode === row.point.pointCode ? '…' : row.point.active ? 'Aktywny' : 'Nieaktywny'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditPoint(row.point)}
                      title="Edytuj dane punktu"
                      className="rounded-full border border-border bg-card px-3 py-1 text-xs transition-colors hover:bg-muted"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
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
                        Obciazenie kolejki
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
                        Gotowosc operatorow
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
                        Szybkie przejscia operacyjne
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {row.point.type === 'PARCEL_LOCKER' ? (
                          <Link
                            to="/admin/demo/locker"
                            className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
                          >
                            Laboratorium skrytek
                          </Link>
                        ) : (
                          <>
                            <Link
                              to="/admin/demo/handover"
                              className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
                            >
                              Laboratorium przekazan
                            </Link>
                            <Link
                              to="/admin/shipments"
                              className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
                            >
                              Tablica przesylek
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

      {/* Edit point modal */}
      {editPointCode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-lg">Edytuj punkt — {editPointCode}</h3>
              <button type="button" onClick={handleCloseEditPoint} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {editError ? <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{editError}</div> : null}

              <label className="space-y-1">
                <div className="text-sm text-muted-foreground">Nazwa punktu</div>
                <input
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <div className="text-sm text-muted-foreground">Miasto</div>
                  <input
                    value={editForm.city ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
                  />
                </label>
                <label className="space-y-1">
                  <div className="text-sm text-muted-foreground">Kod pocztowy</div>
                  <input
                    value={editForm.postalCode ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, postalCode: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
                    placeholder="00-000"
                  />
                </label>
              </div>

              <label className="space-y-1">
                <div className="text-sm text-muted-foreground">Adres</div>
                <input
                  value={editForm.address ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <div className="text-sm text-muted-foreground">Telefon</div>
                  <input
                    value={editForm.phone ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
                    placeholder="+48 123 456 789"
                  />
                </label>
                <label className="space-y-1">
                  <div className="text-sm text-muted-foreground">Godziny otwarcia</div>
                  <input
                    value={editForm.openingHours ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, openingHours: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
                    placeholder="Pn–Pt 8:00–20:00"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={handleCloseEditPoint}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-muted"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void handleSaveEditPoint()}
                disabled={editSaving}
                className="rounded-lg bg-accent px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {editSaving ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
