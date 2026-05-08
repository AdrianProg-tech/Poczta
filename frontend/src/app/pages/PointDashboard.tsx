import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, Clock, Download, Upload } from 'lucide-react';
import { getPointQueue, type PointQueueResponse } from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function PointDashboard() {
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [queue, setQueue] = useState<PointQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadQueue = useCallback(async () => {
    if (!currentUser?.pointCode) {
      setQueue(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setQueue(await getPointQueue(currentUser.pointCode));
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.pointCode]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const stats = useMemo(
    () => [
      { label: 'Do przyjęcia', value: queue?.acceptQueue.length ?? 0, icon: Upload, color: 'text-info' },
      { label: 'Do wydania', value: queue?.pickupQueue.length ?? 0, icon: Download, color: 'text-accent' },
      {
        label: 'Płatności offline',
        value: queue?.offlinePaymentQueue.length ?? 0,
        icon: CheckCircle,
        color: 'text-success',
      },
      {
        label: 'Łączna kolejka',
        value: (queue?.acceptQueue.length ?? 0) + (queue?.pickupQueue.length ?? 0) + (queue?.offlinePaymentQueue.length ?? 0),
        icon: Clock,
        color: 'text-warning',
      },
    ],
    [queue],
  );

  return (
    <DashboardShell role="point" title="Dashboard punktu">
      <div className="mb-8">
        <h2 className="mb-2 text-2xl">Panel punktu odbioru</h2>
        <p className="text-muted-foreground">
          {currentUser?.name} • {currentUser?.pointCode} • {currentUser?.location}
        </p>
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

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-3 text-xl">Stan operacyjny punktu</h3>
        {isLoading ? <div>Ładowanie kolejki...</div> : null}
        {!isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-secondary p-4">
              <div className="mb-2 text-sm text-muted-foreground">Do przyjęcia</div>
              <div>{queue?.acceptQueue.length ?? 0} przesyłek</div>
            </div>
            <div className="rounded-lg bg-secondary p-4">
              <div className="mb-2 text-sm text-muted-foreground">Do wydania</div>
              <div>{queue?.pickupQueue.length ?? 0} przesyłek</div>
            </div>
            <div className="rounded-lg bg-secondary p-4">
              <div className="mb-2 text-sm text-muted-foreground">Płatności offline</div>
              <div>{queue?.offlinePaymentQueue.length ?? 0} płatności</div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
