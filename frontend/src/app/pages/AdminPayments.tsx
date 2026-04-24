import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';

export default function AdminPayments() {
  const {
    state: { shipments },
  } = useAppStateContext();

  return (
    <DashboardShell role="admin" title="Płatności">
      <div className="grid gap-4">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div>{shipment.id}</div>
                <div className="text-sm text-muted-foreground">{shipment.payment.method}</div>
              </div>
              <div className="flex items-center gap-4">
                <div>{shipment.payment.amount}</div>
                <StatusBadge status={shipment.payment.status} type="payment" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
