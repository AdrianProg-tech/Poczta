import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, RefreshCw, Search, X } from 'lucide-react';
import {
  formatDateTime,
  getAdminUserDetail,
  getAdminUsers,
  toggleUserActive,
  updateAdminUser,
  type AdminUserDetail,
  type AdminUserSummary,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';
import { useTranslation } from 'react-i18next';

export default function AdminUsers() {
  const { t } = useTranslation();
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | string>('ALL');
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editDetail, setEditDetail] = useState<AdminUserDetail | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    roles: [] as string[],
    serviceCity: '',
    pointCode: '',
  });

  const loadUsers = useCallback(async () => {
    if (!currentUser?.email) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setUsers(await getAdminUsers(currentUser.email));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie pobrac katalogu uzytkownikow.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const roleOptions = useMemo(
    () => Array.from(new Set(users.flatMap((user) => user.roles))).sort((left, right) => left.localeCompare(right)),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !searchValue ||
        user.displayName.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue) ||
        (user.pointCode ?? '').toLowerCase().includes(searchValue) ||
        (user.serviceCity ?? '').toLowerCase().includes(searchValue);
      const matchesRole = roleFilter === 'ALL' || user.roles.includes(roleFilter);
      return matchesSearch && matchesRole;
    });
  }, [roleFilter, search, users]);

  const stats = useMemo(
    () => [
      { label: 'Wszyscy', value: users.length },
      { label: 'Admin', value: users.filter((user) => user.roles.includes('admin')).length },
      { label: 'Kurierzy', value: users.filter((user) => user.roles.includes('courier')).length },
      { label: 'Punkty', value: users.filter((user) => user.roles.includes('point')).length },
    ],
    [users],
  );

  async function handleToggleActive(userId: string) {
    if (!currentUser?.email) return;
    setBusyUserId(userId);
    try {
      const result = await toggleUserActive(currentUser.email, userId);
      setUsers((prev) => prev.map((u) => (u.userId === result.userId ? { ...u, active: result.active } : u)));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udało się zmienić stanu aktywności.');
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleOpenEdit(userId: string) {
    if (!currentUser?.email) return;
    setEditUserId(userId);
    setEditError(null);
    setEditLoading(true);
    try {
      const detail = await getAdminUserDetail(currentUser.email, userId);
      setEditDetail(detail);
      setEditForm({
        firstName: detail.firstName ?? '',
        lastName: detail.lastName ?? '',
        phone: detail.phone ?? '',
        roles: [...detail.roles],
        serviceCity: detail.serviceCity ?? '',
        pointCode: detail.pointCode ?? '',
      });
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Nie udało się pobrać danych użytkownika.');
    } finally {
      setEditLoading(false);
    }
  }

  function handleCloseEdit() {
    setEditUserId(null);
    setEditDetail(null);
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!currentUser?.email || !editUserId) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const result = await updateAdminUser(currentUser.email, editUserId, {
        firstName: editForm.firstName.trim() || undefined,
        lastName: editForm.lastName.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        roles: editForm.roles,
        serviceCity: editForm.serviceCity.trim() || null,
        pointCode: editForm.pointCode.trim() || null,
      });
      const displayName = [result.firstName, result.lastName].filter(Boolean).join(' ') || result.email;
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === editUserId
            ? {
                ...u,
                displayName,
                roles: result.roles,
                serviceCity: result.serviceCity ?? null,
                pointCode: result.pointCode ?? null,
                pointName: result.pointName ?? null,
              }
            : u,
        ),
      );
      handleCloseEdit();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Nie udało się zapisać zmian.');
    } finally {
      setEditSaving(false);
    }
  }

  function toggleEditRole(role: string) {
    setEditForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
    }));
  }

  return (
    <DashboardShell role="admin" title="Uzytkownicy">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl">Katalog uzytkownikow</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Zarzadzaj kontami, rolami i przypisaniem ludzi do miast kurierow oraz punktow odbioru.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadUsers()}
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
            placeholder="Szukaj po nazwie, emailu, miescie lub pointCode"
            className="w-full bg-transparent outline-none"
          />
        </label>

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm outline-none"
        >
          <option value="ALL">Wszystkie role</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {t(`roles.${role}`, { defaultValue: role })}
            </option>
          ))}
        </select>

        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="text-sm text-muted-foreground">Po filtrach</div>
          <div className="mt-1 text-2xl">{isLoading ? '...' : filteredUsers.length}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? <div className="p-6">Ladowanie uzytkownikow...</div> : null}

        {!isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Uzytkownik</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Role</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Kontekst operacyjny</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Utworzony</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.userId} className="align-top transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div>{user.displayName}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.roles.length === 0 ? (
                          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">brak roli</span>
                        ) : (
                          user.roles.map((role) => (
                            <span
                              key={`${user.userId}-${role}`}
                              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                            >
                              {t(`roles.${role}`, { defaultValue: role })}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.serviceCity ? <div>Miasto kuriera: {user.serviceCity}</div> : null}
                      {user.pointCode ? <div>Punkt: {user.pointName ?? user.pointCode} ({user.pointCode})</div> : null}
                      {!user.serviceCity && !user.pointCode ? <div>Brak dodatkowego scope</div> : null}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        disabled={busyUserId === user.userId}
                        onClick={() => void handleToggleActive(user.userId)}
                        title={user.active ? 'Kliknij, aby dezaktywować' : 'Kliknij, aby aktywować'}
                        className={`rounded-full px-3 py-1 text-xs transition-opacity hover:opacity-75 disabled:opacity-50 ${
                          user.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {busyUserId === user.userId ? '…' : user.active ? 'Aktywny' : 'Nieaktywny'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatDateTime(user.createdAt)}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => void handleOpenEdit(user.userId)}
                        title="Edytuj użytkownika"
                        className="rounded-lg border border-border bg-card px-3 py-1 text-xs transition-colors hover:bg-muted"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/* Edit user modal */}
      {editUserId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-lg">Edytuj użytkownika</h3>
              <button type="button" onClick={handleCloseEdit} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {editLoading ? (
              <div className="px-6 py-8 text-center text-muted-foreground">Ładowanie danych…</div>
            ) : (
              <div className="space-y-4 px-6 py-5">
                {editError ? <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{editError}</div> : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1">
                    <div className="text-sm text-muted-foreground">Imię</div>
                    <input
                      value={editForm.firstName}
                      onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
                    />
                  </label>
                  <label className="space-y-1">
                    <div className="text-sm text-muted-foreground">Nazwisko</div>
                    <input
                      value={editForm.lastName}
                      onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
                    />
                  </label>
                </div>

                <label className="space-y-1">
                  <div className="text-sm text-muted-foreground">Telefon</div>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
                    placeholder="+48 123 456 789"
                  />
                </label>

                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Role</div>
                  <div className="flex flex-wrap gap-3">
                    {(['client', 'courier', 'point', 'admin', 'dispatcher'] as const).map((role) => (
                      <label key={role} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.roles.includes(role)}
                          onChange={() => toggleEditRole(role)}
                          className="rounded"
                        />
                        {t(`roles.${role}`, { defaultValue: role })}
                      </label>
                    ))}
                  </div>
                </div>

                {editForm.roles.includes('courier') ? (
                  <label className="space-y-1">
                    <div className="text-sm text-muted-foreground">Miasto kuriera (serviceCity)</div>
                    <input
                      value={editForm.serviceCity}
                      onChange={(e) => setEditForm((p) => ({ ...p, serviceCity: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
                      placeholder="np. Warszawa"
                    />
                  </label>
                ) : null}

                {editForm.roles.includes('point') ? (
                  <label className="space-y-1">
                    <div className="text-sm text-muted-foreground">Przypisany punkt (pointCode)</div>
                    <input
                      value={editForm.pointCode}
                      onChange={(e) => setEditForm((p) => ({ ...p, pointCode: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
                      placeholder="np. POP-WAW-01"
                    />
                  </label>
                ) : null}

                {editDetail ? (
                  <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    Email: {editDetail.email}
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={handleCloseEdit}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-muted"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void handleSaveEdit()}
                disabled={editSaving || editLoading}
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
