import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';

export default function PointShipments() {
  const {
    state: { currentUser, shipments },
  } = useAppStateContext();

  const pointShipments = shipments.filter((shipment) => shipment.pointId === currentUser?.id);

  return (
    <DashboardShell role="point" title="Przesyłki w punkcie">
      <div className="mb-8">
        <h2 className="text-2xl mb-2">Przesyłki w punkcie</h2>
        <p className="text-muted-foreground">Aktualny stan paczek obsługiwanych przez wybrany punkt.</p>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pointShipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{shipment.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{shipment.recipient.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={shipment.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={shipment.payment.status} type="payment" />
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
