import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Package, Search, MapPin, Calendar } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';

export default function Tracking() {
  const {
    state: { shipments },
  } = useAppStateContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('number') ?? shipments[0]?.id ?? '';
  const [trackingNumber, setTrackingNumber] = useState(initialQuery);
  const [searchedNumber, setSearchedNumber] = useState(initialQuery);

  useEffect(() => {
    const queryNumber = searchParams.get('number');
    if (queryNumber) {
      setTrackingNumber(queryNumber);
      setSearchedNumber(queryNumber);
    }
  }, [searchParams]);

  const trackingData = useMemo(
    () => shipments.find((shipment) => shipment.id === searchedNumber),
    [shipments, searchedNumber],
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl mb-8">Śledź przesyłkę</h1>

          {/* Search Form */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Wpisz numer przesyłki (np. PW123456789PL)"
                value={trackingNumber}
                onChange={(event) => setTrackingNumber(event.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-input-background"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchedNumber(trackingNumber);
                  setSearchParams(trackingNumber ? { number: trackingNumber } : {});
                }}
                className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">Śledź</span>
              </button>
            </div>
          </div>

          {/* Tracking Info */}
          {trackingData ? (
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-6">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Numer przesyłki</div>
                    <div className="text-xl">{trackingData.id}</div>
                  </div>
                  <StatusBadge status={trackingData.status} />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Nadawca</div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>{trackingData.sender.address}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Odbiorca</div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>{trackingData.recipient.address}</div>
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

              <div className="p-6">
                <h3 className="text-lg mb-6">Historia przesyłki</h3>
                <div className="space-y-6">
                  {trackingData.history.map((item, index) => (
                    <div key={`${item.date}-${item.status}`} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-accent' : 'bg-muted'}`}></div>
                        {index !== trackingData.history.length - 1 ? (
                          <div className="w-0.5 h-full bg-border mt-2"></div>
                        ) : null}
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
          ) : (
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <h3 className="text-lg mb-2">Nie znaleziono przesyłki</h3>
              <p className="text-muted-foreground">
                Sprawdź numer przesyłki i spróbuj ponownie. Przykładowe numery:
                {' '}
                {shipments.slice(0, 3).map((shipment) => shipment.id).join(', ')}.
              </p>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-secondary p-6 rounded-xl">
            <h3 className="text-lg mb-3">Potrzebujesz pomocy?</h3>
            <p className="text-muted-foreground mb-4">
              Jeśli masz pytania dotyczące swojej przesyłki, skontaktuj się z naszym działem obsługi klienta.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/login"
                className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Zgłoś problem
              </Link>
              <Link
                to="/info/contact"
                className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
