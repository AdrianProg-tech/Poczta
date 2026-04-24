import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function AdminUsers() {
  const {
    state: { users },
  } = useAppStateContext();

  return (
    <DashboardShell role="admin" title="Użytkownicy">
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl">Użytkownicy systemu</h2>
        </div>
        <div className="divide-y divide-border">
          {users.map((user) => (
            <div key={user.id} className="p-6 flex items-center justify-between gap-4">
              <div>
                <div>{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
              <div className="text-sm">{user.role}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
