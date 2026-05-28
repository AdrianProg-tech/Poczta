import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, Clock, Search, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '../components/DashboardShell';
import { downloadPointQueueCsv, printPointQueueDigest, PointUtilityButton, usePointQueueData } from '../pointQueue';

export default function PointDashboard() {
  const { t } = useTranslation();
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
      setLookupError(t('pointDashboard.searchRequired'));
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
      setLookupError(t('pointDashboard.notInQueue', { code: query }));
    } else {
      void navigate(`/tracking?number=${query}`);
    }
  }

  return (
    <DashboardShell role="point" title={t('pointDashboard.title')}>
      <div className="mb-8">
        <h2 className="mb-2 text-2xl">{t('pointDashboard.panelTitle')}</h2>
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
          <div className="text-sm text-muted-foreground">{t('pointDashboard.totalQueue')}</div>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-accent/30 bg-accent/5 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-accent" />
            <div>
              <div className="font-semibold">{t('pointDashboard.walkInTitle')}</div>
              <div className="text-sm text-muted-foreground">{t('pointDashboard.walkInDesc')}</div>
            </div>
          </div>
          <Link
            to="/point/walk-in"
            className="flex-shrink-0 rounded-lg bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent/90"
          >
            {t('pointDashboard.walkInAccept')}
          </Link>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-3 text-lg">{t('pointDashboard.searchTitle')}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{t('pointDashboard.searchDesc')}</p>
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
              placeholder={t('pointDashboard.searchPlaceholder')}
              className="w-full rounded-lg border border-border bg-input-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent/90"
          >
            {t('pointDashboard.searchGo')}
          </button>
        </form>
        {lookupError ? <p className="mt-2 text-sm text-destructive">{lookupError}</p> : null}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-3 text-xl">{t('pointDashboard.opStateTitle')}</h3>
        {isLoading ? <div>{t('pointDashboard.loadingQueue')}</div> : null}
        {!isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-secondary p-4">
              <div className="mb-2 text-sm text-muted-foreground">{t('pointDashboard.acceptQueue')}</div>
              <div>{t('pointDashboard.acceptQueueItems', { count: queue?.acceptQueue.length ?? 0 })}</div>
            </div>
            <div className="rounded-lg bg-secondary p-4">
              <div className="mb-2 text-sm text-muted-foreground">{t('pointDashboard.releaseQueue')}</div>
              <div>{t('pointDashboard.releaseQueueItems', { count: queue?.pickupQueue.length ?? 0 })}</div>
            </div>
            <div className="rounded-lg bg-secondary p-4">
              <div className="mb-2 text-sm text-muted-foreground">{t('pointDashboard.paymentQueue')}</div>
              <div>{t('pointDashboard.paymentQueueItems', { count: queue?.offlinePaymentQueue.length ?? 0 })}</div>
            </div>
            <div className="rounded-lg border border-dashed border-border bg-card p-4 md:col-span-3">
              <div className="mb-2 text-sm text-muted-foreground">{t('pointDashboard.toolsTitle')}</div>
              <div className="mb-4 text-sm text-muted-foreground">{t('pointDashboard.toolsDesc')}</div>
              <div className="flex flex-wrap gap-2">
                <PointUtilityButton
                  icon="print"
                  label={t('pointDashboard.printReport')}
                  disabled={allQueueItems.length === 0}
                  onClick={() =>
                    printPointQueueDigest({
                      items: allQueueItems,
                      pointCode,
                      title: t('pointDashboard.printReport'),
                      subtitle: t('pointDashboard.toolsDesc'),
                    })
                  }
                />
                <PointUtilityButton
                  icon="download"
                  label={t('pointDashboard.exportCsv')}
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
