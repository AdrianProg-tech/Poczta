import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function AdminReports() {
  const {
    state: { claims, points, shipments, users },
  } = useAppStateContext();

  const delivered = shipments.filter((shipment) => shipment.status === 'Doręczona').length;
  const active = shipments.filter((shipment) => shipment.status !== 'Doręczona').length;

  const cards = [
    { label: 'Użytkownicy', value: users.length },
    { label: 'Aktywne przesyłki', value: active },
    { label: 'Doręczone przesyłki', value: delivered },
    { label: 'Punkty odbioru', value: points.length },
    { label: 'Reklamacje', value: claims.length },
  ];

  return (
    <DashboardShell role="admin" title="Raporty">
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="text-sm text-muted-foreground mb-3">{card.label}</div>
            <div className="text-4xl">{card.value}</div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
