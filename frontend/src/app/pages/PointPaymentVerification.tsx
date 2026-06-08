import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { collectOfflinePaymentAndReleaseShipment, confirmOfflinePayment } from '../api';
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

export default function PointPaymentVerification() {
  const { t } = useTranslation();
  const { busyKey, error, isLoading, loadQueue, pointCode, pointUserEmail, queue, runPointAction, runPointBatchAction } =
    usePointQueueData();
  const [query, setQuery] = useState('');
  const [selectedFinanceKeys, setSelectedFinanceKeys] = useState<Set<string>>(new Set());
  const [selectedCheckoutKeys, setSelectedCheckoutKeys] = useState<Set<string>>(new Set());
  const offlineItems = useMemo(
    () => filterPointQueueItems(queue?.offlinePaymentQueue ?? [], query),
    [query, queue?.offlinePaymentQueue],
  );
  const releaseReadyItems = useMemo(
    () => offlineItems.filter((item) => item.shipmentStatus === 'READY_FOR_HANDOVER' || item.shipmentStatus === 'AWAITING_PICKUP'),
    [offlineItems],
  );
  const financeOnlyItems = useMemo(
    () => offlineItems.filter((item) => item.shipmentStatus !== 'READY_FOR_HANDOVER' && item.shipmentStatus !== 'AWAITING_PICKUP'),
    [offlineItems],
  );
  const checkoutSummary = useMemo(
    () => ({
      releaseReady: offlineItems.filter(
        (item) => item.shipmentStatus === 'READY_FOR_HANDOVER' || item.shipmentStatus === 'AWAITING_PICKUP',
      ).length,
      financeOnly: offlineItems.filter(
        (item) => item.shipmentStatus !== 'READY_FOR_HANDOVER' && item.shipmentStatus !== 'AWAITING_PICKUP',
      ).length,
    }),
    [offlineItems],
  );
  const selectedFinanceItems = useMemo(
    () => getSelectedPointQueueItems(financeOnlyItems, selectedFinanceKeys),
    [financeOnlyItems, selectedFinanceKeys],
  );
  const selectedCheckoutItems = useMemo(
    () => getSelectedPointQueueItems(releaseReadyItems, selectedCheckoutKeys),
    [releaseReadyItems, selectedCheckoutKeys],
  );
  const financeSelectionHasMissingPaymentId = selectedFinanceItems.some((item) => !item.paymentId);
  const checkoutSelectionHasMissingPaymentId = selectedCheckoutItems.some((item) => !item.paymentId);

  useEffect(() => {
    setSelectedFinanceKeys((current) => prunePointQueueSelection(financeOnlyItems, current));
  }, [financeOnlyItems]);

  useEffect(() => {
    setSelectedCheckoutKeys((current) => prunePointQueueSelection(releaseReadyItems, current));
  }, [releaseReadyItems]);

  const toggleFinanceItem = (trackingNumber: string) => {
    setSelectedFinanceKeys((current) => {
      const next = new Set(current);
      if (next.has(trackingNumber)) {
        next.delete(trackingNumber);
      } else {
        next.add(trackingNumber);
      }
      return next;
    });
  };

  const toggleCheckoutItem = (trackingNumber: string) => {
    setSelectedCheckoutKeys((current) => {
      const next = new Set(current);
      if (next.has(trackingNumber)) {
        next.delete(trackingNumber);
      } else {
        next.add(trackingNumber);
      }
      return next;
    });
  };

  const toggleAllFinanceItems = () => {
    setSelectedFinanceKeys((current) =>
      current.size === financeOnlyItems.length ? new Set() : new Set(financeOnlyItems.map(getPointQueueItemKey)),
    );
  };

  const toggleAllCheckoutItems = () => {
    setSelectedCheckoutKeys((current) =>
      current.size === releaseReadyItems.length ? new Set() : new Set(releaseReadyItems.map(getPointQueueItemKey)),
    );
  };

  return (
    <DashboardShell role="point" title={t('pointPaymentVerification.pageTitle')}>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3">
            <Link to="/point/shipments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {t('pointPaymentVerification.backToQueues')}
            </Link>
          </div>
          <h2 className="mb-2 text-2xl">{t('pointPaymentVerification.heading')}</h2>
          <p className="text-muted-foreground">
            {t('pointPaymentVerification.desc', { code: pointCode ?? '-' })}
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

      <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-2 text-lg">{t('pointPaymentVerification.modesTitle')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('pointPaymentVerification.modesDesc')}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-secondary p-4">
            <div className="text-sm text-muted-foreground">{t('pointPaymentVerification.financeOnlyLabel')}</div>
            <div className="mt-2 text-2xl">{checkoutSummary.financeOnly}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {t('pointPaymentVerification.financeOnlyHint')}
            </div>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <div className="text-sm text-muted-foreground">{t('pointPaymentVerification.checkoutLabel')}</div>
            <div className="mt-2 text-2xl">{checkoutSummary.releaseReady}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {t('pointPaymentVerification.checkoutHint')}
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}
      {isLoading ? <div className="rounded-xl border border-border bg-card p-6 shadow-sm">{t('pointPaymentVerification.loading')}</div> : null}

      {!isLoading ? (
        <div className="space-y-6">
          <PointQueueSearch query={query} onQueryChange={setQuery} label={t('pointPaymentVerification.searchLabel')} />

          <PointQueueSection
            title={t('pointPaymentVerification.financeOnlyLabel')}
            description={t('pointPaymentVerification.financeSectionDesc')}
            headerAction={
              <div className="flex flex-wrap gap-2">
                <PointUtilityButton
                  icon="print"
                  label={t('pointPaymentVerification.printVisible')}
                  disabled={financeOnlyItems.length === 0}
                  onClick={() =>
                    printPointQueueDigest({
                      items: financeOnlyItems,
                      pointCode,
                      title: t('pointPaymentVerification.financePrintTitle'),
                      subtitle: t('pointPaymentVerification.financePrintSubtitle'),
                    })
                  }
                />
                <PointUtilityButton
                  icon="download"
                  label={t('pointPaymentVerification.exportCsv')}
                  disabled={financeOnlyItems.length === 0}
                  onClick={() =>
                    downloadPointQueueCsv({
                      items: financeOnlyItems,
                      filename: `${pointCode ?? 'point'}-finance-visible.csv`,
                    })
                  }
                />
              </div>
            }
            bulkToolbar={
              <PointQueueBulkToolbar
                selectedCount={selectedFinanceItems.length}
                selectableCount={financeOnlyItems.length}
                isBusy={busyKey === 'batch-confirm-finance'}
                onToggleAllVisible={toggleAllFinanceItems}
                onClearSelection={() => setSelectedFinanceKeys(new Set())}
                actions={[
                  {
                    label: t('pointPaymentVerification.printSelected'),
                    onClick: () =>
                      printPointQueueDigest({
                        items: selectedFinanceItems,
                        pointCode,
                        title: t('pointPaymentVerification.financeBatchPrintTitle'),
                        subtitle: t('pointPaymentVerification.financeBatchPrintSubtitle'),
                      }),
                  },
                  {
                    label: t('pointPaymentVerification.exportCsv'),
                    onClick: () =>
                      downloadPointQueueCsv({
                        items: selectedFinanceItems,
                        filename: `${pointCode ?? 'point'}-finance-selection.csv`,
                      }),
                  },
                  {
                    label: t('pointPaymentVerification.batchConfirm'),
                    onClick: () => {
                      if (!pointUserEmail || selectedFinanceItems.length === 0 || financeSelectionHasMissingPaymentId) {
                        return;
                      }

                      void (async () => {
                        const success = await runPointBatchAction(
                          'batch-confirm-finance',
                          selectedFinanceItems.map((item) => () => confirmOfflinePayment(pointUserEmail, item.paymentId!)),
                        );
                        if (success) {
                          setSelectedFinanceKeys(new Set());
                        }
                      })();
                    },
                    disabled: financeSelectionHasMissingPaymentId,
                  },
                ]}
              />
            }
            items={financeOnlyItems}
            emptyText={t('pointPaymentVerification.financeEmpty')}
            selectedKeys={selectedFinanceKeys}
            onToggleItem={(item) => toggleFinanceItem(getPointQueueItemKey(item))}
            renderAction={(item) => {
              const confirmKey = item.paymentId ? `confirm-${item.paymentId}` : null;

              return (
                <div className="space-y-3">
                  <div className="rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
                    {t('pointPaymentVerification.financeNote')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <PointPrintButton
                      item={item}
                      pointCode={pointCode}
                      title={t('pointPaymentVerification.printDocTitle')}
                      subtitle={t('pointPaymentVerification.printDocSubtitle')}
                      primaryLabel={t('pointPaymentVerification.printDocLabel')}
                    />
                    <button
                      type="button"
                      disabled={!pointUserEmail || !item.paymentId || busyKey === confirmKey}
                      onClick={() =>
                        pointUserEmail &&
                        item.paymentId &&
                        runPointAction(confirmKey!, () => confirmOfflinePayment(pointUserEmail, item.paymentId!))
                      }
                      className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                    >
                      {t('pointPaymentVerification.confirmPayment')}
                    </button>
                  </div>
                </div>
              );
            }}
          />

          <PointQueueSection
            title={t('pointPaymentVerification.checkoutLabel')}
            description={t('pointPaymentVerification.checkoutSectionDesc')}
            headerAction={
              <div className="flex flex-wrap gap-2">
                <PointUtilityButton
                  icon="print"
                  label={t('pointPaymentVerification.printVisible')}
                  disabled={releaseReadyItems.length === 0}
                  onClick={() =>
                    printPointQueueDigest({
                      items: releaseReadyItems,
                      pointCode,
                      title: t('pointPaymentVerification.checkoutPrintTitle'),
                      subtitle: t('pointPaymentVerification.checkoutPrintSubtitle'),
                    })
                  }
                />
                <PointUtilityButton
                  icon="download"
                  label={t('pointPaymentVerification.exportCsv')}
                  disabled={releaseReadyItems.length === 0}
                  onClick={() =>
                    downloadPointQueueCsv({
                      items: releaseReadyItems,
                      filename: `${pointCode ?? 'point'}-checkout-visible.csv`,
                    })
                  }
                />
              </div>
            }
            bulkToolbar={
              <PointQueueBulkToolbar
                selectedCount={selectedCheckoutItems.length}
                selectableCount={releaseReadyItems.length}
                isBusy={busyKey === 'batch-checkout-confirm' || busyKey === 'batch-checkout-release'}
                onToggleAllVisible={toggleAllCheckoutItems}
                onClearSelection={() => setSelectedCheckoutKeys(new Set())}
                actions={[
                  {
                    label: t('pointPaymentVerification.printSelected'),
                    onClick: () =>
                      printPointQueueDigest({
                        items: selectedCheckoutItems,
                        pointCode,
                        title: t('pointPaymentVerification.checkoutBatchPrintTitle'),
                        subtitle: t('pointPaymentVerification.checkoutBatchPrintSubtitle'),
                      }),
                  },
                  {
                    label: t('pointPaymentVerification.exportCsv'),
                    onClick: () =>
                      downloadPointQueueCsv({
                        items: selectedCheckoutItems,
                        filename: `${pointCode ?? 'point'}-checkout-selection.csv`,
                      }),
                  },
                  {
                    label: t('pointPaymentVerification.batchConfirmPayments'),
                    onClick: () => {
                      if (!pointUserEmail || selectedCheckoutItems.length === 0 || checkoutSelectionHasMissingPaymentId) {
                        return;
                      }

                      void (async () => {
                        const success = await runPointBatchAction(
                          'batch-checkout-confirm',
                          selectedCheckoutItems.map((item) => () => confirmOfflinePayment(pointUserEmail, item.paymentId!)),
                        );
                        if (success) {
                          setSelectedCheckoutKeys(new Set());
                        }
                      })();
                    },
                    disabled: checkoutSelectionHasMissingPaymentId,
                  },
                  {
                    label: t('pointPaymentVerification.batchCollectRelease'),
                    tone: 'success',
                    onClick: () => {
                      if (!pointUserEmail || selectedCheckoutItems.length === 0) {
                        return;
                      }

                      void (async () => {
                        const success = await runPointBatchAction(
                          'batch-checkout-release',
                          selectedCheckoutItems.map((item) => () =>
                            collectOfflinePaymentAndReleaseShipment(pointUserEmail, item.trackingNumber),
                          ),
                        );
                        if (success) {
                          setSelectedCheckoutKeys(new Set());
                        }
                      })();
                    },
                  },
                ]}
              />
            }
            items={releaseReadyItems}
            emptyText={t('pointPaymentVerification.checkoutEmpty')}
            selectedKeys={selectedCheckoutKeys}
            onToggleItem={(item) => toggleCheckoutItem(getPointQueueItemKey(item))}
            renderAction={(item) => {
              const confirmKey = item.paymentId ? `confirm-${item.paymentId}` : null;
              const collectKey = `collect-${item.trackingNumber}`;

              return (
                <div className="space-y-3">
                  <div className="rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
                    {t('pointPaymentVerification.checkoutNote')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <PointPrintButton
                      item={item}
                      pointCode={pointCode}
                      title={t('pointPaymentVerification.printDocTitle')}
                      subtitle={t('pointPaymentVerification.printDocSubtitle')}
                      primaryLabel={t('pointPaymentVerification.printDocLabel')}
                    />
                    <button
                      type="button"
                      disabled={!pointUserEmail || !item.paymentId || busyKey === confirmKey}
                      onClick={() =>
                        pointUserEmail &&
                        item.paymentId &&
                        runPointAction(confirmKey!, () => confirmOfflinePayment(pointUserEmail, item.paymentId!))
                      }
                      className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                    >
                      {t('pointPaymentVerification.confirmPayment')}
                    </button>

                    <button
                      type="button"
                      disabled={!pointUserEmail || busyKey === collectKey}
                      onClick={() =>
                        pointUserEmail &&
                        runPointAction(collectKey, () =>
                          collectOfflinePaymentAndReleaseShipment(pointUserEmail, item.trackingNumber),
                        )
                      }
                      className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
                    >
                      {t('pointPaymentVerification.collectAndRelease')}
                    </button>
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
