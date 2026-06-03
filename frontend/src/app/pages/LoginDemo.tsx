import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Building2, Lock, Package, ShieldCheck, Truck, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { demoRoleOptions, getDemoUsers, type DemoLoginGroup, type DemoUserOption } from '../api';
import { getDashboardPath } from '../navigation';
import { useAppStateContext } from '../state/AppStateContext';
import { usePageTitle } from '../hooks/usePageTitle';

const roleIcons = {
  client: User,
  courier: Truck,
  point: Building2,
  admin: ShieldCheck,
  dispatcher: ShieldCheck,
} as const;

function getRoleHint(group: DemoLoginGroup, isEnglish: boolean) {
  const hints = {
    client: isEnglish ? 'Create, pay, track, and manage complaints.' : 'Tworzenie, platnosc, tracking i reklamacje.',
    courier: isEnglish ? 'Last-mile tasks, starts, deliveries, and failed attempts.' : 'Zadania kuriera, start trasy, doreczenia i nieudane proby.',
    point: isEnglish ? 'Point intake, release, and walk-in shipment handling.' : 'Przyjecie w punkcie, wydanie i obsluga walk-in.',
    admin: isEnglish ? 'Operations, payments, complaints, and demo labs.' : 'Operacje, platnosci, reklamacje i demo laby.',
    dispatcher: isEnglish ? 'Shipment board, courier assignment, and operational routing.' : 'Tablica przesylek, przydzial kurierow i routing operacyjny.',
  } satisfies Record<DemoLoginGroup, string>;

  return hints[group];
}

export function buildDemoUserOptionLabel(user: DemoUserOption, isEnglish: boolean) {
  const details: string[] = [user.email];
  if (user.adminScope) {
    details.push(user.adminScope);
  }
  if (user.pointCode) {
    details.push(user.pointName ? `${user.pointName} (${user.pointCode})` : user.pointCode);
  }
  if (user.serviceCity) {
    details.push(isEnglish ? `City: ${user.serviceCity}` : `Miasto: ${user.serviceCity}`);
  }

  return details.length > 0 ? `${user.displayName} - ${details.join(' | ')}` : user.displayName;
}

export default function LoginDemo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAsRole } = useAppStateContext();
  const { t, i18n } = useTranslation();
  usePageTitle(i18n.language === 'en' ? 'Demo login' : 'Logowanie demo');
  const isEnglish = i18n.language === 'en';

  const [selectedGroup, setSelectedGroup] = useState<DemoLoginGroup>('client');
  const [users, setUsers] = useState<DemoUserOption[]>([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [password, setPassword] = useState('demo1234');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const selectedRoleOption = useMemo(
    () => demoRoleOptions.find((option) => option.id === selectedGroup) ?? demoRoleOptions[0],
    [selectedGroup],
  );

  useEffect(() => {
    let active = true;
    setIsLoadingUsers(true);
    setLoadError(null);
    setAuthError(null);

    void getDemoUsers(selectedGroup)
      .then((result) => {
        if (!active) return;
        setUsers(result);
        setSelectedEmail((current) => {
          if (current && result.some((user) => user.email === current)) {
            return current;
          }
          return result[0]?.email ?? '';
        });
      })
      .catch((error) => {
        if (!active) return;
        setUsers([]);
        setSelectedEmail('');
        setLoadError(error instanceof Error ? error.message : isEnglish ? 'Could not load demo users.' : 'Nie udalo sie pobrac kont demo.');
      })
      .finally(() => {
        if (active) {
          setIsLoadingUsers(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isEnglish, selectedGroup]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    if (!selectedEmail) {
      setAuthError(isEnglish ? 'Select an account first.' : 'Najpierw wybierz konto.');
      return;
    }

    setIsSubmitting(true);
    try {
      await loginAsRole(selectedRoleOption.role, selectedEmail, password);

      const requestedPath =
        typeof location.state === 'object' &&
        location.state !== null &&
        'from' in location.state &&
        typeof location.state.from === 'string'
          ? location.state.from
          : null;

      navigate(
        requestedPath && requestedPath !== '/login' && requestedPath !== '/login-demo'
          ? requestedPath
          : getDashboardPath(selectedRoleOption.role),
        { replace: true },
      );
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : t('auth.loginError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary to-primary/90 p-4">
      <div className="w-full max-w-5xl">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <Package className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl">PingwinPost</span>
          </Link>
          <p className="mt-2 text-white/70">
            {isEnglish
              ? 'Quick presenter login with existing role accounts from the live backend.'
              : 'Szybkie logowanie prezentacyjne na istniejace konta z zywego backendu.'}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-2xl bg-card p-8 shadow-xl">
            <div className="mb-6">
              <div className="text-sm uppercase tracking-[0.25em] text-accent">
                {isEnglish ? 'Demo Access' : 'Dostep demo'}
              </div>
              <h1 className="mt-3 text-3xl">{isEnglish ? 'Choose role and account' : 'Wybierz role i konto'}</h1>
              <p className="mt-2 text-muted-foreground">
                {isEnglish
                  ? 'Select a role first, then choose one of the active accounts available for that role.'
                  : 'Najpierw wybierz role, a potem jedno z aktywnych kont dostepnych dla tej roli.'}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-3">
              {demoRoleOptions.map((option) => {
                const Icon = roleIcons[option.id];
                const label =
                  option.id === 'dispatcher'
                    ? t('roles.dispatcher')
                    : option.id === 'admin'
                      ? t('roles.admin')
                      : t(`roles.${option.role}`);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedGroup(option.id)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      selectedGroup === option.id ? 'border-accent bg-accent/10' : 'border-border hover:bg-muted'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{getRoleHint(option.id, isEnglish)}</div>
                  </button>
                );
              })}
            </div>

            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label className="mb-2 block text-sm" htmlFor="demo-email">
                  {t('auth.email')}
                </label>
                <select
                  id="demo-email"
                  value={selectedEmail}
                  onChange={(event) => setSelectedEmail(event.target.value)}
                  disabled={isLoadingUsers || users.length === 0}
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {users.length === 0 ? (
                    <option value="">
                      {isLoadingUsers
                        ? isEnglish
                          ? 'Loading accounts...'
                          : 'Ladowanie kont...'
                        : isEnglish
                          ? 'No accounts available'
                          : 'Brak dostepnych kont'}
                    </option>
                  ) : null}
                  {users.map((user) => (
                    <option key={user.email} value={user.email}>
                      {buildDemoUserOptionLabel(user, isEnglish)}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-muted-foreground">
                  {isLoadingUsers
                    ? isEnglish
                      ? 'Fetching active users from /api/auth/demo-users.'
                      : 'Pobieranie aktywnych uzytkownikow z /api/auth/demo-users.'
                    : isEnglish
                      ? `${users.length} account(s) available for this role.`
                      : `Dostepne konta dla tej roli: ${users.length}.`}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm" htmlFor="demo-password">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="demo-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-border bg-input-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {isEnglish
                    ? 'Prefilled with the shared demo password. You can still edit it if needed.'
                    : 'Pole jest uzupelnione wspolnym haslem demo, ale nadal mozna je zmienic.'}
                </div>
              </div>

              {loadError ? <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{loadError}</div> : null}
              {authError ? <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{authError}</div> : null}

              <button
                type="submit"
                disabled={isSubmitting || isLoadingUsers || !selectedEmail}
                className="w-full rounded-lg bg-accent py-3 text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? t('common.loading')
                  : isEnglish
                    ? `Log in as ${selectedRoleOption.id === 'dispatcher' ? t('roles.dispatcher') : selectedRoleOption.id === 'admin' ? t('roles.admin') : t(`roles.${selectedRoleOption.role}`)}`
                    : `Zaloguj jako ${selectedRoleOption.id === 'dispatcher' ? t('roles.dispatcher') : selectedRoleOption.id === 'admin' ? t('roles.admin') : t(`roles.${selectedRoleOption.role}`)}`}
              </button>
            </form>
          </div>

          <div className="space-y-6 rounded-2xl bg-card p-8 shadow-xl">
            <div>
              <div className="text-sm uppercase tracking-[0.25em] text-accent">
                {isEnglish ? 'How to use it' : 'Jak tego uzyc'}
              </div>
              <h2 className="mt-3 text-2xl">{isEnglish ? 'Demo shortcuts' : 'Skroty do dema'}</h2>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-xl bg-secondary p-4">
                {isEnglish
                  ? 'Pick the role you want to present, then choose one of the live accounts returned by the backend for that role.'
                  : 'Wybierz role, ktora chcesz prezentowac, a potem jedno z zywych kont zwroconych przez backend dla tej roli.'}
              </div>
              <div className="rounded-xl bg-secondary p-4">
                {isEnglish
                  ? 'Administrator and Dispatcher are separated here on purpose, even though both ultimately log into the admin shell.'
                  : 'Administrator i Dyspozytor sa tutaj rozdzieleni celowo, mimo ze oba konta finalnie wchodza do shell-a admina.'}
              </div>
              <div className="rounded-xl bg-secondary p-4">
                {isEnglish
                  ? 'Use /demo-help in parallel when you want a step-by-step operational script for source -> transit -> target.'
                  : 'Uzyj rownolegle /demo-help, gdy potrzebujesz gotowego scenariusza source -> transit -> target.'}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/demo-help"
                className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
              >
                {isEnglish ? 'Open demo help' : 'Otworz demo help'}
              </Link>
              <Link to="/login" className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-muted">
                {isEnglish ? 'Go to classic login' : 'Przejdz do klasycznego logowania'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
