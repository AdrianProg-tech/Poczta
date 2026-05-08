import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CreditCard, Package, RefreshCw, Truck } from 'lucide-react';
import {
  formatDateTime,
  getOpsCourierDispatch,
  getOpsDashboardSummary,
  getOpsRecentEvents,
  type OpsCourierDispatchResponse,
  type OpsDashboardSummary,
  type OpsRecentEvent,
} from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardShell } from '../components/DashboardShell';

function formatCourierLoadLabel(openTasks: number, inProgressTasks: number, failedTasks: number) {
  return `open ${openTasks} / in-progress ${inProgressTasks} / failed ${failedTasks}`;
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<OpsDashboardSummary | null>(null);
  const [dispatch, setDispatch] = useState<OpsCourierDispatchResponse | null>(null);
  const [events, setEvents] = useState<OpsRecentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryData, dispatchData, eventData] = await Promise.all([
        getOpsDashboardSummary(),
        getOpsCourierDispatch(),
        getOpsRecentEvents(),
      ]);
      setSummary(summaryData);
      setDispatch(dispatchData);
      setEvents(eventData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const stats = [
    { label: 'Wszystkie przesylki', value: summary?.totalShipments ?? 0, icon: Package, color: 'text-accent' },
    { label: 'Bledne platnosci', value: summary?.paymentFailedShipments ?? 0, icon: CreditCard, color: 'text-destructive' },
    { label: 'Aktywne taski kurierow', value: summary?.activeCourierTasks ?? 0, icon: Truck, color: 'text-info' },
    { label: 'Reklamacje w review', value: summary?.complaintsInReview ?? 0, icon: AlertCircle, color: 'text-warning' },
  ];

  const focusItems = useMemo(
    () => [
      {
        title: 'Do przygotowania',
        value: summary?.readyForDispatchShipments ?? 0,
        description: 'Oplacone przesylki czekajace na prepare-for-dispatch.',
      },
      {
        title: 'Czekaja na kuriera',
        value: summary?.awaitingCourierAssignmentShipments ?? 0,
        description: 'Shipmenty gotowe do dispatchu, ale bez taska kuriera.',
      },
      {
        title: 'Redirect do punktu',
        value: summary?.redirectedToPickupShipments ?? 0,
        description: 'Przesylki po nieudanej probie doreczenia, jeszcze nie przyjete w punkcie.',
      },
      {
        title: 'Do odbioru',
        value: summary?.awaitingPickupShipments ?? 0,
        description: 'Przesylki czekajace na klienta w pickup flow.',
      },
    ],
    [summary],
  );

  return (
    <DashboardShell role="admin" title="Operations Console">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="mb-2 text-2xl">Panel operacyjny</h2>
          <p className="text-muted-foreground">
            Widok jest oparty o live read-model `/api/ops/*` i pokazuje aktualny stan dispatchu.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Odswiez panel
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div className="text-3xl">{isLoading ? '...' : stat.value}</div>
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {focusItems.map((item) => (
          <div key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="text-sm text-muted-foreground">{item.title}</div>
            <div className="mt-2 text-3xl">{isLoading ? '...' : item.value}</div>
            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h3 className="text-lg">Dispatcher queue</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Shipmenty, ktore mozna przypisac do kuriera bez schodzenia do surowego API.
            </p>
          </div>
          <div className="space-y-4 p-6">
            {dispatch?.shipmentsAwaitingAssignment.length ? (
              dispatch.shipmentsAwaitingAssignment.map((candidate) => (
                <div key={candidate.shipmentId} className="rounded-lg bg-secondary p-4">
                  <div className="mb-1">{candidate.trackingNumber}</div>
                  <div className="text-sm text-muted-foreground">
                    Cel: {candidate.destinationCity ?? 'brak miasta'} | Sugestia: {candidate.suggestedCourierEmail ?? 'brak'}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{candidate.suggestionReason}</div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">Brak shipmentow czekajacych na przypisanie kuriera.</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h3 className="text-lg">Flota kurierska</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Zestawienie obciazenia kurierow po aktualnym seedzie i zywych operacjach.
            </p>
          </div>
          <div className="space-y-4 p-6">
            {dispatch?.couriers.map((courier) => (
              <div key={courier.courierId} className="flex items-center justify-between rounded-lg bg-secondary p-4">
                <div>
                  <div>{courier.displayName}</div>
                  <div className="text-sm text-muted-foreground">
                    {courier.courierEmail} | {courier.inferredServiceCity ?? 'brak miasta'}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>{formatCourierLoadLabel(courier.openTaskCount, courier.inProgressTaskCount, courier.failedTaskCount)}</div>
                  <div>{courier.availableForAutoAssignment ? 'auto-assign: tak' : 'auto-assign: nie'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-6">
          <h3 className="text-lg">Ostatnie zdarzenia</h3>
        </div>
        <div className="divide-y divide-border">
          {events.map((event, index) => (
            <div
              key={`${event.trackingNumber}-${event.eventTime}-${index}`}
              className="flex flex-col gap-3 p-6 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <div className="mb-1 flex items-center gap-3">
                  <div>{event.trackingNumber}</div>
                  <StatusBadge status={event.status} />
                </div>
                <div className="text-sm text-muted-foreground">{event.description}</div>
                <div className="text-sm text-muted-foreground">{event.locationName}</div>
              </div>
              <div className="text-sm text-muted-foreground">{formatDateTime(event.eventTime)}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
