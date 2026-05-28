import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, ArrowRight, CheckCircle, Clock, Package, Plus, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDateTime, getClientComplaints, getClientShipments, type ClientShipmentListItem } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function ClientDashboard() {
  const { t } = useTranslation();
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [shipments, setShipments] = useState<ClientShipmentListItem[]>([]);
  const [openComplaintsCount, setOpenComplaintsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadShipments = useCallback(async () => {
    if (!currentUser?.email) {
      setShipments([]);
      setOpenComplaintsCount(0);
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
      setOpenComplaintsCount(complaintsData.filter((c) => c.status !== 'CLOSED' && c.status !== 'REJECTED').length);
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
        label: t('clientDashboard.statActive'),
        value: shipments.filter((s) => !['DELIVERED', 'RETURNED', 'CANCELED'].includes(s.currentStatus)).length,
        icon: Package,
        color: 'text-accent',
      },
      { label: t('clientDashboard.statAll'), value: shipments.length, icon: TrendingUp, color: 'text-success' },
      {
        label: t('clientDashboard.statAwaiting'),
        value: shipments.filter((s) => ['AWAITING_PICKUP', 'AWAITING_LOCKER_PICKUP'].includes(s.currentStatus)).length,
        icon: Clock,
        color: 'text-warning',
      },
      {
        label: t('clientDashboard.statDelivered'),
        value: shipments.filter((s) => s.currentStatus === 'DELIVERED').length,
        icon: CheckCircle,
        color: 'text-success',
      },
    ],
    [shipments, t],
  );

  const recentShipments = shipments.slice(0, 4);

  return (
    <DashboardShell role="client" title={t('clientDashboard.title')}>
      <div className="mb-8">
        <h2 className="mb-2 text-2xl">{t('clientDashboard.welcome', { name: currentUser?.name.split(' ')[0] })}</h2>
        <p className="text-muted-foreground">{t('clientDashboard.subtitle')}</p>
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

      {openComplaintsCount > 0 ? (
        <div className="mb-8">
          <Link
            to="/client/claims"
            className="flex items-center justify-between rounded-xl border border-warning/30 bg-warning/10 p-5 transition-colors hover:bg-warning/20"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-warning" />
              <div>
                <div className="text-sm">{t('clientDashboard.openComplaints')}</div>
                <div className="text-2xl">{openComplaintsCount}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {t('clientDashboard.goToComplaints')}
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>
      ) : null}

      <div className="mb-8 rounded-xl bg-gradient-to-br from-accent to-accent/90 p-6 text-white">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="mb-2 text-xl">{t('clientDashboard.ctaTitle')}</h3>
            <p className="text-white/80">{t('clientDashboard.ctaDesc')}</p>
          </div>
          <Link
            to="/client/shipments/create"
            className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-accent transition-colors hover:bg-white/90"
          >
            <Plus className="h-5 w-5" />
            <span>{t('clientDashboard.ctaButton')}</span>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-6">
          <h3 className="text-xl">{t('clientDashboard.recentShipments')}</h3>
          <Link to="/client/shipments" className="flex items-center gap-1 text-sm text-accent transition-colors hover:text-accent/80">
            {t('clientDashboard.viewAll')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? <div className="p-6">{t('clientDashboard.loading')}</div> : null}

        {!isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('clientDashboard.colNumber')}</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('clientDashboard.colStatus')}</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('clientDashboard.colRecipient')}</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('clientDashboard.colDestination')}</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('clientDashboard.colDate')}</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('clientDashboard.colActions')}</th>
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
                        {t('clientDashboard.details')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && recentShipments.length === 0 ? (
          <div className="p-6 text-muted-foreground">{t('clientDashboard.empty')}</div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
