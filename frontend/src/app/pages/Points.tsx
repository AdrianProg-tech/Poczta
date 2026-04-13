import { Link } from 'react-router';
import { Package, Search, MapPin, Clock, Phone } from 'lucide-react';

export default function Points() {
  const points = [
    { id: 1, name: 'PingwinPost - Warszawa Centrum', type: 'Punkt odbioru', address: 'ul. Marszałkowska 104, 00-017 Warszawa', hours: 'Pn-Pt: 8:00-20:00, Sb: 9:00-15:00', phone: '+48 22 123 4567' },
    { id: 2, name: 'Paczkomat WAW01', type: 'Paczkomat', address: 'ul. Złota 44, 00-120 Warszawa', hours: '24/7', phone: '-' },
    { id: 3, name: 'PingwinPost - Kraków Stare Miasto', type: 'Punkt odbioru', address: 'ul. Floriańska 15, 31-019 Kraków', hours: 'Pn-Pt: 9:00-19:00, Sb: 10:00-14:00', phone: '+48 12 345 6789' },
    { id: 4, name: 'Paczkomat KRK12', type: 'Paczkomat', address: 'ul. Długa 72, 31-147 Kraków', hours: '24/7', phone: '-' },
    { id: 5, name: 'PingwinPost - Wrocław Rynek', type: 'Punkt odbioru', address: 'Rynek 8, 50-106 Wrocław', hours: 'Pn-Pt: 8:00-20:00, Sb-Nd: 10:00-18:00', phone: '+48 71 234 5678' },
    { id: 6, name: 'Paczkomat WRO33', type: 'Paczkomat', address: 'ul. Świdnicka 53, 50-030 Wrocław', hours: '24/7', phone: '-' },
  ];

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
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
                />
              </div>
              <select className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background">
                <option>Wszystkie</option>
                <option>Punkt odbioru</option>
                <option>Paczkomat</option>
              </select>
              <button className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors">
                Szukaj
              </button>
            </div>
          </div>

          {/* Points List */}
          <div className="grid gap-6">
            {points.map((point) => (
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
                    <button className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm">
                      Wybierz punkt
                    </button>
                    <button className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors text-sm">
                      Pokaż na mapie
                    </button>
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
