import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { releasePointShipment } from '../api';
import { DashboardShell } from '../components/DashboardShell';
import {
  downloadPointQueueCsv,
  filterPointQueueItems,
  getPointQueueItemKey,
  getSelectedPointQueueItems,
  PointPrintButton,
  printPointQueueDigest,
  PointQueueBulkToolbar,
  PointQueueSearch,
  PointQueueSection,
  PointUtilityButton,
  prunePointQueueSelection,
  usePointQueueData,
} from '../pointQueue';
import { useTranslation } from 'react-i18next';

export default function PointRelease() {
  const { t } = useTranslation();
  const { busyKey, error, isLoading, loadQueue, pointCode, pointUserEmail, queue, runPointAction, runPointBatchAction } =
    usePointQueueData();
  const [query, setQuery] = useState('');
  const [selectedReleaseKeys, setSelectedReleaseKeys] = useState<Set<string>>(new Set());
  const pickupItems = useMemo(() => filterPointQueueItems(queue?.pickupQueue ?? [], query), [query, queue?.pickupQueue]);
  const releasableItems = useMemo(
    () => pickupItems.filter((item) => item.paymentStatus !== 'OFFLINE_PENDING'),
    [pickupItems],
  );
  const pickupSummary = useMemo(
    () => ({
      readyToRelease: pickupItems.filter((item) => item.paymentStatus !== 'OFFLINE_PENDING').length,
      needsFinance: pickupItems.filter((item) => item.paymentStatus === 'OFFLINE_PENDING').length,
    }),
    [pickupItems],
  );
  const selectedReleaseItems = useMemo(
    () => getSelectedPointQueueItems(releasableItems, selectedReleaseKeys),
    [releasableItems, selectedReleaseKeys],
  );

  useEffect(() => {
    setSelectedReleaseKeys((current) => prunePointQueueSelection(releasableItems, current));
  }, [releasableItems]);

  const toggleReleaseItem = (trackingNumber: string) => {
    setSelectedReleaseKeys((current) => {
      const next = new Set(current);
      if (next.has(trackingNumber)) {
        next.delete(trackingNumber);
      } else {
        next.add(trackingNumber);
      }
      return next;
    });
  };

  const toggleAllReleaseItems = () => {
    setSelectedReleaseKeys((current) =>
      current.size === releasableItems.length ? new Set() : new Set(releasableItems.map(getPointQueueItemKey)),
    );
  };

  return (
    <DashboardShell role="point" title={t('pointRelease.pageTitle')}>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3">
            <Link to="/point/shipments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {t('pointRelease.backToQueues')}
            </Link>
          </div>
          <h2 className="mb-2 text-2xl">{t('pointRelease.heading')}</h2>
          <p className="text-muted-foreground">{t('pointRelease.desc', { code: pointCode ?? '-' })}</p>
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

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}
      {isLoading ? <div className="rounded-xl border border-border bg-card p-6 shadow-sm">{t('pointRelease.loading')}</div> : null}

      {!isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="text-sm text-muted-foreground">{t('pointRelease.statReadyTitle')}</div>
              <div className="mt-2 text-3xl">{pickupSummary.readyToRelease}</div>
              <div className="mt-2 text-sm text-muted-foreground">{t('pointRelease.statReadyDesc')}</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="text-sm text-muted-foreground">{t('pointRelease.statFinanceTitle')}</div>
              <div className="mt-2 text-3xl">{pickupSummary.needsFinance}</div>
              <div className="mt-2 text-sm text-muted-foreground">{t('pointRelease.statFinanceDesc')}</div>
            </div>
          </div>

          <PointQueueSearch query={query} onQueryChange={setQuery} label={t('pointRelease.searchLabel')} />

          <PointQueueSection
            title={t('pointRelease.sectionTitle')}
            description={t('pointRelease.sectionDesc')}
            headerAction={
              <div className="flex flex-wrap gap-2">
                <PointUtilityButton
                  icon="print"
                  label={t('pointRelease.printVisible')}
                  disabled={pickupItems.length === 0}
                  onClick={() =>
                    printPointQueueDigest({
                      items: pickupItems,
                      pointCode,
                      title: t('pointRelease.digestTitleVisible'),
                      subtitle: t('pointRelease.digestSubtitleVisible'),
                    })
                  }
                />
                <PointUtilityButton
                  icon="download"
                  label={t('pointRelease.exportCsv')}
                  disabled={pickupItems.length === 0}
                  onClick={() =>
                    downloadPointQueueCsv({
                      items: pickupItems,
                      filename: `${pointCode ?? 'point'}-release-visible.csv`,
                    })
                  }
                />
              </div>
            }
            bulkToolbar={
              <PointQueueBulkToolbar
                selectedCount={selectedReleaseItems.length}
                selectableCount={releasableItems.length}
                isBusy={busyKey === 'batch-release'}
                onToggleAllVisible={toggleAllReleaseItems}
                onClearSelection={() => setSelectedReleaseKeys(new Set())}
                actions={[
                  {
                    label: t('pointRelease.printSelected'),
                    onClick: () =>
                      printPointQueueDigest({
                        items: selectedReleaseItems,
                        pointCode,
                        title: t('pointRelease.digestTitleSelected'),
                        subtitle: t('pointRelease.digestSubtitleSelected'),
                      }),
                  },
                  {
                    label: t('pointRelease.exportCsv'),
                    onClick: () =>
                      downloadPointQueueCsv({
                        items: selectedReleaseItems,
                        filename: `${pointCode ?? 'point'}-release-selection.csv`,
                      }),
                  },
                  {
                    label: t('pointRelease.releaseSelected'),
                    tone: 'success',
                    onClick: () => {
                      if (!pointUserEmail || selectedReleaseItems.length === 0) {
                        return;
                      }

                      void (async () => {
                        const success = await runPointBatchAction(
                          'batch-release',
                          selectedReleaseItems.map((item) => () => releasePointShipment(pointUserEmail, item.trackingNumber)),
                        );
                        if (success) {
                          setSelectedReleaseKeys(new Set());
                        }
                      })();
                    },
                  },
                ]}
              />
            }
            items={pickupItems}
            emptyText={t('pointRelease.empty')}
            selectedKeys={selectedReleaseKeys}
            onToggleItem={(item) => toggleReleaseItem(getPointQueueItemKey(item))}
            canSelectItem={(item) => item.paymentStatus !== 'OFFLINE_PENDING'}
            renderAction={(item) => {
              const actionKey = `release-${item.trackingNumber}`;
              const requiresOfflinePayment = item.paymentStatus === 'OFFLINE_PENDING';

              return (
                <div className="space-y-3">
                  <div className="rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
                    {requiresOfflinePayment
                      ? t('pointRelease.noteOfflinePayment')
                      : t('pointRelease.notePaymentOk')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <PointPrintButton
                      item={item}
                      pointCode={pointCode}
                      title={t('pointRelease.printTitle')}
                      subtitle={t('pointRelease.printSubtitle')}
                      primaryLabel={t('pointRelease.printPrimaryLabel')}
                    />
                    {requiresOfflinePayment ? (
                      <Link
                        to="/point/payment-verification"
                        className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
                      >
                        {t('pointRelease.goToPayment')}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={!pointUserEmail || busyKey === actionKey}
                        onClick={() =>
                          pointUserEmail &&
                          runPointAction(actionKey, () => releasePointShipment(pointUserEmail, item.trackingNumber))
                        }
                        className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                      >
                        {t('pointRelease.releaseShipment')}
                      </button>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </div>
      ) : null}
    </DashboardShell>
  );
}
