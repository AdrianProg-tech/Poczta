import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  acceptPointShipment,
  confirmOfflinePayment,
  formatDateTime,
  getPointQueue,
  postPointShipment,
  releasePointShipment,
  type PointQueueItem,
  type PointQueueResponse,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';

function formatQueueType(type: string) {
  const labels: Record<string, string> = {
    ACCEPT: 'Do przyjecia',
    ACCEPT_REDIRECT: 'Redirect do przyjecia',
    PICKUP: 'Do wydania',
    OFFLINE_PAYMENT: 'Offline payment',
  };
  return labels[type] ?? type;
}

function QueueSection({
  title,
  items,
  emptyText,
  renderAction,
}: {
  title: string;
  items: PointQueueItem[];
  emptyText: string;
  renderAction: (item: PointQueueItem) => ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6">
        <h3 className="text-xl">
          {title} <span className="text-muted-foreground">({items.length})</span>
        </h3>
      </div>
      {items.length === 0 ? <div className="p-6 text-muted-foreground">{emptyText}</div> : null}
      <div className="divide-y divide-border">
        {items.map((item) => (
          <div
            key={`${title}-${item.queueType}-${item.trackingNumber}`}
            className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="grid flex-1 gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-sm text-muted-foreground">Numer</div>
                <div>{item.trackingNumber}</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-muted-foreground">Odbiorca</div>
                <div>{item.recipientName}</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-muted-foreground">Typ kolejki</div>
                <div>{formatQueueType(item.queueType)}</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-muted-foreground">Dodano</div>
                <div>{formatDateTime(item.createdAt)}</div>
              </div>
              {item.paymentId ? (
                <div className="md:col-span-2">
                  <div className="mb-1 text-sm text-muted-foreground">Payment ID</div>
                  <div className="break-all text-sm">{item.paymentId}</div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={item.shipmentStatus} />
              {item.paymentStatus ? <StatusBadge status={item.paymentStatus} type="payment" /> : null}
              {renderAction(item)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PointShipments() {
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [queue, setQueue] = useState<PointQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    if (!currentUser?.pointCode) {
      setQueue(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setQueue(await getPointQueue(currentUser.pointCode));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie pobrac kolejki punktu.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.pointCode]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  async function runPointAction(key: string, action: () => Promise<unknown>) {
    setBusyKey(key);
    setError(null);
    try {
      await action();
      await loadQueue();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Operacja punktu nie powiodla sie.');
    } finally {
      setBusyKey(null);
    }
  }

  const pointCode = currentUser?.pointCode;
  const queueStats = useMemo(
    () => [
      { label: 'Do przyjecia', value: queue?.acceptQueue.length ?? 0 },
      { label: 'Do wydania', value: queue?.pickupQueue.length ?? 0 },
      { label: 'Offline payments', value: queue?.offlinePaymentQueue.length ?? 0 },
    ],
    [queue],
  );

  return (
    <DashboardShell role="point" title="Przesylki w punkcie">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="mb-2 text-2xl">Kolejka punktu</h2>
          <p className="text-muted-foreground">
            Widok czyta zywe `acceptQueue`, `pickupQueue` i `offlinePaymentQueue` dla punktu {pointCode ?? '-'}.
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

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {queueStats.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="text-sm text-muted-foreground">{item.label}</div>
            <div className="mt-2 text-3xl">{isLoading ? '...' : item.value}</div>
          </div>
        ))}
      </div>

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}
      {isLoading ? <div className="rounded-xl border border-border bg-card p-6 shadow-sm">Ladowanie kolejki...</div> : null}

      {!isLoading && queue ? (
        <div className="space-y-6">
          <QueueSection
            title="Do przyjecia"
            items={queue.acceptQueue}
            emptyText="Brak przesylek oczekujacych na przyjecie."
            renderAction={(item) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!pointCode || busyKey === `accept-${item.trackingNumber}`}
                  onClick={() =>
                    pointCode &&
                    runPointAction(`accept-${item.trackingNumber}`, () => acceptPointShipment(pointCode, item.trackingNumber))
                  }
                  className="rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                >
                  Przyjmij
                </button>
                <button
                  type="button"
                  disabled={!pointCode || busyKey === `post-${item.trackingNumber}`}
                  onClick={() =>
                    pointCode && runPointAction(`post-${item.trackingNumber}`, () => postPointShipment(pointCode, item.trackingNumber))
                  }
                  className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
                >
                  Nadaj dalej
                </button>
              </div>
            )}
          />

          <QueueSection
            title="Do wydania klientowi"
            items={queue.pickupQueue}
            emptyText="Brak przesylek gotowych do odbioru."
            renderAction={(item) => (
              <button
                type="button"
                disabled={!pointCode || busyKey === `release-${item.trackingNumber}`}
                onClick={() =>
                  pointCode && runPointAction(`release-${item.trackingNumber}`, () => releasePointShipment(pointCode, item.trackingNumber))
                }
                className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
              >
                Wydaj przesylke
              </button>
            )}
          />

          <QueueSection
            title="Platnosci offline"
            items={queue.offlinePaymentQueue}
            emptyText="Brak platnosci offline do potwierdzenia."
            renderAction={(item) => (
              <button
                type="button"
                disabled={!pointCode || !item.paymentId || busyKey === `offline-${item.paymentId}`}
                onClick={() =>
                  pointCode &&
                  item.paymentId &&
                  runPointAction(`offline-${item.paymentId}`, () => confirmOfflinePayment(pointCode, item.paymentId!))
                }
                className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-70"
              >
                Potwierdz platnosc
              </button>
            )}
          />
        </div>
      ) : null}
    </DashboardShell>
  );
}
