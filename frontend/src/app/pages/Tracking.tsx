import { Link } from 'react-router';
import { Package, Search, MapPin, Calendar, Clock } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export default function Tracking() {
  const trackingData = {
    number: 'PW123456789PL',
    status: 'W transporcie',
    from: 'Warszawa, ul. Marszałkowska 1',
    to: 'Kraków, ul. Floriańska 15',
    estimatedDelivery: '26.03.2026',
    history: [
      { date: '25.03.2026 14:30', location: 'Katowice - Sortownia', status: 'W transporcie', description: 'Przesyłka w drodze' },
      { date: '25.03.2026 09:15', location: 'Warszawa - Punkt nadania', status: 'Nadana', description: 'Przesyłka nadana' },
      { date: '24.03.2026 18:20', location: 'Warszawa - Magazyn', status: 'Opłacona', description: 'Przesyłka opłacona' },
      { date: '24.03.2026 16:45', location: 'Online', status: 'Utworzona', description: 'Przesyłka utworzona' },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
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

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl mb-8">Śledź przesyłkę</h1>

          {/* Search Form */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Wpisz numer przesyłki (np. PW123456789PL)"
                defaultValue="PW123456789PL"
                className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
              />
              <button className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">Śledź</span>
              </button>
            </div>
          </div>

          {/* Tracking Info */}
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-6">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Numer przesyłki</div>
                  <div className="text-xl">{trackingData.number}</div>
                </div>
                <StatusBadge status={trackingData.status} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Nadawca</div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>{trackingData.from}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Odbiorca</div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>{trackingData.to}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-accent/10 rounded-lg flex items-center gap-3">
                <Calendar className="w-5 h-5 text-accent" />
                <div>
                  <div className="text-sm text-muted-foreground">Przewidywana dostawa</div>
                  <div>{trackingData.estimatedDelivery}</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6">
              <h3 className="text-lg mb-6">Historia przesyłki</h3>
              <div className="space-y-6">
                {trackingData.history.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-accent' : 'bg-muted'
                      }`}></div>
                      {index !== trackingData.history.length - 1 && (
                        <div className="w-0.5 h-full bg-border mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-3 mb-1">
                        <StatusBadge status={item.status} />
                        <span className="text-sm text-muted-foreground">{item.date}</span>
                      </div>
                      <div className="mb-1">{item.description}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {item.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-secondary p-6 rounded-xl">
            <h3 className="text-lg mb-3">Potrzebujesz pomocy?</h3>
            <p className="text-muted-foreground mb-4">
              Jeśli masz pytania dotyczące swojej przesyłki, skontaktuj się z naszym działem obsługi klienta.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
                Zgłoś problem
              </button>
              <button className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
                Kontakt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
