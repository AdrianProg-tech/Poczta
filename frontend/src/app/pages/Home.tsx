import { Link, useNavigate } from 'react-router';
import { Package, MapPin, Search, TrendingUp, Shield, Clock } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState('');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-primary text-white border-b border-primary">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl">PingwinPost</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/tracking" className="hover:text-accent transition-colors">Śledź przesyłkę</Link>
              <Link to="/points" className="hover:text-accent transition-colors">Punkty odbioru</Link>
              <Link to="/login" className="px-4 py-2 bg-accent rounded-lg hover:bg-accent/90 transition-colors">
                Zaloguj się
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/90 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl mb-6">Szybka i niezawodna dostawa</h1>
            <p className="text-xl text-white/80 mb-10">
              Nowoczesny system logistyczny dla Twojej firmy i potrzeb osobistych
            </p>
            
            {/* Tracking Form */}
            <div className="bg-white rounded-xl p-6 shadow-xl">
              <h3 className="text-primary text-xl mb-4">Śledź swoją przesyłkę</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Wpisz numer przesyłki"
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                  className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
                />
                <button
                  type="button"
                  onClick={() => navigate(`/tracking?number=${encodeURIComponent(trackingNumber)}`)}
                  className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  <span className="hidden sm:inline">Śledź</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-center mb-12">Dlaczego PingwinPost?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl mb-3">Szybka dostawa</h3>
              <p className="text-muted-foreground">
                Dostawa już od następnego dnia roboczego. Monitoruj przesyłkę w czasie rzeczywistym.
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl mb-3">Bezpieczeństwo</h3>
              <p className="text-muted-foreground">
                Twoje przesyłki są ubezpieczone. Pełna kontrola i transparentność procesów.
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl mb-3">Sieć punktów</h3>
              <p className="text-muted-foreground">
                Ponad 5000 punktów odbioru i paczkomatów w całej Polsce. Zawsze blisko Ciebie.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl text-primary mb-2">5000+</div>
              <div className="text-muted-foreground">Punktów odbioru</div>
            </div>
            <div>
              <div className="text-4xl text-primary mb-2">1M+</div>
              <div className="text-muted-foreground">Przesyłek miesięcznie</div>
            </div>
            <div>
              <div className="text-4xl text-primary mb-2">98%</div>
              <div className="text-muted-foreground">Zadowolonych klientów</div>
            </div>
            <div>
              <div className="text-4xl text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Wsparcie klienta</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl mb-6">Gotowy na wysyłkę?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Załóż konto i wyślij pierwszą przesyłkę już dziś. Prosty proces, niskie ceny.
          </p>
          <Link
            to="/login"
            className="inline-block px-8 py-4 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            Rozpocznij teraz
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl">PingwinPost</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Nowoczesna firma logistyczna. Szybko, bezpiecznie, niezawodnie.
              </p>
            </div>

            <div>
              <h4 className="mb-4">Dla klientów</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/tracking" className="hover:text-accent">Śledź przesyłkę</Link></li>
                <li><Link to="/points" className="hover:text-accent">Punkty odbioru</Link></li>
                <li><Link to="/info/pricing" className="hover:text-accent">Cennik</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4">Firma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/info/about" className="hover:text-accent">O nas</Link></li>
                <li><Link to="/info/careers" className="hover:text-accent">Kariera</Link></li>
                <li><Link to="/info/contact" className="hover:text-accent">Kontakt</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4">Pomoc</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/info/faq" className="hover:text-accent">FAQ</Link></li>
                <li><Link to="/info/terms" className="hover:text-accent">Regulamin</Link></li>
                <li><Link to="/info/privacy" className="hover:text-accent">Prywatność</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2026 PingwinPost. Wszelkie prawa zastrzeżone.
          </div>
        </div>
      </footer>
    </div>
  );
}
