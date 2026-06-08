import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowUpFromLine, Inbox, RefreshCw } from 'lucide-react';
import { acceptPointShipment, postPointShipment } from '../api';
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

export default function PointAccept() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { busyKey, error, isLoading, loadQueue, pointCode, pointUserEmail, queue, runPointAction, runPointBatchAction } =
    usePointQueueData();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [selectedIncomingKeys, setSelectedIncomingKeys] = useState<Set<string>>(new Set());
  const [selectedReadyToPostKeys, setSelectedReadyToPostKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  const incomingItems = useMemo(
    () =>
      filterPointQueueItems(
        (queue?.acceptQueue ?? []).filter(
          (item) => item.shipmentStatus === 'READY_FOR_HANDOVER' || item.shipmentStatus === 'IN_TRANSIT_TO_TARGET_POINT',
        ),
        query,
      ),
    [query, queue?.acceptQueue],
  );
  const readyToPostItems = useMemo(
    () =>
      filterPointQueueItems(
        (queue?.acceptQueue ?? []).filter((item) => item.shipmentStatus === 'ACCEPTED_AT_SOURCE'),
        query,
      ),
    [query, queue?.acceptQueue],
  );
  const acceptSummary = useMemo(
    () => ({
      freshIncoming: incomingItems.filter((item) => item.shipmentStatus === 'READY_FOR_HANDOVER').length,
      redirectedIncoming: incomingItems.filter((item) => item.shipmentStatus === 'IN_TRANSIT_TO_TARGET_POINT').length,
      readyToPost: readyToPostItems.length,
    }),
    [incomingItems, readyToPostItems.length],
  );
  const selectedIncomingItems = useMemo(
    () => getSelectedPointQueueItems(incomingItems, selectedIncomingKeys),
    [incomingItems, selectedIncomingKeys],
  );
  const selectedReadyToPostItems = useMemo(
    () => getSelectedPointQueueItems(readyToPostItems, selectedReadyToPostKeys),
    [readyToPostItems, selectedReadyToPostKeys],
  );

  useEffect(() => {
    setSelectedIncomingKeys((current) => prunePointQueueSelection(incomingItems, current));
  }, [incomingItems]);

  useEffect(() => {
    setSelectedReadyToPostKeys((current) => prunePointQueueSelection(readyToPostItems, current));
  }, [readyToPostItems]);

  const toggleIncomingItem = (trackingNumber: string) => {
    setSelectedIncomingKeys((current) => {
      const next = new Set(current);
      if (next.has(trackingNumber)) {
        next.delete(trackingNumber);
      } else {
        next.add(trackingNumber);
      }
      return next;
    });
  };

  const toggleReadyToPostItem = (trackingNumber: string) => {
    setSelectedReadyToPostKeys((current) => {
      const next = new Set(current);
      if (next.has(trackingNumber)) {
        next.delete(trackingNumber);
      } else {
        next.add(trackingNumber);
      }
      return next;
    });
  };

  const toggleAllIncomingItems = () => {
    setSelectedIncomingKeys((current) =>
      current.size === incomingItems.length ? new Set() : new Set(incomingItems.map(getPointQueueItemKey)),
    );
  };

  const toggleAllReadyToPostItems = () => {
    setSelectedReadyToPostKeys((current) =>
      current.size === readyToPostItems.length ? new Set() : new Set(readyToPostItems.map(getPointQueueItemKey)),
    );
  };

  return (
    <DashboardShell role="point" title={t('pointAccept.pageTitle')}>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3">
            <Link to="/point/shipments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {t('pointAccept.backToQueues')}
            </Link>
          </div>
          <h2 className="mb-2 text-2xl">{t('pointAccept.heading')}</h2>
          <p className="text-muted-foreground">{t('pointAccept.desc', { code: pointCode ?? '-' })}</p>
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
      {isLoading ? <div className="rounded-xl border border-border bg-card p-6 shadow-sm">{t('pointAccept.loading')}</div> : null}

      {!isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="text-sm text-muted-foreground">{t('pointAccept.statFreshTitle')}</div>
              <div className="mt-2 text-3xl">{acceptSummary.freshIncoming}</div>
              <div className="mt-2 text-sm text-muted-foreground">{t('pointAccept.statFreshDesc')}</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="text-sm text-muted-foreground">{t('pointAccept.statRedirectsTitle')}</div>
              <div className="mt-2 text-3xl">{acceptSummary.redirectedIncoming}</div>
              <div className="mt-2 text-sm text-muted-foreground">{t('pointAccept.statRedirectsDesc')}</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="text-sm text-muted-foreground">{t('pointAccept.statReadyToPostTitle')}</div>
              <div className="mt-2 text-3xl">{acceptSummary.readyToPost}</div>
              <div className="mt-2 text-sm text-muted-foreground">{t('pointAccept.statReadyToPostDesc')}</div>
            </div>
          </div>

          <PointQueueSearch query={query} onQueryChange={setQuery} />

          <div className="rounded-xl border-l-4 border-l-accent bg-accent/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <Inbox className="h-5 w-5 text-accent" />
              <div>
                <div className="font-medium text-accent">{t('pointAccept.step1Title')}</div>
                <div className="text-sm text-muted-foreground">{t('pointAccept.step1Desc')}</div>
              </div>
            </div>
          </div>

          <PointQueueSection
            title={t('pointAccept.section1Title')}
            description={t('pointAccept.section1Desc')}
            headerAction={
              <div className="flex flex-wrap gap-2">
                <PointUtilityButton
                  icon="print"
                  label={t('pointAccept.printVisible')}
                  disabled={incomingItems.length === 0}
                  onClick={() =>
                    printPointQueueDigest({
                      items: incomingItems,
                      pointCode,
                      title: t('pointAccept.digestAcceptTitleVisible'),
                      subtitle: t('pointAccept.digestAcceptSubtitleVisible'),
                    })
                  }
                />
                <PointUtilityButton
                  icon="download"
                  label={t('pointAccept.exportCsv')}
                  disabled={incomingItems.length === 0}
                  onClick={() =>
                    downloadPointQueueCsv({
                      items: incomingItems,
                      filename: `${pointCode ?? 'point'}-incoming-visible.csv`,
                    })
                  }
                />
              </div>
            }
            bulkToolbar={
              <PointQueueBulkToolbar
                selectedCount={selectedIncomingItems.length}
                selectableCount={incomingItems.length}
                isBusy={busyKey === 'batch-accept'}
                onToggleAllVisible={toggleAllIncomingItems}
                onClearSelection={() => setSelectedIncomingKeys(new Set())}
                actions={[
                  {
                    label: t('pointAccept.printSelected'),
                    onClick: () =>
                      printPointQueueDigest({
                        items: selectedIncomingItems,
                        pointCode,
                        title: t('pointAccept.digestAcceptTitleSelected'),
                        subtitle: t('pointAccept.digestAcceptSubtitleSelected'),
                      }),
                  },
                  {
                    label: t('pointAccept.exportCsv'),
                    onClick: () =>
                      downloadPointQueueCsv({
                        items: selectedIncomingItems,
                        filename: `${pointCode ?? 'point'}-incoming-selection.csv`,
                      }),
                  },
                  {
                    label: t('pointAccept.batchAccept'),
                    tone: 'primary',
                    onClick: () => {
                      if (!pointUserEmail || selectedIncomingItems.length === 0) {
                        return;
                      }

                      void (async () => {
                        const success = await runPointBatchAction(
                          'batch-accept',
                          selectedIncomingItems.map((item) => () => acceptPointShipment(pointUserEmail, item.trackingNumber)),
                        );
                        if (success) {
                          setSelectedIncomingKeys(new Set());
                        }
                      })();
                    },
                  },
                ]}
              />
            }
            items={incomingItems}
            emptyText={t('pointAccept.empty1')}
            selectedKeys={selectedIncomingKeys}
            onToggleItem={(item) => toggleIncomingItem(getPointQueueItemKey(item))}
            renderAction={(item) => {
              const actionKey = `accept-${item.trackingNumber}`;
              const actionLabel =
                item.shipmentStatus === 'IN_TRANSIT_TO_TARGET_POINT' ? t('pointAccept.actionLabelRedirect') : t('pointAccept.actionLabelNormal');
              const followUpText =
                item.shipmentStatus === 'IN_TRANSIT_TO_TARGET_POINT'
                  ? t('pointAccept.followUpRedirect')
                  : t('pointAccept.followUpNormal');

              return (
                <div className="space-y-3">
                  <div className="rounded-lg bg-secondary p-3 text-sm text-muted-foreground">{followUpText}</div>
                  <div className="flex flex-wrap gap-2">
                    <PointPrintButton
                      item={item}
                      pointCode={pointCode}
                      title={t('pointAccept.printAcceptTitle')}
                      subtitle={t('pointAccept.printAcceptSubtitle')}
                      primaryLabel={actionLabel}
                    />
                    <button
                      type="button"
                      disabled={!pointUserEmail || busyKey === actionKey}
                      onClick={() =>
                        pointUserEmail &&
                        runPointAction(actionKey, () => acceptPointShipment(pointUserEmail, item.trackingNumber))
                      }
                      className="rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                    >
                      {actionLabel}
                    </button>
                  </div>
                </div>
              );
            }}
          />

          <div className="rounded-xl border-l-4 border-l-success bg-success/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <ArrowUpFromLine className="h-5 w-5 text-success" />
              <div>
                <div className="font-medium text-success">{t('pointAccept.step2Title')}</div>
                <div className="text-sm text-muted-foreground">{t('pointAccept.step2Desc')}</div>
              </div>
            </div>
          </div>

          <PointQueueSection
            title={t('pointAccept.section2Title')}
            description={t('pointAccept.section2Desc')}
            headerAction={
              <div className="flex flex-wrap gap-2">
                <PointUtilityButton
                  icon="print"
                  label={t('pointAccept.printVisible')}
                  disabled={readyToPostItems.length === 0}
                  onClick={() =>
                    printPointQueueDigest({
                      items: readyToPostItems,
                      pointCode,
                      title: t('pointAccept.digestPostTitleVisible'),
                      subtitle: t('pointAccept.digestPostSubtitleVisible'),
                    })
                  }
                />
                <PointUtilityButton
                  icon="download"
                  label={t('pointAccept.exportCsv')}
                  disabled={readyToPostItems.length === 0}
                  onClick={() =>
                    downloadPointQueueCsv({
                      items: readyToPostItems,
                      filename: `${pointCode ?? 'point'}-post-visible.csv`,
                    })
                  }
                />
              </div>
            }
            bulkToolbar={
              <PointQueueBulkToolbar
                selectedCount={selectedReadyToPostItems.length}
                selectableCount={readyToPostItems.length}
                isBusy={busyKey === 'batch-post'}
                onToggleAllVisible={toggleAllReadyToPostItems}
                onClearSelection={() => setSelectedReadyToPostKeys(new Set())}
                actions={[
                  {
                    label: t('pointAccept.printSelected'),
                    onClick: () =>
                      printPointQueueDigest({
                        items: selectedReadyToPostItems,
                        pointCode,
                        title: t('pointAccept.digestPostTitleSelected'),
                        subtitle: t('pointAccept.digestPostSubtitleSelected'),
                      }),
                  },
                  {
                    label: t('pointAccept.exportCsv'),
                    onClick: () =>
                      downloadPointQueueCsv({
                        items: selectedReadyToPostItems,
                        filename: `${pointCode ?? 'point'}-post-selection.csv`,
                      }),
                  },
                  {
                    label: t('pointAccept.batchPost'),
                    onClick: () => {
                      if (!pointUserEmail || selectedReadyToPostItems.length === 0) {
                        return;
                      }

                      void (async () => {
                        const success = await runPointBatchAction(
                          'batch-post',
                          selectedReadyToPostItems.map((item) => () => postPointShipment(pointUserEmail, item.trackingNumber)),
                        );
                        if (success) {
                          setSelectedReadyToPostKeys(new Set());
                        }
                      })();
                    },
                  },
                ]}
              />
            }
            items={readyToPostItems}
            emptyText={t('pointAccept.empty2')}
            selectedKeys={selectedReadyToPostKeys}
            onToggleItem={(item) => toggleReadyToPostItem(getPointQueueItemKey(item))}
            renderAction={(item) => {
              const actionKey = `post-${item.trackingNumber}`;
              return (
                <div className="space-y-3">
                  <div className="rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
                    {t('pointAccept.notePostOnwards')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <PointPrintButton
                      item={item}
                      pointCode={pointCode}
                      title={t('pointAccept.printPostTitle')}
                      subtitle={t('pointAccept.printPostSubtitle')}
                      primaryLabel={t('pointAccept.printPostPrimaryLabel')}
                    />
                    <button
                      type="button"
                      disabled={!pointUserEmail || busyKey === actionKey}
                      onClick={() =>
                        pointUserEmail &&
                        runPointAction(actionKey, () => postPointShipment(pointUserEmail, item.trackingNumber))
                      }
                      className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                    >
                      {t('pointAccept.postOnwards')}
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
