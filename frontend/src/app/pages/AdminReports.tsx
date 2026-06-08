import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import {
  formatCurrency,
  formatComplaintStatus,
  formatComplaintType,
  formatPaymentMethod,
  formatPaymentStatus,
  getAdminComplaints,
  getAdminPayments,
  getOpsDashboardSummary,
  getOpsShipmentBoard,
  getPublicPoints,
  type AdminComplaintSummary,
  type AdminPaymentSummary,
  type OpsDashboardSummary,
  type OpsShipmentBoardItem,
  type PublicPoint,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';
import { useTranslation } from 'react-i18next';

export function pct(value: number, total: number) {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

export function countBy<T>(items: T[], key: (item: T) => string): Array<{ label: string; count: number }> {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function sumBy<T>(items: T[], key: (item: T) => number): number {
  return items.reduce((acc, item) => acc + key(item), 0);
}


function downloadReportCsv(rows: string[][], filename: string) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const { t } = useTranslation();
  const {
    state: { currentUser },
  } = useAppStateContext();

  const [summary, setSummary] = useState<OpsDashboardSummary | null>(null);
  const [shipments, setShipments] = useState<OpsShipmentBoardItem[]>([]);
  const [payments, setPayments] = useState<AdminPaymentSummary[]>([]);
  const [complaints, setComplaints] = useState<AdminComplaintSummary[]>([]);
  const [points, setPoints] = useState<PublicPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const loadReports = useCallback(async () => {
    if (!currentUser?.email) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [summaryData, shipmentData, paymentData, complaintData, pointData] = await Promise.all([
        getOpsDashboardSummary(currentUser.email),
        getOpsShipmentBoard(currentUser.email),
        getAdminPayments(currentUser.email),
        getAdminComplaints(currentUser.email),
        getPublicPoints(),
      ]);
      setSummary(summaryData);
      setShipments(shipmentData);
      setPayments(paymentData);
      setComplaints(complaintData);
      setPoints(pointData);
      setGeneratedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('adminReports.errorLoad'));
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  // Shipment status breakdown
  const shipmentsByStatus = useMemo(() => countBy(shipments, (s) => s.shipmentStatus), [shipments]);
  const shipmentsByDeliveryType = useMemo(
    () => countBy(shipments.filter((s) => s.deliveryType), (s) => s.deliveryType!),
    [shipments],
  );

  // Payment breakdowns
  const paymentsByStatus = useMemo(() => countBy(payments, (p) => p.status), [payments]);
  const paymentsByMethod = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const p of payments) {
      const existing = map.get(p.method) ?? { count: 0, total: 0 };
      map.set(p.method, { count: existing.count + 1, total: existing.total + p.amount });
    }
    return Array.from(map.entries())
      .map(([method, data]) => ({ method, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [payments]);
  const totalRevenue = useMemo(() => sumBy(payments.filter((p) => p.status === 'PAID'), (p) => p.amount), [payments]);
  const pendingRevenue = useMemo(
    () => sumBy(payments.filter((p) => p.status === 'PENDING' || p.status === 'OFFLINE_PENDING'), (p) => p.amount),
    [payments],
  );

  // Complaint breakdowns
  const complaintsByStatus = useMemo(() => countBy(complaints, (c) => c.status), [complaints]);
  const complaintsByType = useMemo(() => countBy(complaints, (c) => c.type), [complaints]);

  // Point type breakdown
  const pointsByType = useMemo(() => countBy(points, (pt) => pt.type), [points]);

  const kpiCards = useMemo(
    () => [
      { label: t('adminReports.kpiAllShipments'), value: summary?.totalShipments ?? shipments.length, accent: false },
      { label: t('adminReports.kpiPendingPayment'), value: summary?.pendingPaymentShipments ?? 0, accent: false },
      { label: t('adminReports.kpiFailedPayments'), value: summary?.paymentFailedShipments ?? 0, accent: true },
      { label: t('adminReports.kpiReadyForDispatch'), value: summary?.readyForDispatchShipments ?? 0, accent: false },
      { label: t('adminReports.kpiAwaitingCourier'), value: summary?.awaitingCourierAssignmentShipments ?? 0, accent: false },
      { label: t('adminReports.kpiRedirected'), value: summary?.redirectedToPickupShipments ?? 0, accent: false },
      { label: t('adminReports.kpiAwaitingPickup'), value: summary?.awaitingPickupShipments ?? 0, accent: false },
      { label: t('adminReports.kpiActiveCourierTasks'), value: summary?.activeCourierTasks ?? 0, accent: false },
      { label: t('adminReports.kpiComplaintsInReview'), value: summary?.complaintsInReview ?? 0, accent: true },
      { label: t('adminReports.kpiTotalRevenue'), value: formatCurrency(totalRevenue), accent: false },
      { label: t('adminReports.kpiPendingRevenue'), value: formatCurrency(pendingRevenue), accent: false },
      { label: t('adminReports.kpiPickupPoints'), value: points.length, accent: false },
    ],
    [summary, shipments.length, totalRevenue, pendingRevenue, points.length, t],
  );

  function exportPaymentsCsv() {
    const rows = [
      [t('adminReports.csvPaymentsTracking'), t('adminReports.csvPaymentsMethod'), t('adminReports.csvPaymentsStatus'), t('adminReports.csvPaymentsAmount'), t('adminReports.csvPaymentsClient'), t('adminReports.csvPaymentsDate')],
      ...payments.map((p) => [
        p.trackingNumber,
        formatPaymentMethod(p.method),
        formatPaymentStatus(p.status),
        String(p.amount.toFixed(2)),
        p.clientEmail ?? '',
        p.createdAt,
      ]),
    ];
    downloadReportCsv(rows, `platnosci-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportComplaintsCsv() {
    const rows = [
      [t('adminReports.csvComplaintsNr'), t('adminReports.csvComplaintsTracking'), t('adminReports.csvComplaintsType'), t('adminReports.csvComplaintsStatus'), t('adminReports.csvComplaintsClient'), t('adminReports.csvComplaintsDate')],
      ...complaints.map((c) => [
        c.complaintNumber,
        c.trackingNumber,
        formatComplaintType(c.type),
        formatComplaintStatus(c.status),
        c.clientEmail ?? '',
        c.submittedAt,
      ]),
    ];
    downloadReportCsv(rows, `reklamacje-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportShipmentsCsv() {
    const rows = [
      [t('adminReports.csvShipmentsTracking'), t('adminReports.csvShipmentsStatus'), t('adminReports.csvShipmentsDeliveryType'), t('adminReports.csvShipmentsSourceCity'), t('adminReports.csvShipmentsDestCity'), t('adminReports.csvShipmentsTargetPoint'), t('adminReports.csvShipmentsCourier')],
      ...shipments.map((s) => [
        s.trackingNumber,
        s.shipmentStatus,
        s.deliveryType ?? '',
        s.sourceCity ?? '',
        s.destinationCity ?? '',
        s.targetPointCode ?? '',
        s.assignedCourierEmail ?? '',
      ]),
    ];
    downloadReportCsv(rows, `przesylki-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <DashboardShell role="admin" title={t('adminReports.pageTitle')}>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="mb-2 text-2xl">{t('adminReports.heading')}</h2>
          <p className="text-muted-foreground">
            {t('adminReports.desc')}
            {generatedAt ? (
              <span className="ml-2 text-xs">
                {t('adminReports.generatedAt')}: {generatedAt.toLocaleTimeString()}
              </span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadReports()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}
      {isLoading ? <div className="rounded-xl border border-border bg-card p-6 shadow-sm">{t('adminReports.loading')}</div> : null}

      {!isLoading ? (
        <div className="space-y-8">

          {/* KPI Cards */}
          <section>
            <h3 className="mb-4 text-lg">{t('adminReports.kpiTitle')}</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {kpiCards.map((card) => (
                <div
                  key={card.label}
                  className={`rounded-xl border p-5 shadow-sm ${
                    card.accent ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'
                  }`}
                >
                  <div className="mb-2 text-sm text-muted-foreground">{card.label}</div>
                  <div className={`text-3xl ${card.accent ? 'text-destructive' : ''}`}>{card.value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Shipment Status Distribution */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg">{t('adminReports.shipmentsSection')}</h3>
              <button
                type="button"
                onClick={exportShipmentsCsv}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                {t('adminReports.exportCsv')}
              </button>
            </div>
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colStatus')}</th>
                    <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colCount')}</th>
                    <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colShare')}</th>
                    <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colChart')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shipmentsByStatus.map(({ label, count }) => (
                    <tr key={label} className="hover:bg-muted/40">
                      <td className="px-6 py-3">
                        <StatusBadge status={label} />
                      </td>
                      <td className="px-6 py-3 text-right font-mono">{count}</td>
                      <td className="px-6 py-3 text-right text-muted-foreground">{pct(count, shipments.length)}</td>
                      <td className="px-6 py-3 w-48">
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-accent"
                            style={{ width: pct(count, shipments.length) }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-border bg-muted/30">
                  <tr>
                    <td className="px-6 py-3 font-medium">{t('adminReports.total')}</td>
                    <td className="px-6 py-3 text-right font-mono font-medium">{shipments.length}</td>
                    <td className="px-6 py-3 text-right">100%</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
              {shipmentsByDeliveryType.length > 0 ? (
                <div className="border-t border-border p-6">
                  <div className="mb-3 text-sm font-medium text-muted-foreground">{t('adminReports.byDeliveryType')}</div>
                  <div className="flex flex-wrap gap-3">
                    {shipmentsByDeliveryType.map(({ label, count }) => (
                      <div key={label} className="rounded-lg bg-secondary px-4 py-2 text-sm">
                        <span className="font-medium">{label}</span>
                        <span className="ml-2 text-muted-foreground">{count} ({pct(count, shipments.length)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* Payment Report */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg">{t('adminReports.paymentsSection')}</h3>
              <button
                type="button"
                onClick={exportPaymentsCsv}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                {t('adminReports.exportCsv')}
              </button>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border px-6 py-4">
                  <div className="font-medium">{t('adminReports.byPaymentMethod')}</div>
                </div>
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colMethod')}</th>
                      <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colQty')}</th>
                      <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colAmount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paymentsByMethod.map(({ method, count, total }) => (
                      <tr key={method} className="hover:bg-muted/40">
                        <td className="px-6 py-3 text-sm">{formatPaymentMethod(method)}</td>
                        <td className="px-6 py-3 text-right font-mono text-sm">{count}</td>
                        <td className="px-6 py-3 text-right font-mono text-sm">{formatCurrency(total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-border bg-muted/30">
                    <tr>
                      <td className="px-6 py-3 text-sm font-medium">{t('adminReports.total')}</td>
                      <td className="px-6 py-3 text-right font-mono text-sm font-medium">{payments.length}</td>
                      <td className="px-6 py-3 text-right font-mono text-sm font-medium">
                        {formatCurrency(sumBy(payments, (p) => p.amount))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border px-6 py-4">
                  <div className="font-medium">{t('adminReports.byPaymentStatus')}</div>
                </div>
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colStatus')}</th>
                      <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colQty')}</th>
                      <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colShare')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paymentsByStatus.map(({ label, count }) => (
                      <tr key={label} className="hover:bg-muted/40">
                        <td className="px-6 py-3">
                          <StatusBadge status={label} type="payment" />
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-sm">{count}</td>
                        <td className="px-6 py-3 text-right text-sm text-muted-foreground">{pct(count, payments.length)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-border bg-success/5 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('adminReports.bookedRevenue')}</span>
                    <span className="font-mono font-medium text-success">{formatCurrency(totalRevenue)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('adminReports.pendingRevenue')}</span>
                    <span className="font-mono text-warning">{formatCurrency(pendingRevenue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Complaints Report */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg">{t('adminReports.complaintsSection')}</h3>
              <button
                type="button"
                onClick={exportComplaintsCsv}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                {t('adminReports.exportCsv')}
              </button>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border px-6 py-4 font-medium">{t('adminReports.byStatus')}</div>
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colStatus')}</th>
                      <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colQty')}</th>
                      <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colShare')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {complaintsByStatus.map(({ label, count }) => (
                      <tr key={label} className="hover:bg-muted/40">
                        <td className="px-6 py-3">
                          <StatusBadge status={label} type="complaint" />
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-sm">{count}</td>
                        <td className="px-6 py-3 text-right text-sm text-muted-foreground">{pct(count, complaints.length)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-border bg-muted/30">
                    <tr>
                      <td className="px-6 py-3 text-sm font-medium">{t('adminReports.total')}</td>
                      <td className="px-6 py-3 text-right font-mono text-sm font-medium">{complaints.length}</td>
                      <td className="px-6 py-3 text-right text-sm">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border px-6 py-4 font-medium">{t('adminReports.byType')}</div>
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colType')}</th>
                      <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colQty')}</th>
                      <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colShare')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {complaintsByType.map(({ label, count }) => (
                      <tr key={label} className="hover:bg-muted/40">
                        <td className="px-6 py-3 text-sm">{formatComplaintType(label)}</td>
                        <td className="px-6 py-3 text-right font-mono text-sm">{count}</td>
                        <td className="px-6 py-3 text-right text-sm text-muted-foreground">{pct(count, complaints.length)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Points Overview */}
          {points.length > 0 ? (
            <section>
              <h3 className="mb-4 text-lg">{t('adminReports.pointsSection')}</h3>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="border-b border-border px-6 py-4 font-medium">{t('adminReports.byType')}</div>
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colType')}</th>
                        <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">{t('adminReports.colQty')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pointsByType.map(({ label, count }) => (
                        <tr key={label} className="hover:bg-muted/40">
                          <td className="px-6 py-3 text-sm">{label}</td>
                          <td className="px-6 py-3 text-right font-mono text-sm">{count}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-border bg-muted/30">
                      <tr>
                        <td className="px-6 py-3 text-sm font-medium">{t('adminReports.total')}</td>
                        <td className="px-6 py-3 text-right font-mono text-sm font-medium">{points.length}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-3 font-medium">{t('adminReports.geoCoverage')}</div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(points.map((p) => p.city))).sort().map((city) => (
                      <div key={city} className="rounded-lg bg-secondary px-3 py-1.5 text-sm">
                        {city} ({points.filter((p) => p.city === city).length})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

        </div>
      ) : null}
    </DashboardShell>
  );
}
