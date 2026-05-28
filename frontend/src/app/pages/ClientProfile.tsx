import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, CheckCircle, Clock, Mail, Package, Plus, TrendingUp, User } from 'lucide-react';
import { getClientComplaints, getClientShipments, type ClientShipmentListItem, type ComplaintSummary } from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function ClientProfile() {
  const {
    state: { currentUser },
  } = useAppStateContext();

  const [shipments, setShipments] = useState<ClientShipmentListItem[]>([]);
  const [complaints, setComplaints] = useState<ComplaintSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentUser?.email) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [shipmentsData, complaintsData] = await Promise.all([
        getClientShipments(currentUser.email),
        getClientComplaints(currentUser.email),
      ]);
      setShipments(shipmentsData);
      setComplaints(complaintsData);
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

  const openComplaints = complaints.filter((c) => c.status !== 'CLOSED' && c.status !== 'REJECTED').length;

  const stats = useMemo(
    () => [
      {
        label: 'Wszystkie przesyłki',
        value: shipments.length,
        icon: Package,
        color: 'text-accent',
        link: '/client/shipments',
      },
      {
        label: 'Doręczone',
        value: shipments.filter((s) => s.currentStatus === 'DELIVERED').length,
        icon: CheckCircle,
        color: 'text-success',
        link: '/client/shipments',
      },
      {
        label: 'W drodze',
        value: shipments.filter((s) =>
          ['POSTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERY_ATTEMPT'].includes(s.currentStatus),
        ).length,
        icon: TrendingUp,
        color: 'text-warning',
        link: '/client/shipments',
      },
      {
        label: 'Czekają na odbiór',
        value: shipments.filter((s) => s.currentStatus === 'AWAITING_PICKUP').length,
        icon: Clock,
        color: 'text-warning',
        link: '/client/shipments',
      },
      {
        label: 'Reklamacje',
        value: complaints.length,
        icon: AlertCircle,
        color: 'text-destructive',
        link: '/client/claims',
      },
      {
        label: 'Otwarte reklamacje',
        value: openComplaints,
        icon: AlertCircle,
        color: openComplaints > 0 ? 'text-destructive' : 'text-muted-foreground',
        link: '/client/claims',
      },
    ],
    [shipments, complaints, openComplaints],
  );

  return (
    <DashboardShell role="client" title="Mój profil">
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
                  <span>Rola: Klient</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity stats */}
        <div>
          <h3 className="mb-4 text-lg">Statystyki konta</h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
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
              to="/client/shipments/create"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Plus className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="font-medium">Nadaj przesyłkę</div>
                <div className="text-sm text-muted-foreground">Utwórz nową przesyłkę</div>
              </div>
            </Link>

            <Link
              to="/client/shipments"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="font-medium">Moje przesyłki</div>
                <div className="text-sm text-muted-foreground">Śledź i zarządzaj przesyłkami</div>
              </div>
            </Link>

            <Link
              to="/client/claims"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="font-medium">Reklamacje</div>
                <div className="text-sm text-muted-foreground">
                  {openComplaints > 0 ? `${openComplaints} otwartych reklamacji` : 'Brak otwartych reklamacji'}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
