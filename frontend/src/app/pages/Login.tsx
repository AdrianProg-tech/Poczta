import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { Package, User, Lock, Truck, Building2, ShieldCheck } from 'lucide-react';
import { getDashboardPath } from '../navigation';
import { useAppStateContext } from '../state/AppStateContext';
import type { UserRole } from '../types';

interface LoginFormValues {
  email: string;
  password: string;
}

const roleOptions: Array<{ role: UserRole; label: string; icon: typeof User; hint: string; defaultEmail: string }> = [
  {
    role: 'client',
    label: 'Klient',
    icon: User,
    hint: 'Śledzenie i tworzenie przesyłek',
    defaultEmail: 'jan.kowalski@example.com',
  },
  {
    role: 'courier',
    label: 'Kurier',
    icon: Truck,
    hint: 'Zadania i dostawy',
    defaultEmail: 'marek.nowak@example.com',
  },
  {
    role: 'point',
    label: 'Punkt',
    icon: Building2,
    hint: 'Obsługa przesyłek w punkcie',
    defaultEmail: 'warszawa.centrum@pingwinpost.pl',
  },
  {
    role: 'admin',
    label: 'Administrator',
    icon: ShieldCheck,
    hint: 'Panel zarządzania systemem',
    defaultEmail: 'admin@pingwinpost.pl',
  },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAsRole } = useAppStateContext();
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: roleOptions[0].defaultEmail,
      password: 'demo1234',
    },
  });

  const onSubmit = handleSubmit((values) => {
    loginAsRole(selectedRole, values.email);

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
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
              <Package className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl">PingwinPost</span>
          </Link>
          <p className="text-white/70 mt-2">Zaloguj się do swojego konta</p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-xl shadow-xl p-8">
          <div className="grid grid-cols-2 gap-3 mb-6">
            {roleOptions.map((option) => (
              <button
                key={option.role}
                type="button"
                onClick={() => {
                  setSelectedRole(option.role);
                  setValue('email', option.defaultEmail);
                }}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedRole === option.role
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <option.icon className="w-4 h-4" />
                  <span className="text-sm">{option.label}</span>
                </div>
                <div className="text-xs text-muted-foreground">{option.hint}</div>
              </button>
            ))}
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="block mb-2 text-sm">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  {...register('email', {
                    required: 'Podaj adres email.',
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: 'Podaj poprawny adres email.',
                    },
                  })}
                  type="email"
                  placeholder="jan.kowalski@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                />
              </div>
              {errors.email ? <p className="text-sm text-destructive mt-1">{errors.email.message}</p> : null}
            </div>

            <div>
              <label className="block mb-2 text-sm">Hasło</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  {...register('password', {
                    required: 'Podaj hasło.',
                    minLength: {
                      value: 6,
                      message: 'Hasło powinno mieć co najmniej 6 znaków.',
                    },
                  })}
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                />
              </div>
              {errors.password ? (
                <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
              ) : null}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded border-border" />
                <span>Zapamiętaj mnie</span>
              </label>
              <Link to="/info/forgot-password" className="text-accent hover:underline">
                Zapomniałeś hasła?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Zaloguj jako {roleOptions.find((option) => option.role === selectedRole)?.label}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Nie masz konta? </span>
            <Link to="/info/register" className="text-accent hover:underline">
              Zarejestruj się
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-white/70 hover:text-white transition-colors text-sm">
            ← Powrót do strony głównej
          </Link>
        </div>
      </div>
    </div>
  );
}
