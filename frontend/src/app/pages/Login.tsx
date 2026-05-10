import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { Building2, Lock, Package, ShieldCheck, Truck, User } from 'lucide-react';
import { demoRoleOptions } from '../api';
import { getDashboardPath } from '../navigation';
import { useAppStateContext } from '../state/AppStateContext';
import type { UserRole } from '../types';

interface LoginFormValues {
  email: string;
  password: string;
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
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setAuthError(null);
    setIsSubmitting(true);

    try {
      await loginAsRole(selectedRole, values.email, values.password);

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
      setAuthError(error instanceof Error ? error.message : 'Nie udalo sie zalogowac.');
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
          <p className="mt-2 text-white/70">Wersja demo podlaczona do zywego backendu</p>
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

            <div>
              <label className="mb-2 block text-sm">Haslo</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  {...register('password', {
                    required: 'Podaj haslo.',
                    minLength: {
                      value: 6,
                      message: 'Haslo powinno miec co najmniej 6 znakow.',
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
            Wszystkie role w wersji demo korzystaja z kont testowych i tymczasowej sesji bearer z haslem `demo1234`.
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-white/70 transition-colors hover:text-white">
            Wroc do strony glownej
          </Link>
        </div>
      </div>
    </div>
  );
}
