import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Clock, MapPin, Package, Phone, Search } from 'lucide-react';
import { formatPointType, getPublicPoints, type PublicPoint } from '../api';

export default function Points() {
  const [points, setPoints] = useState<PublicPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    let active = true;

    async function loadPoints() {
      try {
        const data = await getPublicPoints();
        if (active) {
          setPoints(data);
          setError(null);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Nie udało się pobrać punktów.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadPoints();

    return () => {
      active = false;
    };
  }, []);

  const filteredPoints = useMemo(
    () =>
      points.filter((point) => {
        const haystack = `${point.name} ${point.city} ${point.address} ${point.pointCode}`.toLowerCase();
        const matchesQuery = haystack.includes(query.toLowerCase());
        const matchesType = typeFilter === 'ALL' || point.type === typeFilter;
        return point.active && matchesQuery && matchesType;
      }),
    [points, query, typeFilter],
  );

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
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 text-3xl">Punkty odbioru i paczkomaty</h1>

          <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Szukaj po mieście, adresie lub kodzie punktu"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full rounded-lg border border-border bg-input-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="rounded-lg border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="ALL">Wszystkie</option>
                <option value="PICKUP_POINT">Punkt odbioru</option>
                <option value="PARCEL_LOCKER">Paczkomat</option>
              </select>
            </div>
          </div>

          {isLoading ? <div className="rounded-xl bg-card p-6">Ładowanie punktów...</div> : null}
          {error ? <div className="rounded-xl bg-destructive/10 p-6 text-destructive">{error}</div> : null}

          {!isLoading && !error ? (
            <div className="grid gap-6">
              {filteredPoints.map((point) => (
                <div key={point.pointCode} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex flex-col gap-6 md:flex-row">
                    <div className="flex-1">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="mb-1 text-lg">{point.name}</h3>
                          <div className="text-sm text-muted-foreground">
                            {point.pointCode} • {point.city}
                          </div>
                        </div>
                        <span className="inline-flex rounded-md border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs text-accent">
                          {formatPointType(point.type)}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {point.address}, {point.postalCode} {point.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">{point.openingHours}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">{point.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:w-44">
                      <Link
                        to="/login"
                        className="rounded-lg bg-accent px-4 py-2 text-center text-sm text-white transition-colors hover:bg-accent/90"
                      >
                        Wybierz w formularzu
                      </Link>
                      <Link
                        to="/tracking"
                        className="rounded-lg border border-border bg-card px-4 py-2 text-center text-sm transition-colors hover:bg-muted"
                      >
                        Przejdź do śledzenia
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {filteredPoints.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
                  Nie znaleziono punktów pasujących do podanych filtrów.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
