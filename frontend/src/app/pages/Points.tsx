import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Package, Search, MapPin, Clock, Phone } from 'lucide-react';
import { useAppStateContext } from '../state/AppStateContext';

export default function Points() {
  const {
    state: { points },
  } = useAppStateContext();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('Wszystkie');

  const filteredPoints = useMemo(
    () =>
      points.filter((point) => {
        const matchesQuery = `${point.name} ${point.address}`.toLowerCase().includes(query.toLowerCase());
        const matchesType = typeFilter === 'Wszystkie' || point.type === typeFilter;
        return matchesQuery && matchesType;
      }),
    [points, query, typeFilter],
  );

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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl mb-8">Punkty odbioru i paczkomaty</h1>

          {/* Search and Filters */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Wpisz miasto lub adres"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
              >
                <option>Wszystkie</option>
                <option>Punkt odbioru</option>
                <option>Paczkomat</option>
              </select>
            </div>
          </div>

          {/* Points List */}
          <div className="grid gap-6">
            {filteredPoints.map((point) => (
              <div key={point.id} className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg mb-1">{point.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs ${
                          point.type === 'Paczkomat' 
                            ? 'bg-info/10 text-info border border-info/20' 
                            : 'bg-accent/10 text-accent border border-accent/20'
                        }`}>
                          {point.type}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{point.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{point.hours}</span>
                      </div>
                      {point.phone !== '-' && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">{point.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:w-40">
                    <Link
                      to="/login"
                      className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm text-center"
                    >
                      Wybierz punkt
                    </Link>
                    <Link
                      to="/info/contact"
                      className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors text-sm text-center"
                    >
                      Pokaż na mapie
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-secondary p-6 rounded-xl">
              <h3 className="text-lg mb-3">Punkt odbioru</h3>
              <p className="text-sm text-muted-foreground">
                Odbierz przesyłkę osobiście w jednym z naszych punktów. Obsługa profesjonalna, 
                możliwość nadania paczki oraz dokonania płatności.
              </p>
            </div>

            <div className="bg-secondary p-6 rounded-xl">
              <h3 className="text-lg mb-3">Paczkomat</h3>
              <p className="text-sm text-muted-foreground">
                Odbierz przesyłkę 24/7 w dowolnym momencie. Wystarczy kod SMS lub aplikacja 
                mobilna. Szybko, wygodnie i bez kolejek.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
