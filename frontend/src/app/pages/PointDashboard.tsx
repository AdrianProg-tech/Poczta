import { Link } from 'react-router';
import { ArrowRight, Clock } from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell';
import { downloadPointQueueCsv, printPointQueueDigest, PointUtilityButton, usePointQueueData } from '../pointQueue';

export default function PointDashboard() {
  const { isLoading, pointCode, pointName, queue, queueStats } = usePointQueueData();
  const totalQueueSize =
    (queue?.acceptQueue.length ?? 0) + (queue?.pickupQueue.length ?? 0) + (queue?.offlinePaymentQueue.length ?? 0);
  const allQueueItems = [...(queue?.acceptQueue ?? []), ...(queue?.pickupQueue ?? []), ...(queue?.offlinePaymentQueue ?? [])];

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
