import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CheckCircle, Clock, Mail, MapPin, Package, Truck, User, XCircle } from 'lucide-react';
import { getCourierTasks, type CourierTaskListItem } from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function CourierProfile() {
  const {
    state: { currentUser },
  } = useAppStateContext();

  const [tasks, setTasks] = useState<CourierTaskListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentUser?.email) {
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
    void loadData();
  }, [loadData]);

  const initials = useMemo(() => {
    if (!currentUser?.name) return '?';
    return currentUser.name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [currentUser?.name]);

  const stats = useMemo(
    () => [
      {
        label: 'Wszystkie zadania',
        value: tasks.length,
        icon: Package,
        color: 'text-accent',
      },
      {
        label: 'Przypisane',
        value: tasks.filter((t) => t.taskStatus === 'ASSIGNED').length,
        icon: Clock,
        color: 'text-warning',
      },
      {
        label: 'W trakcie',
        value: tasks.filter((t) => ['ACCEPTED', 'IN_PROGRESS'].includes(t.taskStatus)).length,
        icon: Truck,
        color: 'text-accent',
      },
      {
        label: 'Zakończone',
        value: tasks.filter((t) => t.taskStatus === 'COMPLETED').length,
        icon: CheckCircle,
        color: 'text-success',
      },
      {
        label: 'Nieudane',
        value: tasks.filter((t) => t.taskStatus === 'FAILED').length,
        icon: XCircle,
        color: 'text-destructive',
      },
      {
        label: 'Wymagają płatności',
        value: tasks.filter((t) => t.requiresPaymentCollection).length,
        icon: Clock,
        color: 'text-warning',
      },
    ],
    [tasks],
  );

  return (
    <DashboardShell role="courier" title="Mój profil">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* Avatar + basic info */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent text-2xl text-white">
              {initials}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl">{currentUser?.name ?? '—'}</h2>

              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{currentUser?.email ?? '—'}</span>
                </div>
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <User className="h-4 w-4 shrink-0" />
                  <span>Rola: Kurier</span>
                </div>
                {currentUser?.serviceCity ? (
                  <div className="flex items-center justify-center gap-2 sm:justify-start">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>Rejon: {currentUser.serviceCity}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Task stats */}
        <div>
          <h3 className="mb-4 text-lg">Statystyki zadań</h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  {item.label}
                </div>
                <div className={`text-3xl ${item.color}`}>
                  {isLoading ? '...' : item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick action */}
        <div>
          <h3 className="mb-4 text-lg">Szybkie akcje</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/courier/tasks"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Truck className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="font-medium">Moje zadania</div>
                <div className="text-sm text-muted-foreground">Lista zadań doręczeń</div>
              </div>
            </Link>

            <Link
              to="/courier"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="font-medium">Panel kuriera</div>
                <div className="text-sm text-muted-foreground">Powrót do dashboardu</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
