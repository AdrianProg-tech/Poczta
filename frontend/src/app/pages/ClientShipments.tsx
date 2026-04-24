import { Link } from 'react-router';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';

export default function ClientShipments() {
  const {
    state: { currentUser, shipments },
  } = useAppStateContext();

  const clientShipments = shipments.filter((shipment) => shipment.clientId === currentUser?.id);

  return (
    <DashboardShell role="client" title="Moje przesyłki">
      <div className="mb-8">
        <h2 className="text-2xl mb-2">Wszystkie przesyłki</h2>
        <p className="text-muted-foreground">
          Przegląd wszystkich przesyłek klienta wraz z najważniejszymi statusami.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl">Lista przesyłek</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Łącznie: {clientShipments.length}
            </p>
          </div>
          <Link
            to="/client/shipments/create"
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            Nowa przesyłka
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  Numer
                </th>
                <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  Odbiorca
                </th>
                <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  Płatność
                </th>
                <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  Dostawa
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clientShipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/client/shipments/${shipment.id}`} className="text-accent hover:underline">
                      {shipment.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{shipment.recipient.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={shipment.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={shipment.payment.status} type="payment" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                    {shipment.estimatedDelivery}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
