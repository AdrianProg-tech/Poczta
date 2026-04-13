import { Link } from 'react-router';
import { Package, User, Lock } from 'lucide-react';

export default function Login() {
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
          <form className="space-y-5">
            <div>
              <label className="block mb-2 text-sm">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="jan.kowalski@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm">Hasło</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded border-border" />
                <span>Zapamiętaj mnie</span>
              </label>
              <Link to="#" className="text-accent hover:underline">
                Zapomniałeś hasła?
              </Link>
            </div>

            <button
              type="button"
              onClick={() => window.location.href = '/client'}
              className="w-full py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Zaloguj się
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Nie masz konta? </span>
            <Link to="#" className="text-accent hover:underline">
              Zarejestruj się
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-3">Zaloguj jako:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => window.location.href = '/courier'}
                className="py-2 px-3 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
              >
                Kurier
              </button>
              <button
                onClick={() => window.location.href = '/point'}
                className="py-2 px-3 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
              >
                Punkt
              </button>
              <button
                onClick={() => window.location.href = '/admin'}
                className="py-2 px-3 border border-border rounded-lg hover:bg-muted transition-colors text-sm col-span-2"
              >
                Administrator
              </button>
            </div>
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
