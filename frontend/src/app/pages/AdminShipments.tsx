import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';

export default function AdminShipments() {
  const {
    state: { shipments },
  } = useAppStateContext();

  return (
    <DashboardShell role="admin" title="Przesyłki">
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  Numer
                </th>
                <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  Nadawca
                </th>
                <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  Odbiorca
                </th>
                <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{shipment.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{shipment.sender.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{shipment.recipient.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={shipment.status} />
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
