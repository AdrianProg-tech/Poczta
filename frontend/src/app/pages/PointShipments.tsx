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
      title: t('pointShipments.acceptTitle'),
      description: t('pointShipments.acceptDesc'),
      emptyText: t('pointShipments.acceptEmpty'),
      items: queue?.acceptQueue ?? [],
      path: '/point/accept',
    },
    {
      title: t('pointShipments.releaseTitle'),
      description: t('pointShipments.releaseDesc'),
      emptyText: t('pointShipments.releaseEmpty'),
      items: queue?.pickupQueue ?? [],
      path: '/point/release',
    },
    {
      title: t('pointShipments.offlinePayTitle'),
      description: t('pointShipments.offlinePayDesc'),
      emptyText: t('pointShipments.offlinePayEmpty'),
      items: queue?.offlinePaymentQueue ?? [],
      path: '/point/payment-verification',
    },
  ];

  return (
    <DashboardShell role="point" title={t('pointShipments.pageTitle')}>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="mb-2 text-2xl">{t('pointShipments.heading')}</h2>
          <p className="text-muted-foreground">
            {t('pointShipments.desc', { code: pointCode ?? '-' })}
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
      {isLoading ? <div className="rounded-xl border border-border bg-card p-6 shadow-sm">{t('pointShipments.loading')}</div> : null}

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
                    {t('pointShipments.openScreen')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                }
                items={group.items.slice(0, 3)}
                emptyText={group.emptyText}
              />
              {group.items.length > 3 ? (
                <div className="text-sm text-muted-foreground">
                  {t('pointShipments.showingMore', { count: group.items.length })}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </DashboardShell>
  );
}
