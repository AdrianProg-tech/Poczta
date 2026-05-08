import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CheckCircle, Clock, Package, Plus, TrendingUp } from 'lucide-react';
import { formatDateTime, getClientShipments, type ClientShipmentListItem } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function ClientDashboard() {
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [shipments, setShipments] = useState<ClientShipmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadShipments = useCallback(async () => {
    if (!currentUser?.email) {
      setShipments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setShipments(await getClientShipments(currentUser.email));
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    void loadShipments();
  }, [loadShipments]);

  const stats = useMemo(
    () => [
      {
        label: 'Aktywne przesyłki',
        value: shipments.filter((shipment) => shipment.currentStatus !== 'DELIVERED').length,
        icon: Package,
        color: 'text-accent',
      },
      { label: 'W tym koncie', value: shipments.length, icon: TrendingUp, color: 'text-success' },
      {
        label: 'Czekają na odbiór',
        value: shipments.filter((shipment) => shipment.currentStatus === 'AWAITING_PICKUP').length,
        icon: Clock,
        color: 'text-warning',
      },
      {
        label: 'Doręczone',
        value: shipments.filter((shipment) => shipment.currentStatus === 'DELIVERED').length,
        icon: CheckCircle,
        color: 'text-success',
      },
    ],
    [shipments],
  );

  const recentShipments = shipments.slice(0, 4);

  return (
    <DashboardShell role="client" title="Dashboard klienta">
      <div className="mb-8">
        <h2 className="mb-2 text-2xl">Witaj, {currentUser?.name.split(' ')[0]}!</h2>
        <p className="text-muted-foreground">Twoje konto działa już na żywym backendzie bez mocków.</p>
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

      <div className="mb-8 rounded-xl bg-gradient-to-br from-accent to-accent/90 p-6 text-white">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="mb-2 text-xl">Nadaj nową przesyłkę</h3>
            <p className="text-white/80">Formularz tworzy prawdziwy shipment w backendzie i zwraca tracking number.</p>
          </div>
          <Link
            to="/client/shipments/create"
            className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-accent transition-colors hover:bg-white/90"
          >
            <Plus className="h-5 w-5" />
            <span>Nowa przesyłka</span>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-6">
          <h3 className="text-xl">Ostatnie przesyłki</h3>
          <Link to="/client/shipments" className="flex items-center gap-1 text-sm text-accent transition-colors hover:text-accent/80">
            Zobacz wszystkie
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? <div className="p-6">Ładowanie przesyłek...</div> : null}

        {!isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Numer</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Odbiorca</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Cel</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Data</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentShipments.map((shipment) => (
                  <tr key={shipment.trackingNumber} className="transition-colors hover:bg-muted/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link to={`/client/shipments/${shipment.trackingNumber}`} className="text-accent hover:underline">
                        {shipment.trackingNumber}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={shipment.currentStatus} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">{shipment.recipientName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{shipment.destinationSummary}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{formatDateTime(shipment.createdAt)}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link to={`/client/shipments/${shipment.trackingNumber}`} className="text-sm text-accent hover:text-accent/80">
                        Szczegóły
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && recentShipments.length === 0 ? (
          <div className="p-6 text-muted-foreground">Brak przesyłek dla tego klienta.</div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
