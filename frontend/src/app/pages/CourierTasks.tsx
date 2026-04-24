import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';

export default function CourierTasks() {
  const {
    state: { currentUser, shipments },
  } = useAppStateContext();

  const tasks = shipments.filter(
    (shipment) =>
      shipment.assignedCourierId === currentUser?.id &&
      shipment.status !== 'Doręczona' &&
      shipment.status !== 'Zwrócona',
  );

  return (
    <DashboardShell role="courier" title="Zadania kuriera">
      <div className="mb-8">
        <h2 className="text-2xl mb-2">Dzisiejsze zadania</h2>
        <p className="text-muted-foreground">Lista aktywnych przesyłek przypisanych do kuriera.</p>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <div key={task.id} className="bg-card border border-border rounded-xl shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-lg">{task.id}</div>
                  <StatusBadge status={task.status} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Odbiorca</div>
                    <div>{task.recipient.name}</div>
                    <div className="text-muted-foreground">{task.recipient.phone}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Adres dostawy</div>
                    <div>{task.recipient.address}</div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Planowana dostawa: {task.estimatedDelivery}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
