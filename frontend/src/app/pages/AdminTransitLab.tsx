import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, ArrowLeft, CirclePlay, MapPin, PackagePlus, RefreshCw, Truck, Warehouse } from 'lucide-react';
import {
  buildScenarioPayload,
  getLaneCount,
  getTransitDemoParcels,
  scenarioTemplates,
  transitionMeta,
  transitStoryMeta,
} from '../adminDemoFlows';
import {
  addAdminTrackingEvent,
  advanceShipmentToInTransit,
  createAdminParcel,
  formatDateTime,
  getAdminParcels,
  routeShipmentToPickup,
  type AdminParcelRecord,
  type CreateAdminParcelPayload,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStateContext } from '../state/AppStateContext';
import { useTranslation } from 'react-i18next';

const transitScenarios = scenarioTemplates.filter(
  (scenario) =>
    scenario.id === 'courier-ready' ||
    scenario.id === 'linehaul-transit' ||
    scenario.id === 'delivery-attempt' ||
    scenario.id === 'return-flow',
);

const transitActionMap: Record<string, string[]> = {
  READY_FOR_POSTING: ['POSTED'],
  POSTED: ['IN_TRANSIT'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'AWAITING_PICKUP', 'RETURNED'],
  OUT_FOR_DELIVERY: ['DELIVERY_ATTEMPT', 'DELIVERED', 'REDIRECTED_TO_PICKUP', 'RETURNED'],
  DELIVERY_ATTEMPT: ['OUT_FOR_DELIVERY', 'REDIRECTED_TO_PICKUP', 'RETURNED'],
};

const PICKUP_POINT_ONLY_ACTIONS = new Set(['AWAITING_PICKUP']);
const COURIER_ONLY_ACTIONS = new Set(['OUT_FOR_DELIVERY']);

const routeToPickupMeta = {
  label: 'Skieruj do punktu odbioru',
  description: 'Posortuj i wyślij do docelowego punktu/paczkomatu. Przesyłka pojawi się w kolejce punktu.',
};

const advanceInTransitMeta = {
  label: 'Przyjmij na hub sortowania',
  description: 'Potwierdź przybycie do centrum sortowania i rozpocznij tranzyt.',
};

export default function AdminTransitLab() {
  const { t } = useTranslation();
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [parcels, setParcels] = useState<AdminParcelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userEmail = currentUser?.email ?? '';

  const loadParcels = useCallback(async () => {
    setIsLoading(true);
    try {
      setParcels(await getAdminParcels());
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie pobrac danych.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadParcels();
  }, [loadParcels]);

  async function runAction(key: string, action: () => Promise<unknown>) {
    setBusyKey(key);
    setError(null);
    try {
      await action();
      await loadParcels();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Operacja nie powiodla sie.');
    } finally {
      setBusyKey(null);
    }
  }

  function getActionsForParcel(parcel: AdminParcelRecord): string[] {
    const allActions = transitActionMap[parcel.status] ?? [];
    return allActions.filter((action) => {
      if (PICKUP_POINT_ONLY_ACTIONS.has(action)) {
        return parcel.deliveryType === 'PICKUP_POINT';
      }
      if (COURIER_ONLY_ACTIONS.has(action)) {
        return parcel.deliveryType === 'COURIER';
      }
      return true;
    });
  }

  function getActionHandler(parcel: AdminParcelRecord, targetStatus: string): () => Promise<unknown> {
    if (targetStatus === 'AWAITING_PICKUP') {
      return () => routeShipmentToPickup(userEmail, parcel.id);
    }
    if (targetStatus === 'IN_TRANSIT') {
      return () => advanceShipmentToInTransit(userEmail, parcel.id);
    }
    const statusKey = targetStatus as CreateAdminParcelPayload['status'];
    const meta = transitionMeta[statusKey];
    return () =>
      addAdminTrackingEvent({
        shipmentId: parcel.id,
        status: statusKey,
        locationName: meta?.locationName ?? targetStatus,
        description: meta?.description ?? `Status changed to ${targetStatus}`,
      });
  }

  function getActionMeta(targetStatus: string) {
    if (targetStatus === 'AWAITING_PICKUP') return routeToPickupMeta;
    if (targetStatus === 'IN_TRANSIT') return advanceInTransitMeta;
    return transitionMeta[targetStatus as CreateAdminParcelPayload['status']] ?? {
      label: targetStatus,
      description: '',
      locationName: targetStatus,
    };
  }

  const transitParcels = useMemo(() => getTransitDemoParcels(parcels).slice(0, 20), [parcels]);
  const laneCards = useMemo(
    () => [
      {
        lane: 'WAREHOUSE' as const,
        title: 'Magazyn / Sortownia',
        icon: Warehouse,
        value: getLaneCount(transitParcels, transitStoryMeta, 'WAREHOUSE'),
        description: 'Przyjecie, sortowanie, dok wyjazdowy.',
      },
      {
        lane: 'LINEHAUL' as const,
        title: 'Tranzyt miedzy hubami',
        icon: Truck,
        value: getLaneCount(transitParcels, transitStoryMeta, 'LINEHAUL'),
        description: 'Transport miedzy depotami i miastami.',
      },
      {
        lane: 'EXCEPTION' as const,
        title: 'Wyjatki',
        icon: AlertTriangle,
        value: getLaneCount(transitParcels, transitStoryMeta, 'EXCEPTION'),
        description: 'Nieudane proby, zwroty.',
      },
    ],
    [transitParcels],
  );

  return (
    <DashboardShell role="admin" title="Centrum sortowania">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3">
            <Link to="/admin/demo-lab" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Wroc do demo operations lab
            </Link>
          </div>
          <h2 className="mb-2 text-2xl">Centrum sortowania / Transit Hub</h2>
          <p className="text-muted-foreground">
            Symuluj sortownie i tranzyt. Przesylki COURIER trafiaja do kuriera, przesylki PICKUP_POINT trafiaja do punktu odbioru.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadParcels()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}

      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        {transitScenarios.map((scenario) => {
          const key = `create-${scenario.id}`;
          return (
            <div key={scenario.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-2 flex items-center gap-3">
                <PackagePlus className="h-5 w-5 text-accent" />
                <h3 className="text-lg">{scenario.label}</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{scenario.description}</p>
              <button
                type="button"
                disabled={busyKey === key}
                onClick={() => void runAction(key, () => createAdminParcel(buildScenarioPayload(scenario.payload)))}
                className="rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
              >
                Dodaj scenariusz tranzytu
              </button>
            </div>
          );
        })}
      </div>

      <div className="mb-6 rounded-xl border border-dashed border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Warehouse className="h-5 w-5 text-accent" />
          <h3 className="text-lg">Przeglad tras</h3>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {laneCards.map((card) => (
            <div key={card.lane} className="rounded-lg bg-secondary p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-muted-foreground">{card.title}</div>
                  <div className="mt-2 text-2xl">{card.value}</div>
                </div>
                <card.icon className="h-5 w-5 text-accent" />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{card.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {transitParcels.map((parcel) => {
          const actions = getActionsForParcel(parcel);
          const story = transitStoryMeta[parcel.status];
          const isPickupPoint = parcel.deliveryType === 'PICKUP_POINT';

          return (
            <div key={parcel.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xl">{parcel.trackingNumber}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {parcel.recipientName} | {formatDateTime(parcel.createdAt)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={parcel.status} />
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      isPickupPoint
                        ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {isPickupPoint ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        PICKUP POINT
                      </span>
                    ) : (
                      parcel.deliveryType
                    )}
                  </span>
                  {story ? (
                    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                      {story.lane}
                    </span>
                  ) : null}
                </div>
              </div>

              {story ? (
                <div className="mb-4 rounded-lg bg-secondary p-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Aktualny etap</div>
                      <div className="mt-1 text-lg">{story.title}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {story.owner} {'->'} {story.nextOwner}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{story.summary}</div>
                </div>
              ) : null}

              <div className="space-y-3">
                {actions.length ? (
                  actions.map((targetStatus) => {
                    const meta = getActionMeta(targetStatus);
                    const key = `transit-${parcel.id}-${targetStatus}`;
                    return (
                      <div key={targetStatus} className="rounded-lg bg-secondary p-4">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <div>{meta.label}</div>
                          <StatusBadge status={targetStatus} />
                        </div>
                        <p className="mb-3 text-sm text-muted-foreground">{meta.description}</p>
                        <button
                          type="button"
                          disabled={busyKey === key}
                          onClick={() => void runAction(key, getActionHandler(parcel, targetStatus))}
                          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                        >
                          <CirclePlay className="h-4 w-4" />
                          Zastosuj
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
                    Ten parcel jest poza flow tranzytu lub wymaga innego narzedzia.
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {!isLoading && transitParcels.length === 0 ? (
          <div className="col-span-2 rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            <Warehouse className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p>Brak przesylek w sortowni. Dodaj scenariusz powyzej lub wyslij przesylke z punktu.</p>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
