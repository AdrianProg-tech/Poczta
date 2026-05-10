import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { formatDateTime, getAdminUsers, type AdminUserSummary } from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: 'Administrator',
    courier: 'Kurier',
    point: 'Punkt',
    client: 'Klient',
  };
  return labels[role] ?? role;
}

export default function AdminUsers() {
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | string>('ALL');

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

  return (
    <DashboardShell role="admin" title="Uzytkownicy">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl">Katalog uzytkownikow</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live read-model dla admina z rolami operacyjnymi, `serviceCity` i przypisaniem do punktu.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadUsers()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Odswiez katalog
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
              {roleLabel(role)}
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
                              {roleLabel(role)}
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
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          user.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {user.active ? 'Aktywny' : 'Nieaktywny'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatDateTime(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
