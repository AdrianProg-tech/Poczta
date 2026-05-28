import { Link } from 'react-router';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell';
import { PointQueueSection, usePointQueueData } from '../pointQueue';
import { useTranslation } from 'react-i18next';

export default function PointShipments() {
  const { t } = useTranslation();
  const { error, isLoading, loadQueue, pointCode, queue, queueStats } = usePointQueueData();
  const queueGroups = [
    {
      title: 'Przyjecie',
      description: 'Nowe przyjecia, redirecty i pozycje gotowe do nadania dalej.',
      emptyText: 'Brak pozycji w kolejce przyjecia.',
      items: queue?.acceptQueue ?? [],
      path: '/point/accept',
    },
    {
      title: 'Wydanie',
      description: 'Paczki czekajace na klienta w punkcie.',
      emptyText: 'Brak paczek gotowych do odbioru.',
      items: queue?.pickupQueue ?? [],
      path: '/point/release',
    },
    {
      title: 'Platnosci offline',
      description: 'Rozliczenia gotowkowe i szybkie checkouty dla punktu.',
      emptyText: 'Brak platnosci offline do obslugi.',
      items: queue?.offlinePaymentQueue ?? [],
      path: '/point/payment-verification',
    },
  ];

  return (
    <DashboardShell role="point" title="Kolejki punktu">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="mb-2 text-2xl">Overview kolejek punktu</h2>
          <p className="text-muted-foreground">
            Widok czyta zywe `acceptQueue`, `pickupQueue` i `offlinePaymentQueue` dla punktu {pointCode ?? '-'} i rozprowadza operatora do odpowiedniego flow.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadQueue()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {queueStats.map((item) => (
          <Link
            key={item.key}
            to={item.path}
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl">{isLoading ? '...' : item.value}</div>
            <div className="mt-2 text-sm text-muted-foreground">{item.description}</div>
          </Link>
        ))}
      </div>

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}
      {isLoading ? <div className="rounded-xl border border-border bg-card p-6 shadow-sm">Ladowanie kolejki...</div> : null}

      {!isLoading ? (
        <div className="space-y-6">
          {queueGroups.map((group) => (
            <div key={group.path} className="space-y-3">
              <PointQueueSection
                title={group.title}
                description={group.description}
                headerAction={
                  <Link
                    to={group.path}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
                  >
                    Otworz ekran
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                }
                items={group.items.slice(0, 3)}
                emptyText={group.emptyText}
              />
              {group.items.length > 3 ? (
                <div className="text-sm text-muted-foreground">
                  Pokazano 3 z {group.items.length} pozycji. Pelna obsluga jest na dedykowanym ekranie.
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </DashboardShell>
  );
}
