import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function AdminClaims() {
  const {
    state: { claims },
  } = useAppStateContext();

  return (
    <DashboardShell role="admin" title="Reklamacje">
      <div className="grid gap-4">
        {claims.map((claim) => (
          <div key={claim.id} className="bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div>{claim.subject}</div>
              <div className="text-sm">{claim.status}</div>
            </div>
            <div className="text-sm text-muted-foreground mb-1">Przesyłka: {claim.shipmentId}</div>
            <div className="text-sm text-muted-foreground">{claim.description}</div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
