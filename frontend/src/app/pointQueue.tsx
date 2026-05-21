import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Download, Printer, ScanSearch } from 'lucide-react';
import { formatDateTime, getPointQueue, type PointQueueItem, type PointQueueResponse } from './api';
import { StatusBadge } from './components/StatusBadge';
import { useAppStateContext } from './state/AppStateContext';

export interface PointQueueStat {
  key: 'accept' | 'pickup' | 'offline';
  label: string;
  description: string;
  path: string;
  value: number;
}

export function formatPointQueueType(type: string) {
  const labels: Record<string, string> = {
    ACCEPT: 'Do przyjecia',
    ACCEPT_REDIRECT: 'Redirect do przyjecia',
    PICKUP: 'Do wydania',
    OFFLINE_PAYMENT: 'Offline payment',
  };
  return labels[type] ?? type;
}

export function getPointQueueStats(queue: PointQueueResponse | null): PointQueueStat[] {
  return [
    {
      key: 'accept',
      label: 'Przyjecie',
      description: 'Skany przyjecia, redirecty i nadanie dalej.',
      path: '/point/accept',
      value: queue?.acceptQueue.length ?? 0,
    },
    {
      key: 'pickup',
      label: 'Wydanie',
      description: 'Obsluga odbioru paczki przez klienta.',
      path: '/point/release',
      value: queue?.pickupQueue.length ?? 0,
    },
    {
      key: 'offline',
      label: 'Platnosci offline',
      description: 'Potwierdzanie gotowki i szybkie checkouty.',
      path: '/point/payment-verification',
      value: queue?.offlinePaymentQueue.length ?? 0,
    },
  ];
}

export function filterPointQueueItems(items: PointQueueItem[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => {
    const haystack = [item.trackingNumber, item.recipientName, item.paymentId, item.queueType, item.shipmentStatus, item.paymentStatus]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function getPointQueueItemKey(item: PointQueueItem) {
  return `${item.paymentId ?? item.trackingNumber}-${item.queueType}`;
}

export function getSelectedPointQueueItems(items: PointQueueItem[], selectedKeys: Set<string>) {
  return items.filter((item) => selectedKeys.has(getPointQueueItemKey(item)));
}

export function prunePointQueueSelection(items: PointQueueItem[], selectedKeys: Set<string>) {
  const visibleKeys = new Set(items.map(getPointQueueItemKey));
  return new Set([...selectedKeys].filter((key) => visibleKeys.has(key)));
}

function escapeCsvCell(value: string | null | undefined) {
  if (value == null) {
    return '""';
  }

  return `"${String(value).replaceAll('"', '""')}"`;
}

export function buildPointQueueCsv(items: PointQueueItem[]) {
  const header = [
    'trackingNumber',
    'recipientName',
    'queueType',
    'shipmentStatus',
    'paymentStatus',
    'paymentId',
    'createdAt',
    'expiresAt',
  ];

  const rows = items.map((item) =>
    [
      item.trackingNumber,
      item.recipientName,
      formatPointQueueType(item.queueType),
      item.shipmentStatus,
      item.paymentStatus,
      item.paymentId,
      item.createdAt,
      item.expiresAt,
    ]
      .map(escapeCsvCell)
      .join(','),
  );

  return [header.join(','), ...rows].join('\n');
}

export function downloadPointQueueCsv({
  items,
  filename,
}: {
  items: PointQueueItem[];
  filename: string;
}) {
  if (typeof window === 'undefined') {
    return;
  }

  const blob = new Blob([buildPointQueueCsv(items)], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function printPointQueueDigest({
  items,
  pointCode,
  title,
  subtitle,
}: {
  items: PointQueueItem[];
  pointCode?: string;
  title: string;
  subtitle: string;
}) {
  if (typeof window === 'undefined') {
    return;
  }

  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) {
    return;
  }

  const generatedAt = formatDateTime(new Date().toISOString());
  const rowsHtml = items
    .map(
      (item) => `<tr>
        <td>${item.trackingNumber}</td>
        <td>${item.recipientName}</td>
        <td>${formatPointQueueType(item.queueType)}</td>
        <td>${item.shipmentStatus}</td>
        <td>${item.paymentStatus ?? '-'}</td>
        <td>${item.paymentId ?? '-'}</td>
        <td>${formatDateTime(item.createdAt)}</td>
      </tr>`,
    )
    .join('');

  const documentHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
      .sheet { border: 1px solid #d1d5db; border-radius: 16px; padding: 24px; }
      .brand { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
      .eyebrow { color: #4b5563; font-size: 14px; margin-bottom: 10px; }
      .meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
      .metaCard { border: 1px solid #d1d5db; border-radius: 12px; padding: 12px; }
      .metaLabel { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
      .metaValue { font-size: 20px; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; margin-top: 18px; }
      th, td { border: 1px solid #d1d5db; padding: 10px; font-size: 13px; text-align: left; vertical-align: top; }
      th { background: #f3f4f6; }
      .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
      @media print { body { margin: 0; } .sheet { border: none; border-radius: 0; } }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="brand">PingwinPost</div>
      <div class="eyebrow">${title}</div>
      <div>${subtitle}</div>

      <div class="meta">
        <div class="metaCard">
          <div class="metaLabel">Punkt</div>
          <div class="metaValue">${pointCode ?? '-'}</div>
        </div>
        <div class="metaCard">
          <div class="metaLabel">Liczba rekordow</div>
          <div class="metaValue">${items.length}</div>
        </div>
        <div class="metaCard">
          <div class="metaLabel">Wygenerowano</div>
          <div class="metaValue">${generatedAt}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Tracking</th>
            <th>Odbiorca</th>
            <th>Kolejka</th>
            <th>Status przesylki</th>
            <th>Status platnosci</th>
            <th>Payment ID</th>
            <th>Dodano</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="7">Brak rekordow</td></tr>'}
        </tbody>
      </table>

      <div class="footer">Raport zmiany wygenerowano ${generatedAt}. Dokument pomocniczy do masowej obslugi punktu.</div>
    </div>
  </body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(documentHtml);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function printPointOperationDocument({
  item,
  pointCode,
  title,
  subtitle,
  primaryLabel,
}: {
  item: PointQueueItem;
  pointCode?: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
}) {
  if (typeof window === 'undefined') {
    return;
  }

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    return;
  }

  const generatedAt = formatDateTime(new Date().toISOString());
  const documentHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title} - ${item.trackingNumber}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
      .sheet { border: 2px solid #111827; border-radius: 16px; padding: 28px; }
      .brand { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
      .eyebrow { color: #4b5563; font-size: 14px; margin-bottom: 24px; }
      .tracking { font-size: 30px; font-weight: 700; letter-spacing: 1px; margin: 12px 0 4px; }
      .section { margin-top: 24px; padding-top: 16px; border-top: 1px solid #d1d5db; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 24px; }
      .label { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
      .value { font-size: 16px; }
      .pill { display: inline-block; border: 1px solid #111827; border-radius: 999px; padding: 6px 12px; margin-right: 8px; margin-top: 8px; }
      .footer { margin-top: 28px; font-size: 12px; color: #6b7280; }
      @media print { body { margin: 0; } .sheet { border: none; border-radius: 0; } }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="brand">PingwinPost</div>
      <div class="eyebrow">${title}</div>
      <div>${subtitle}</div>
      <div class="tracking">${item.trackingNumber}</div>
      <div class="pill">${primaryLabel}</div>
      <div class="pill">${formatPointQueueType(item.queueType)}</div>

      <div class="section grid">
        <div>
          <div class="label">Odbiorca</div>
          <div class="value">${item.recipientName}</div>
        </div>
        <div>
          <div class="label">Punkt</div>
          <div class="value">${pointCode ?? '-'}</div>
        </div>
        <div>
          <div class="label">Status przesylki</div>
          <div class="value">${item.shipmentStatus}</div>
        </div>
        <div>
          <div class="label">Status platnosci</div>
          <div class="value">${item.paymentStatus ?? 'Brak'}</div>
        </div>
        <div>
          <div class="label">Dodano do kolejki</div>
          <div class="value">${formatDateTime(item.createdAt)}</div>
        </div>
        <div>
          <div class="label">Payment ID</div>
          <div class="value">${item.paymentId ?? 'Brak'}</div>
        </div>
      </div>

      <div class="footer">Wydruk operacyjny wygenerowano ${generatedAt}. Dokument pomocniczy do obslugi punktu.</div>
    </div>
  </body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(documentHtml);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function PointQueueSearch({
  query,
  onQueryChange,
  label = 'Numer / skan / odbiorca',
}: {
  query: string;
  onQueryChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <label className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <ScanSearch className="h-4 w-4" />
        {label}
      </label>
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Wpisz tracking, payment ID albo nazwisko odbiorcy"
        className="w-full rounded-lg border border-border bg-input-background px-4 py-3 outline-none transition-colors focus:border-accent"
      />
    </div>
  );
}

export function PointPrintButton({
  item,
  pointCode,
  title,
  subtitle,
  primaryLabel,
}: {
  item: PointQueueItem;
  pointCode?: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={() => printPointOperationDocument({ item, pointCode, title, subtitle, primaryLabel })}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
    >
      <Printer className="h-4 w-4" />
      Drukuj etykiete
    </button>
  );
}

export function PointUtilityButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: 'print' | 'download';
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const Icon = icon === 'print' ? Printer : Download;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export function PointQueueBulkToolbar({
  selectedCount,
  selectableCount,
  isBusy,
  onToggleAllVisible,
  onClearSelection,
  actions,
}: {
  selectedCount: number;
  selectableCount: number;
  isBusy?: boolean;
  onToggleAllVisible: () => void;
  onClearSelection: () => void;
  actions: Array<{
    label: string;
    onClick: () => void;
    tone?: 'primary' | 'secondary' | 'success';
    disabled?: boolean;
  }>;
}) {
  const allVisibleSelected = selectableCount > 0 && selectedCount === selectableCount;

  const toneClassName = (tone: 'primary' | 'secondary' | 'success' = 'secondary') => {
    if (tone === 'primary') {
      return 'bg-accent text-white hover:bg-accent/90';
    }
    if (tone === 'success') {
      return 'bg-success text-white hover:bg-success/90';
    }
    return 'border border-border bg-card hover:bg-muted';
  };

  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/60 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm">
            Wybrano <span className="font-medium">{selectedCount}</span> z{' '}
            <span className="font-medium">{selectableCount}</span> widocznych rekordow.
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Tryb masowy dziala tylko na aktualnie widocznej i przefiltrowanej kolejce.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleAllVisible}
            disabled={selectableCount === 0 || isBusy}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-70"
          >
            {allVisibleSelected ? 'Odznacz widoczne' : `Zaznacz widoczne (${selectableCount})`}
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            disabled={selectedCount === 0 || isBusy}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-70"
          >
            Wyczyść wybor
          </button>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              disabled={selectedCount === 0 || isBusy || action.disabled}
              className={`rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-70 ${toneClassName(action.tone)}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function usePointQueueData() {
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [queue, setQueue] = useState<PointQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    if (!currentUser?.email) {
      setQueue(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setQueue(await getPointQueue(currentUser.email));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie pobrac kolejki punktu.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const runPointAction = useCallback(
    async (key: string, action: () => Promise<unknown>) => {
      setBusyKey(key);
      setError(null);
      try {
        await action();
        await loadQueue();
        return true;
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Operacja punktu nie powiodla sie.');
        return false;
      } finally {
        setBusyKey(null);
      }
    },
    [loadQueue],
  );

  const runPointBatchAction = useCallback(
    async (key: string, actions: Array<() => Promise<unknown>>) => {
      if (actions.length === 0) {
        return false;
      }

      setBusyKey(key);
      setError(null);
      try {
        for (const action of actions) {
          await action();
        }
        await loadQueue();
        return true;
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Operacja masowa punktu nie powiodla sie.');
        return false;
      } finally {
        setBusyKey(null);
      }
    },
    [loadQueue],
  );

  const queueStats = useMemo(() => getPointQueueStats(queue), [queue]);

  return {
    busyKey,
    error,
    isLoading,
    loadQueue,
    pointCode: currentUser?.pointCode,
    pointName: currentUser?.pointName,
    pointUserEmail: currentUser?.email,
    queue,
    queueStats,
    runPointAction,
    runPointBatchAction,
  };
}

export function PointQueueSection({
  title,
  description,
  headerAction,
  bulkToolbar,
  items,
  emptyText,
  renderAction,
  selectedKeys,
  onToggleItem,
  canSelectItem,
}: {
  title: string;
  description?: string;
  headerAction?: ReactNode;
  bulkToolbar?: ReactNode;
  items: PointQueueItem[];
  emptyText: string;
  renderAction?: (item: PointQueueItem) => ReactNode;
  selectedKeys?: Set<string>;
  onToggleItem?: (item: PointQueueItem) => void;
  canSelectItem?: (item: PointQueueItem) => boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-xl">
            {title} <span className="text-muted-foreground">({items.length})</span>
          </h3>
          {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {headerAction ? <div className="flex-shrink-0">{headerAction}</div> : null}
      </div>

      {bulkToolbar ? <div className="border-b border-border p-6">{bulkToolbar}</div> : null}

      {items.length === 0 ? <div className="p-6 text-muted-foreground">{emptyText}</div> : null}

      <div className="divide-y divide-border">
        {items.map((item) => (
          <div
            key={`${item.paymentId ?? item.trackingNumber}-${item.queueType}`}
            className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex flex-1 gap-4">
              {onToggleItem ? (
                <div className="pt-1">
                  <input
                    type="checkbox"
                    checked={selectedKeys?.has(getPointQueueItemKey(item)) ?? false}
                    disabled={canSelectItem ? !canSelectItem(item) : false}
                    onChange={() => onToggleItem(item)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                    aria-label={`Zaznacz ${item.trackingNumber}`}
                  />
                </div>
              ) : null}
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
                <div>{formatPointQueueType(item.queueType)}</div>
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
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={item.shipmentStatus} />
              {item.paymentStatus ? <StatusBadge status={item.paymentStatus} type="payment" /> : null}
              {renderAction ? renderAction(item) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
