import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, Clock, Search, UserPlus } from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell';
import { downloadPointQueueCsv, printPointQueueDigest, PointUtilityButton, usePointQueueData } from '../pointQueue';

export default function PointDashboard() {
  const { isLoading, pointCode, pointName, queue, queueStats } = usePointQueueData();
  const navigate = useNavigate();
  const [lookupInput, setLookupInput] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);

  const totalQueueSize =
    (queue?.acceptQueue.length ?? 0) + (queue?.pickupQueue.length ?? 0) + (queue?.offlinePaymentQueue.length ?? 0);
  const allQueueItems = [...(queue?.acceptQueue ?? []), ...(queue?.pickupQueue ?? []), ...(queue?.offlinePaymentQueue ?? [])];

  function handleLookup(event: React.FormEvent) {
    event.preventDefault();
    const query = lookupInput.trim().toUpperCase();
    if (!query) {
      setLookupError('Podaj numer przesyłki.');
      return;
    }
    setLookupError(null);
    if (queue) {
      if (queue.acceptQueue.some((item) => item.trackingNumber === query)) {
        void navigate('/point/accept');
        return;
      }
      if (queue.pickupQueue.some((item) => item.trackingNumber === query)) {
        void navigate('/point/release');
        return;
      }
      if (queue.offlinePaymentQueue.some((item) => item.trackingNumber === query)) {
        void navigate('/point/payment-verification');
        return;
      }
      setLookupError(`Przesyłka ${query} nie jest aktualnie w żadnej kolejce tego punktu.`);
    } else {
      void navigate(`/tracking?number=${query}`);
    }
  }

  return (
    <DashboardShell role="point" title="Dashboard punktu">
      <div className="mb-8">
        <h2 className="mb-2 text-2xl">Panel punktu odbioru</h2>
        <p className="text-muted-foreground">{pointName ?? 'Punkt demo'} • {pointCode ?? '-'}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {queueStats.map((stat) => (
          <Link
            key={stat.key}
            to={stat.path}
            className="rounded-xl border border-border bg-card p-6 shadow-sm transition-colors hover:bg-muted/40"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{stat.label}</div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mb-2 text-3xl">{isLoading ? '...' : stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.description}</div>
          </Link>
        ))}

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <Clock className="h-8 w-8 text-warning" />
            <div className="text-3xl">{isLoading ? '...' : totalQueueSize}</div>
          </div>
          <div className="text-sm text-muted-foreground">Laczna kolejka</div>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-accent/30 bg-accent/5 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-accent" />
            <div>
              <div className="font-semibold">Klient bez konta (walk-in)</div>
              <div className="text-sm text-muted-foreground">Zarejestruj przesyłkę od klienta przychodzącego — bez konta, płatność gotówką.</div>
            </div>
          </div>
          <Link
            to="/point/walk-in"
            className="flex-shrink-0 rounded-lg bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent/90"
          >
            Przyjmij
          </Link>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-3 text-lg">Szybkie wyszukiwanie przesyłki</h3>
        <p className="mb-4 text-sm text-muted-foreground">Wpisz numer śledzenia, aby przejść bezpośrednio do właściwej kolejki operacyjnej.</p>
        <form className="flex gap-3" onSubmit={handleLookup}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={lookupInput}
              onChange={(e) => {
                setLookupInput(e.target.value);
                setLookupError(null);
              }}
              placeholder="np. PW1234567PL"
              className="w-full rounded-lg border border-border bg-input-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent/90"
          >
            Przejdź
          </button>
        </form>
        {lookupError ? <p className="mt-2 text-sm text-destructive">{lookupError}</p> : null}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-3 text-xl">Stan operacyjny punktu</h3>
        {isLoading ? <div>Ladowanie kolejki...</div> : null}
        {!isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-secondary p-4">
              <div className="mb-2 text-sm text-muted-foreground">Przyjecie</div>
              <div>{queue?.acceptQueue.length ?? 0} pozycji do obslugi</div>
            </div>
            <div className="rounded-lg bg-secondary p-4">
              <div className="mb-2 text-sm text-muted-foreground">Wydanie</div>
              <div>{queue?.pickupQueue.length ?? 0} paczek do odbioru</div>
            </div>
            <div className="rounded-lg bg-secondary p-4">
              <div className="mb-2 text-sm text-muted-foreground">Platnosci offline</div>
              <div>{queue?.offlinePaymentQueue.length ?? 0} checkoutow do domkniecia</div>
            </div>
            <div className="rounded-lg border border-dashed border-border bg-card p-4 md:col-span-3">
              <div className="mb-2 text-sm text-muted-foreground">Narzędzia zmiany</div>
              <div className="mb-4 text-sm text-muted-foreground">
                Szybki raport dla calej kolejki punktu oraz eksport CSV do dalszej pracy poza UI.
              </div>
              <div className="flex flex-wrap gap-2">
                <PointUtilityButton
                  icon="print"
                  label="Drukuj raport zmiany"
                  disabled={allQueueItems.length === 0}
                  onClick={() =>
                    printPointQueueDigest({
                      items: allQueueItems,
                      pointCode,
                      title: 'Raport zmiany punktu',
                      subtitle: 'Zbiorcze zestawienie wszystkich kolejek punktu do szybkiego handoffu i planowania zmiany.',
                    })
                  }
                />
                <PointUtilityButton
                  icon="download"
                  label="Eksportuj CSV kolejek"
                  disabled={allQueueItems.length === 0}
                  onClick={() =>
                    downloadPointQueueCsv({
                      items: allQueueItems,
                      filename: `${pointCode ?? 'point'}-shift-queue.csv`,
                    })
                  }
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
