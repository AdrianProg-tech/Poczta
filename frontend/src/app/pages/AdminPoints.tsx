import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function AdminPoints() {
  const {
    state: { points },
  } = useAppStateContext();

  return (
    <DashboardShell role="admin" title="Punkty odbioru">
      <div className="grid gap-4">
        {points.map((point) => (
          <div key={point.id} className="bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-lg mb-1">{point.name}</div>
                <div className="text-sm text-muted-foreground">{point.address}</div>
              </div>
              <div className="text-sm text-muted-foreground">{point.hours}</div>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
