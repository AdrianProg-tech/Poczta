import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CreditCard, Download, Mail, MapPin, Package, Upload, User } from 'lucide-react';
import { getPointQueue, type PointQueueResponse } from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function PointProfile() {
  const {
    state: { currentUser },
  } = useAppStateContext();

  const [queue, setQueue] = useState<PointQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentUser?.email) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      setQueue(await getPointQueue(currentUser.email));
    } catch {
      // Queue load is non-critical; show zeros if unavailable
      setQueue(null);
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

  const stats = [
    {
      label: 'Kolejka przyjęcia',
      value: queue?.acceptQueue.length ?? 0,
      icon: Upload,
      color: 'text-accent',
      link: '/point/accept',
    },
    {
      label: 'Kolejka wydań',
      value: queue?.pickupQueue.length ?? 0,
      icon: Download,
      color: 'text-success',
      link: '/point/release',
    },
    {
      label: 'Płatności offline',
      value: queue?.offlinePaymentQueue.length ?? 0,
      icon: CreditCard,
      color: 'text-warning',
      link: '/point/payment-verification',
    },
    {
      label: 'Łącznie w kolejce',
      value: (queue?.acceptQueue.length ?? 0) + (queue?.pickupQueue.length ?? 0) + (queue?.offlinePaymentQueue.length ?? 0),
      icon: Package,
      color: 'text-muted-foreground',
      link: '/point/shipments',
    },
  ];

  return (
    <DashboardShell role="point" title="Mój profil">
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
                  <span>Rola: Pracownik punktu</span>
                </div>
                {currentUser?.pointCode ? (
                  <div className="flex items-center justify-center gap-2 sm:justify-start">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>
                      {currentUser.pointName ? `${currentUser.pointName} (${currentUser.pointCode})` : currentUser.pointCode}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Queue stats */}
        <div>
          <h3 className="mb-4 text-lg">Live kolejka punktu</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {stats.map((item) => (
              <Link
                key={item.label}
                to={item.link}
                className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/50"
              >
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  {item.label}
                </div>
                <div className={`text-3xl ${item.color}`}>
                  {isLoading ? '...' : item.value}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h3 className="mb-4 text-lg">Szybkie akcje</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/point/accept"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Upload className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="font-medium">Przyjmij przesyłki</div>
                <div className="text-sm text-muted-foreground">Kolejka przyjęcia i nadania</div>
              </div>
            </Link>

            <Link
              to="/point/release"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Download className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="font-medium">Wydaj przesyłki</div>
                <div className="text-sm text-muted-foreground">Kolejka wydań do odbiorców</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
