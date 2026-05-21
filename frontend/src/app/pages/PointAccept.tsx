import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, RefreshCw } from 'lucide-react';
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

export default function PointAccept() {
  const { busyKey, error, isLoading, loadQueue, pointCode, pointUserEmail, queue, runPointAction, runPointBatchAction } =
    usePointQueueData();
  const [query, setQuery] = useState('');
  const [selectedIncomingKeys, setSelectedIncomingKeys] = useState<Set<string>>(new Set());
  const [selectedReadyToPostKeys, setSelectedReadyToPostKeys] = useState<Set<string>>(new Set());

  const incomingItems = useMemo(
    () =>
      filterPointQueueItems(
        (queue?.acceptQueue ?? []).filter(
          (item) => item.shipmentStatus === 'PAID' || item.shipmentStatus === 'REDIRECTED_TO_PICKUP',
        ),
        query,
      ),
    [query, queue?.acceptQueue],
  );
  const readyToPostItems = useMemo(
    () =>
      filterPointQueueItems(
        (queue?.acceptQueue ?? []).filter((item) => item.shipmentStatus === 'READY_FOR_POSTING'),
        query,
      ),
    [query, queue?.acceptQueue],
  );
  const acceptSummary = useMemo(
    () => ({
      freshIncoming: incomingItems.filter((item) => item.shipmentStatus === 'PAID').length,
      redirectedIncoming: incomingItems.filter((item) => item.shipmentStatus === 'REDIRECTED_TO_PICKUP').length,
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
    <DashboardShell role="point" title="Przyjecie w punkcie">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3">
            <Link to="/point/shipments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Wroc do overview kolejek
            </Link>
          </div>
          <h2 className="mb-2 text-2xl">Przyjecie i nadanie dalej</h2>
          <p className="text-muted-foreground">
            Ekran rozdziela dwa realne kroki dla punktu {pointCode ?? '-'}: przyjecie przesylki do punktu i nadanie jej dalej.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadQueue()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Odswiez kolejke
        </button>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}
      {isLoading ? <div className="rounded-xl border border-border bg-card p-6 shadow-sm">Ladowanie kolejki...</div> : null}

      {!isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="text-sm text-muted-foreground">Nowe przyjecia</div>
              <div className="mt-2 text-3xl">{acceptSummary.freshIncoming}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Zwykle paczki oplacone, ktore punkt dopiero przejmuje do obslugi.
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="text-sm text-muted-foreground">Redirecty do przyjecia</div>
              <div className="mt-2 text-3xl">{acceptSummary.redirectedIncoming}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Po przyjeciu trafiaja juz do flow odbioru klienta, a nie do dalszego nadania.
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="text-sm text-muted-foreground">Gotowe do nadania dalej</div>
              <div className="mt-2 text-3xl">{acceptSummary.readyToPost}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                To drugi handoff: przesylka zostala juz przyjeta i czeka na przekazanie dalej.
              </div>
            </div>
          </div>

          <PointQueueSearch query={query} onQueryChange={setQuery} />

          <PointQueueSection
            title="Do przyjecia do punktu"
            description="Tu trafia nowa paczka do przyjecia oraz redirect, ktory trzeba przeniesc do kolejki odbioru."
            headerAction={
              <div className="flex flex-wrap gap-2">
                <PointUtilityButton
                  icon="print"
                  label="Drukuj widoczna kolejke"
                  disabled={incomingItems.length === 0}
                  onClick={() =>
                    printPointQueueDigest({
                      items: incomingItems,
                      pointCode,
                      title: 'Przyjecie w punkcie - widoczna kolejka',
                      subtitle: 'Aktualnie widoczne rekordy do przyjecia po zastosowaniu filtra operatora.',
                    })
                  }
                />
                <PointUtilityButton
                  icon="download"
                  label="Eksport CSV"
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
                    label: 'Drukuj zaznaczone',
                    onClick: () =>
                      printPointQueueDigest({
                        items: selectedIncomingItems,
                        pointCode,
                        title: 'Przyjecie w punkcie - wydruk zbiorczy',
                        subtitle: 'Zbiorczy raport dla przesylek zaznaczonych do przyjecia w punkcie.',
                      }),
                  },
                  {
                    label: 'Eksport CSV',
                    onClick: () =>
                      downloadPointQueueCsv({
                        items: selectedIncomingItems,
                        filename: `${pointCode ?? 'point'}-incoming-selection.csv`,
                      }),
                  },
                  {
                    label: 'Przyjmij zaznaczone',
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
            emptyText="Brak przesylek do przyjecia."
            selectedKeys={selectedIncomingKeys}
            onToggleItem={(item) => toggleIncomingItem(getPointQueueItemKey(item))}
            renderAction={(item) => {
              const actionKey = `accept-${item.trackingNumber}`;
              const actionLabel =
                item.shipmentStatus === 'REDIRECTED_TO_PICKUP' ? 'Przyjmij do odbioru' : 'Przyjmij do punktu';
              const followUpText =
                item.shipmentStatus === 'REDIRECTED_TO_PICKUP'
                  ? 'Po tym kroku przesylka przejdzie do kolejki `Wydaj`, bo klient ma ja odebrac w punkcie.'
                  : 'Po tym kroku przesylka trafi do sekcji `Przyjete, gotowe do nadania`, czyli do kolejnego handoffu.';

              return (
                <div className="space-y-3">
                  <div className="rounded-lg bg-secondary p-3 text-sm text-muted-foreground">{followUpText}</div>
                  <div className="flex flex-wrap gap-2">
                    <PointPrintButton
                      item={item}
                      pointCode={pointCode}
                      title="Etykieta przyjecia w punkcie"
                      subtitle="Pomocniczy wydruk operacyjny dla obslugi punktu przy przyjeciu przesylki."
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

          <PointQueueSection
            title="Przyjete, gotowe do nadania"
            description="To jest osobny operacyjny etap. Przesylka zostala juz przyjeta i czeka na potwierdzenie nadania dalej."
            headerAction={
              <div className="flex flex-wrap gap-2">
                <PointUtilityButton
                  icon="print"
                  label="Drukuj widoczna kolejke"
                  disabled={readyToPostItems.length === 0}
                  onClick={() =>
                    printPointQueueDigest({
                      items: readyToPostItems,
                      pointCode,
                      title: 'Nadanie dalej - widoczna kolejka',
                      subtitle: 'Aktualnie widoczne rekordy gotowe do nadania dalej.',
                    })
                  }
                />
                <PointUtilityButton
                  icon="download"
                  label="Eksport CSV"
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
                    label: 'Drukuj zaznaczone',
                    onClick: () =>
                      printPointQueueDigest({
                        items: selectedReadyToPostItems,
                        pointCode,
                        title: 'Nadanie dalej - wydruk zbiorczy',
                        subtitle: 'Zbiorczy raport dla przesylek zaznaczonych do przekazania dalej.',
                      }),
                  },
                  {
                    label: 'Eksport CSV',
                    onClick: () =>
                      downloadPointQueueCsv({
                        items: selectedReadyToPostItems,
                        filename: `${pointCode ?? 'point'}-post-selection.csv`,
                      }),
                  },
                  {
                    label: 'Nadaj zaznaczone dalej',
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
            emptyText="Brak przesylek gotowych do nadania dalej."
            selectedKeys={selectedReadyToPostKeys}
            onToggleItem={(item) => toggleReadyToPostItem(getPointQueueItemKey(item))}
            renderAction={(item) => {
              const actionKey = `post-${item.trackingNumber}`;
              return (
                <div className="space-y-3">
                  <div className="rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
                    To jest drugi ruch operatora: punkt potwierdza, ze przesylka opuszcza lokalny intake i wraca do dalszej logistyki.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <PointPrintButton
                      item={item}
                      pointCode={pointCode}
                      title="Etykieta nadania dalej"
                      subtitle="Wydruk pomocniczy dla przesylki juz przyjetej i gotowej do dalszego przekazania."
                      primaryLabel="Nadaj dalej"
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
                      Nadaj dalej
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
