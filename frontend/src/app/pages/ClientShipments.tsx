import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { formatDateTime, getClientShipments, type ClientShipmentListItem } from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';

export default function ClientShipments() {
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [shipments, setShipments] = useState<ClientShipmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(requestError instanceof Error ? requestError.message : 'Nie udało się pobrać przesyłek.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    void loadShipments();
  }, [loadShipments]);

  return (
    <DashboardShell role="client" title="Moje przesyłki">
      <div className="mb-8">
        <h2 className="mb-2 text-2xl">Wszystkie przesyłki</h2>
        <p className="text-muted-foreground">Lista przesyłek powiązanych z zalogowanym klientem.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border p-6">
          <div>
            <h3 className="text-xl">Lista przesyłek</h3>
            <p className="mt-1 text-sm text-muted-foreground">Łącznie: {shipments.length}</p>
          </div>
          <Link
            to="/client/shipments/create"
            className="rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90"
          >
            Nowa przesyłka
          </Link>
        </div>

        {isLoading ? <div className="p-6">Ładowanie przesyłek...</div> : null}
        {error ? <div className="p-6 text-destructive">{error}</div> : null}

        {!isLoading && !error ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Numer</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Odbiorca</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Płatność</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Cel</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Utworzona</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shipments.map((shipment) => (
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
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                      {formatDateTime(shipment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && !error && shipments.length === 0 ? (
          <div className="p-6 text-muted-foreground">Ten klient nie ma jeszcze żadnych przesyłek.</div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
