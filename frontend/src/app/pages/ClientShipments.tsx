import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, CreditCard, Printer, RefreshCw, RotateCcw, ScanSearch } from 'lucide-react';
import {
  formatDateTime,
  getClientShipmentDetails,
  getClientShipments,
  initiateOnlinePayment,
  type ClientShipmentListItem,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';
import { useTranslation } from 'react-i18next';

export function canShowPaymentShortcut(shipment: ClientShipmentListItem) {
  return shipment.paymentStatus === 'PENDING';
}

export function canShowRedirectShortcut(shipment: ClientShipmentListItem) {
  return !['AWAITING_PICKUP', 'AWAITING_LOCKER_PICKUP', 'DELIVERED', 'RETURNED', 'CANCELED'].includes(shipment.currentStatus);
}

function printClientShipmentSummary(shipment: ClientShipmentListItem) {
  if (typeof window === 'undefined') {
    return;
  }

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    return;
  }

  const documentHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>PingwinPost - ${shipment.trackingNumber}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
      .sheet { border: 2px solid #111827; border-radius: 16px; padding: 28px; }
      .brand { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
      .eyebrow { color: #4b5563; font-size: 14px; margin-bottom: 24px; }
      .tracking { font-size: 30px; font-weight: 700; letter-spacing: 1px; margin: 12px 0 20px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 24px; }
      .label { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
      .value { font-size: 16px; }
      @media print { body { margin: 0; } .sheet { border: none; border-radius: 0; } }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="brand">PingwinPost</div>
      <div class="eyebrow">Szybki wydruk klienta z listy przesylek</div>
      <div class="tracking">${shipment.trackingNumber}</div>
      <div class="grid">
        <div><div class="label">Odbiorca</div><div class="value">${shipment.recipientName}</div></div>
        <div><div class="label">Status przesylki</div><div class="value">${shipment.currentStatus}</div></div>
        <div><div class="label">Status platnosci</div><div class="value">${shipment.paymentStatus ?? 'Brak danych'}</div></div>
        <div><div class="label">Cel</div><div class="value">${shipment.destinationSummary}</div></div>
        <div><div class="label">Utworzona</div><div class="value">${formatDateTime(shipment.createdAt)}</div></div>
        <div><div class="label">ETA</div><div class="value">${shipment.estimatedDeliveryDate ? formatDateTime(shipment.estimatedDeliveryDate) : 'Brak danych'}</div></div>
      </div>
    </div>
  </body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(documentHtml);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export default function ClientShipments() {
  const { t } = useTranslation();
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [shipments, setShipments] = useState<ClientShipmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busyActionKey, setBusyActionKey] = useState<string | null>(null);

  const loadShipments = useCallback(async () => {
    if (!currentUser?.email) {
      setShipments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getClientShipments(currentUser.email);
      setShipments(data);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie pobrac przesylek.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    void loadShipments();
  }, [loadShipments]);

  const filteredShipments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return shipments;
    }

    return shipments.filter((shipment) =>
      [shipment.trackingNumber, shipment.recipientName, shipment.destinationSummary, shipment.currentStatus, shipment.paymentStatus]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, shipments]);

  const summary = useMemo(
    () => ({
      total: shipments.length,
      pendingPayment: shipments.filter((shipment) => shipment.paymentStatus === 'PENDING').length,
      redirectable: shipments.filter(canShowRedirectShortcut).length,
      delivered: shipments.filter((shipment) => shipment.currentStatus === 'DELIVERED').length,
    }),
    [shipments],
  );

  async function handlePayOnline(trackingNumber: string) {
    if (!currentUser?.email) {
      return;
    }

    const actionKey = `pay-${trackingNumber}`;
    setBusyActionKey(actionKey);
    setError(null);
    try {
      const details = await getClientShipmentDetails(currentUser.email, trackingNumber);
      if (details.payment.status !== 'PENDING' || details.payment.method !== 'ONLINE' || !details.payment.paymentId) {
        throw new Error('Ta przesylka nie ma juz aktywnej platnosci online do uruchomienia.');
      }

      const { checkoutUrl } = await initiateOnlinePayment(currentUser.email, details.payment.paymentId);
      window.location.href = checkoutUrl;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie uruchomic platnosci online.');
      setBusyActionKey(null);
    }
  }

  return (
    <DashboardShell role="client" title="Moje przesylki">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="mb-2 text-2xl">Wszystkie przesylki</h2>
          <p className="text-muted-foreground">
            Lista przesylek powiazanych z zalogowanym klientem z szybkimi akcjami bez schodzenia do szczegolow.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadShipments()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">Wszystkie przesylki</div>
          <div className="mt-2 text-3xl">{summary.total}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">Czekaja na platnosc</div>
          <div className="mt-2 text-3xl">{summary.pendingPayment}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">Mozna przekierowac</div>
          <div className="mt-2 text-3xl">{summary.redirectable}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">Doreczone</div>
          <div className="mt-2 text-3xl">{summary.delivered}</div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <label className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <ScanSearch className="h-4 w-4" />
          Numer / odbiorca / cel / status
        </label>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Wpisz tracking, nazwisko odbiorcy albo miasto docelowe"
          className="w-full rounded-lg border border-border bg-input-background px-4 py-3 outline-none transition-colors focus:border-accent"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border p-6">
          <div>
            <h3 className="text-xl">Lista przesylek</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Widoczne: {filteredShipments.length} / Lacznie: {shipments.length}
            </p>
          </div>
          <Link
            to="/client/shipments/create"
            className="rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90"
          >
            Nowa przesylka
          </Link>
        </div>

        {isLoading ? <div className="p-6">Ladowanie przesylek...</div> : null}
        {error ? <div className="p-6 text-destructive">{error}</div> : null}

        {!isLoading && !error ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Numer</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Odbiorca</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Platnosc</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Cel</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Utworzona</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredShipments.map((shipment) => (
                  <tr key={shipment.trackingNumber} className="transition-colors hover:bg-muted/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link to={`/client/shipments/${shipment.trackingNumber}`} className="text-accent hover:underline">
                        {shipment.trackingNumber}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">{shipment.recipientName}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={shipment.currentStatus} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={shipment.paymentStatus} type="payment" />
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{shipment.destinationSummary}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{formatDateTime(shipment.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/client/shipments/${shipment.trackingNumber}`}
                          className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
                        >
                          Szczegoly
                        </Link>
                        {canShowPaymentShortcut(shipment) ? (
                          <button
                            type="button"
                            disabled={busyActionKey === `pay-${shipment.trackingNumber}`}
                            onClick={() => void handlePayOnline(shipment.trackingNumber)}
                            className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                          >
                            <CreditCard className="h-4 w-4" />
                            Oplac
                          </button>
                        ) : null}
                        {canShowRedirectShortcut(shipment) ? (
                          <Link
                            to={`/client/shipments/${shipment.trackingNumber}/redirect`}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Redirect
                          </Link>
                        ) : null}
                        <Link
                          to={`/client/claims?tracking=${encodeURIComponent(shipment.trackingNumber)}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
                        >
                          <AlertCircle className="h-4 w-4" />
                          Reklamacja
                        </Link>
                        <button
                          type="button"
                          onClick={() => printClientShipmentSummary(shipment)}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
                        >
                          <Printer className="h-4 w-4" />
                          Drukuj
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && !error && filteredShipments.length === 0 ? (
          <div className="p-6 text-muted-foreground">Brak przesylek dla tego filtra lub konta klienta.</div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
