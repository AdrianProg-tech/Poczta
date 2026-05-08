import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Calendar, MapPin, Package, Search } from 'lucide-react';
import { formatDate, formatDateTime, getPublicTracking, type PublicTrackingResponse } from '../api';
import { StatusBadge } from '../components/StatusBadge';

const defaultTrackingNumber = 'PWBAC1DF039PL';

export default function Tracking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialValue = searchParams.get('number') ?? defaultTrackingNumber;
  const [trackingNumber, setTrackingNumber] = useState(initialValue);
  const [trackingData, setTrackingData] = useState<PublicTrackingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const queryNumber = searchParams.get('number') ?? defaultTrackingNumber;
    setTrackingNumber(queryNumber);

    let active = true;

    async function loadTracking() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getPublicTracking(queryNumber);
        if (active) {
          setTrackingData(data);
        }
      } catch (requestError) {
        if (active) {
          setTrackingData(null);
          setError(requestError instanceof Error ? requestError.message : 'Nie znaleziono przesyłki.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadTracking();

    return () => {
      active = false;
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary bg-primary text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Package className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl">PingwinPost</span>
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              <Link to="/tracking" className="transition-colors hover:text-accent">
                Śledź przesyłkę
              </Link>
              <Link to="/points" className="transition-colors hover:text-accent">
                Punkty odbioru
              </Link>
              <Link to="/login" className="rounded-lg bg-accent px-4 py-2 transition-colors hover:bg-accent/90">
                Zaloguj się
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-3xl">Śledź przesyłkę</h1>

          <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Wpisz numer przesyłki"
                value={trackingNumber}
                onChange={(event) => setTrackingNumber(event.target.value.toUpperCase())}
                className="flex-1 rounded-lg border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => setSearchParams(trackingNumber ? { number: trackingNumber } : {})}
                className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-white transition-colors hover:bg-accent/90"
              >
                <Search className="h-5 w-5" />
                <span className="hidden sm:inline">Szukaj</span>
              </button>
            </div>
          </div>

          {isLoading ? <div className="rounded-xl bg-card p-6">Ładowanie historii przesyłki...</div> : null}
          {error ? <div className="rounded-xl bg-destructive/10 p-6 text-destructive">{error}</div> : null}

          {trackingData ? (
            <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="mb-1 text-sm text-muted-foreground">Numer przesyłki</div>
                    <div className="text-xl">{trackingData.trackingNumber}</div>
                  </div>
                  <StatusBadge status={trackingData.currentStatus} />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-sm text-muted-foreground">Miejsce docelowe</div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <div>{trackingData.destinationSummary}</div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-sm text-muted-foreground">Typ dostawy</div>
                    <div>{trackingData.deliveryType === 'COURIER' ? 'Kurier' : trackingData.deliveryType}</div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-lg bg-accent/10 p-4">
                  <Calendar className="h-5 w-5 text-accent" />
                  <div>
                    <div className="text-sm text-muted-foreground">Szacowana dostawa</div>
                    <div>{formatDate(trackingData.estimatedDeliveryDate)}</div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="mb-6 text-lg">Historia zdarzeń</h3>
                <div className="space-y-6">
                  {trackingData.history.length === 0 ? (
                    <div className="text-muted-foreground">Brak zdarzeń trackingowych dla tej przesyłki.</div>
                  ) : null}

                  {trackingData.history.map((item, index) => (
                    <div key={`${item.eventTime}-${item.status}-${index}`} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-accent' : 'bg-muted'}`} />
                        {index !== trackingData.history.length - 1 ? <div className="mt-2 h-full w-0.5 bg-border" /> : null}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="mb-1 flex items-center gap-3">
                          <StatusBadge status={item.status} />
                          <span className="text-sm text-muted-foreground">{formatDateTime(item.eventTime)}</span>
                        </div>
                        <div className="mb-1">{item.description}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {item.locationName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
