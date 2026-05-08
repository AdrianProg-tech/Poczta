import { useCallback, useEffect, useState } from 'react';
import { getAdminComplaints, getAdminPayments, getOpsDashboardSummary, getPublicPoints } from '../api';
import { DashboardShell } from '../components/DashboardShell';

export default function AdminReports() {
  const [cards, setCards] = useState<Array<{ label: string; value: number }>>([]);

  const loadReports = useCallback(async () => {
    const [summary, points, payments, complaints] = await Promise.all([
      getOpsDashboardSummary(),
      getPublicPoints(),
      getAdminPayments(),
      getAdminComplaints(),
    ]);

    setCards([
      { label: 'Wszystkie przesyłki', value: summary.totalShipments },
      { label: 'Błędne płatności', value: summary.paymentFailedShipments },
      { label: 'Aktywne taski kurierów', value: summary.activeCourierTasks },
      { label: 'Punkty odbioru', value: points.length },
      { label: 'Płatności', value: payments.length },
      { label: 'Reklamacje', value: complaints.length },
    ]);
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  return (
    <DashboardShell role="admin" title="Raporty">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-3 text-sm text-muted-foreground">{card.label}</div>
            <div className="text-4xl">{card.value}</div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
