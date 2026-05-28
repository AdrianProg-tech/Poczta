import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, CheckCircle, Clock, Mail, Package, Plus, TrendingUp, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getClientComplaints, getClientShipments, type ClientShipmentListItem, type ComplaintSummary } from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function ClientProfile() {
  const { t } = useTranslation();
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
      { label: t('clientProfile.statAll'), value: shipments.length, icon: Package, color: 'text-accent', link: '/client/shipments' },
      { label: t('clientProfile.statDelivered'), value: shipments.filter((s) => s.currentStatus === 'DELIVERED').length, icon: CheckCircle, color: 'text-success', link: '/client/shipments' },
      {
        label: t('clientProfile.statInTransit'),
        value: shipments.filter((s) =>
          ['ACCEPTED_AT_SOURCE', 'IN_TRANSIT_TO_ORIGIN_HUB', 'AT_ORIGIN_HUB', 'IN_TRANSIT_TO_DESTINATION_HUB', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERY_ATTEMPT_FAILED', 'RETURN_IN_TRANSIT'].includes(s.currentStatus),
        ).length,
        icon: TrendingUp,
        color: 'text-warning',
        link: '/client/shipments',
      },
      { label: t('clientProfile.statAwaiting'), value: shipments.filter((s) => ['AWAITING_PICKUP', 'AWAITING_LOCKER_PICKUP'].includes(s.currentStatus)).length, icon: Clock, color: 'text-warning', link: '/client/shipments' },
      { label: t('clientProfile.statComplaints'), value: complaints.length, icon: AlertCircle, color: 'text-destructive', link: '/client/claims' },
      { label: t('clientProfile.statOpenComplaints'), value: openComplaints, icon: AlertCircle, color: openComplaints > 0 ? 'text-destructive' : 'text-muted-foreground', link: '/client/claims' },
    ],
    [shipments, complaints, openComplaints, t],
  );

  return (
    <DashboardShell role="client" title={t('clientProfile.title')}>
      <div className="mx-auto max-w-3xl space-y-8">
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
                  <span>{t('clientProfile.role')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg">{t('clientProfile.statsTitle')}</h3>
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
                <div className={`text-3xl ${item.color}`}>{isLoading ? '...' : item.value}</div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg">{t('clientProfile.quickTitle')}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/client/shipments/create"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Plus className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="font-medium">{t('clientProfile.actionCreate')}</div>
                <div className="text-sm text-muted-foreground">{t('clientProfile.actionCreateDesc')}</div>
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
                <div className="font-medium">{t('clientProfile.actionMyShipments')}</div>
                <div className="text-sm text-muted-foreground">{t('clientProfile.actionMyShipmentsDesc')}</div>
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
                <div className="font-medium">{t('clientProfile.actionClaims')}</div>
                <div className="text-sm text-muted-foreground">
                  {openComplaints > 0 ? t('clientProfile.openClaimsCount', { count: openComplaints }) : t('clientProfile.noOpenClaims')}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
