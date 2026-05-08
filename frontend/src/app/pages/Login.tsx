import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { Building2, Lock, Package, ShieldCheck, Truck, User } from 'lucide-react';
import { demoRoleOptions, getPublicPoints, type PublicPoint } from '../api';
import { getDashboardPath } from '../navigation';
import { useAppStateContext } from '../state/AppStateContext';
import type { UserRole } from '../types';

interface LoginFormValues {
  email: string;
  password: string;
  pointCode: string;
}

const roleIcons = {
  client: User,
  courier: Truck,
  point: Building2,
  admin: ShieldCheck,
} as const;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAsRole } = useAppStateContext();
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [points, setPoints] = useState<PublicPoint[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: demoRoleOptions[0].defaultEmail ?? '',
      password: 'demo1234',
      pointCode: '',
    },
  });

  useEffect(() => {
    let active = true;

    async function loadPoints() {
      try {
        const data = await getPublicPoints();
        if (!active) {
          return;
        }

        setPoints(data);
        if (data[0]) {
          setValue('pointCode', data[0].pointCode);
        }
      } catch {
        if (active) {
          setPoints([]);
        }
      }
    }

    void loadPoints();

    return () => {
      active = false;
    };
  }, [setValue]);

  const pointOptions = useMemo(() => points.filter((point) => point.active), [points]);

  const onSubmit = handleSubmit(async (values) => {
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const identifier = selectedRole === 'point' ? values.pointCode : values.email;
      await loginAsRole(selectedRole, identifier);

      const requestedPath =
        typeof location.state === 'object' &&
        location.state !== null &&
        'from' in location.state &&
        typeof location.state.from === 'string'
          ? location.state.from
          : null;

      navigate(requestedPath && requestedPath !== '/login' ? requestedPath : getDashboardPath(selectedRole), {
        replace: true,
      });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Nie udało się zalogować.');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary to-primary/90 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <Package className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl">PingwinPost</span>
          </Link>
          <p className="mt-2 text-white/70">Wersja demo podpięta do żywego backendu</p>
        </div>

        <div className="rounded-xl bg-card p-8 shadow-xl">
          <div className="mb-6 grid grid-cols-2 gap-3">
            {demoRoleOptions.map((option) => {
              const Icon = roleIcons[option.role];
              return (
                <button
                  key={option.role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(option.role);
                    setAuthError(null);
                    if (option.defaultEmail) {
                      setValue('email', option.defaultEmail);
                    }
                  }}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    selectedRole === option.role ? 'border-accent bg-accent/10' : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{option.label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{option.hint}</div>
                </button>
              );
            })}
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            {selectedRole === 'point' ? (
              <div>
                <label className="mb-2 block text-sm">Punkt operacyjny</label>
                <select
                  {...register('pointCode', { required: 'Wybierz punkt.' })}
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {pointOptions.map((point) => (
                    <option key={point.pointCode} value={point.pointCode}>
                      {point.name} ({point.pointCode})
                    </option>
                  ))}
                </select>
                {errors.pointCode ? <p className="mt-1 text-sm text-destructive">{errors.pointCode.message}</p> : null}
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm">Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    {...register('email', {
                      required: 'Podaj adres email.',
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: 'Podaj poprawny adres email.',
                      },
                    })}
                    type="email"
                    className="w-full rounded-lg border border-border bg-input-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                {errors.email ? <p className="mt-1 text-sm text-destructive">{errors.email.message}</p> : null}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm">Hasło</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  {...register('password', {
                    required: 'Podaj hasło.',
                    minLength: {
                      value: 6,
                      message: 'Hasło powinno mieć co najmniej 6 znaków.',
                    },
                  })}
                  type="password"
                  className="w-full rounded-lg border border-border bg-input-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              {errors.password ? <p className="mt-1 text-sm text-destructive">{errors.password.message}</p> : null}
            </div>

            {authError ? <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{authError}</div> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-accent py-3 text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Logowanie...' : `Zaloguj jako ${demoRoleOptions.find((item) => item.role === selectedRole)?.label}`}
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
            Dla ról klient, kurier i admin używane jest `auth/me` z demo e-mailami. Rola punktu działa na żywym
            `pointCode`, bo backend nie ma jeszcze osobnych kont punktów.
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-white/70 transition-colors hover:text-white">
            Wróć do strony głównej
          </Link>
        </div>
      </div>
    </div>
  );
}
