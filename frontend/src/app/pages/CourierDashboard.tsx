import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, Clock, Navigation, Package } from 'lucide-react';
import { formatDate, getCourierTasks, type CourierTaskListItem } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function CourierDashboard() {
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [tasks, setTasks] = useState<CourierTaskListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    if (!currentUser?.email) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setTasks(await getCourierTasks(currentUser.email));
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const stats = useMemo(
    () => [
      { label: 'Otwarte zadania', value: tasks.length, icon: Package, color: 'text-accent' },
      {
        label: 'W trasie',
        value: tasks.filter((task) => task.taskStatus === 'IN_PROGRESS').length,
        icon: Navigation,
        color: 'text-info',
      },
      {
        label: 'Do startu',
        value: tasks.filter((task) => task.taskStatus === 'ASSIGNED' || task.taskStatus === 'ACCEPTED').length,
        icon: Clock,
        color: 'text-warning',
      },
      {
        label: 'Pozytywne zakończenia',
        value: tasks.filter((task) => task.shipmentStatus === 'DELIVERED').length,
        icon: CheckCircle,
        color: 'text-success',
      },
    ],
    [tasks],
  );

  return (
    <DashboardShell role="courier" title="Dashboard kuriera">
      <div className="mb-8">
        <h2 className="mb-2 text-2xl">Dzień dobry, {currentUser?.name.split(' ')[0]}!</h2>
        <p className="text-muted-foreground">Ten widok pokazuje prawdziwe zadania kuriera przypisane w backendzie.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div className="text-3xl">{isLoading ? '...' : stat.value}</div>
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-6">
          <h3 className="text-xl">Dzisiejsze zadania</h3>
        </div>

        {isLoading ? <div className="p-6">Ładowanie zadań...</div> : null}

        {!isLoading && tasks.length === 0 ? (
          <div className="p-6 text-muted-foreground">Brak aktywnych zadań dla tego kuriera.</div>
        ) : null}

        <div className="divide-y divide-border">
          {tasks.map((task) => (
            <div key={task.taskId} className="p-6 transition-colors hover:bg-muted/50">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="text-lg">{task.trackingNumber}</div>
                    <StatusBadge status={task.shipmentStatus ?? task.taskStatus} />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Odbiorca</div>
                      <div>{task.recipientName}</div>
                      <div className="text-sm text-muted-foreground">{task.recipientPhone}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Adres docelowy</div>
                      <div>{task.targetAddress}</div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">Plan: {formatDate(task.plannedDate)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
