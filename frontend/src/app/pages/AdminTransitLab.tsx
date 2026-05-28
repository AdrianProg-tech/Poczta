import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, ArrowLeft, CirclePlay, PackagePlus, RefreshCw, Truck, Warehouse } from 'lucide-react';
import {
  buildScenarioPayload,
  getLaneCount,
  getTransitDemoParcels,
  scenarioTemplates,
  transitionMeta,
  transitStoryMeta,
} from '../adminDemoFlows';
import { addAdminTrackingEvent, createAdminParcel, formatDateTime, getAdminParcels, type AdminParcelRecord } from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';
import { useTranslation } from 'react-i18next';

const transitScenarios = scenarioTemplates.filter(
  (scenario) =>
    scenario.id === 'courier-ready' ||
    scenario.id === 'linehaul-transit' ||
    scenario.id === 'delivery-attempt' ||
    scenario.id === 'return-flow',
);

const transitActionMap = {
  READY_FOR_POSTING: ['POSTED'],
  POSTED: ['IN_TRANSIT'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'RETURNED'],
  OUT_FOR_DELIVERY: ['DELIVERY_ATTEMPT', 'DELIVERED', 'REDIRECTED_TO_PICKUP', 'RETURNED'],
  DELIVERY_ATTEMPT: ['OUT_FOR_DELIVERY', 'REDIRECTED_TO_PICKUP', 'RETURNED'],
} as const;

export default function AdminTransitLab() {
  const { t } = useTranslation();
  const [parcels, setParcels] = useState<AdminParcelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadParcels = useCallback(async () => {
    setIsLoading(true);
    try {
      setParcels(await getAdminParcels());
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie pobrac transit demo set.');
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
      setError(requestError instanceof Error ? requestError.message : 'Operacja transit demo nie powiodla sie.');
    } finally {
      setBusyKey(null);
    }
  }

  const transitParcels = useMemo(() => getTransitDemoParcels(parcels).slice(0, 16), [parcels]);
  const laneCards = useMemo(
    () => [
      {
        lane: 'WAREHOUSE' as const,
        title: 'Magazyn',
        icon: Warehouse,
        value: getLaneCount(transitParcels, transitStoryMeta, 'WAREHOUSE'),
        description: 'Przyjecie, sortowanie, dok wyjazdowy i gotowosc magazynu.',
      },
      {
        lane: 'LINEHAUL' as const,
        title: 'Tranzyt miedzy hubami',
        icon: Truck,
        value: getLaneCount(transitParcels, transitStoryMeta, 'LINEHAUL'),
        description: 'Ruch miedzy hubami, w ktorym przesylki nie powinny znikac bez widocznego powodu.',
      },
      {
        lane: 'EXCEPTION' as const,
        title: 'Wyjatki',
        icon: AlertTriangle,
        value: getLaneCount(transitParcels, transitStoryMeta, 'EXCEPTION'),
        description: 'Nieudane proby, zwroty i scenariusze reverse-logistics do demonstracji.',
      },
    ],
    [transitParcels],
  );

  return (
    <DashboardShell role="admin" title="Laboratorium tranzytu">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3">
            <Link to="/admin/demo-lab" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Wroc do demo operations lab
            </Link>
          </div>
          <h2 className="mb-2 text-2xl">Symulacja magazynu i tranzytu</h2>
          <p className="text-muted-foreground">
            Ukryta strona operacyjna do pokazywania magazynu, tranzytu miedzy hubami i final-mile bez wystawiania tych
            kontroli w publicznej aplikacji.
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
          <h3 className="text-lg">Historia tranzytu</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Uzyj tej strony do pokazania kolejnych etapow: przygotowanie w magazynie, wyjazd, tranzyt miedzy hubami i
          przekazanie do final-mile.
        </p>
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
          const actions = transitActionMap[parcel.status as keyof typeof transitActionMap] ?? [];
          const story = transitStoryMeta[parcel.status];

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
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    {parcel.deliveryType}
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
                      <div className="text-sm text-muted-foreground">Aktualny etap logistyczny</div>
                      <div className="mt-1 text-lg">{story.title}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Odpowiada: {story.owner} {'->'} Nastepny etap: {story.nextOwner}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{story.summary}</div>
                  <div className="mt-2 rounded-lg bg-card px-3 py-2 text-sm text-muted-foreground">
                    Punkt kontrolny: {story.checkpoint}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                {actions.length ? (
                  actions.map((status) => {
                    const meta = transitionMeta[status];
                    const key = `transit-${parcel.id}-${status}`;
                    return (
                      <div key={status} className="rounded-lg bg-secondary p-4">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <div>{meta.label}</div>
                          <StatusBadge status={status} />
                        </div>
                        <p className="mb-3 text-sm text-muted-foreground">{meta.description}</p>
                        <button
                          type="button"
                          disabled={busyKey === key}
                          onClick={() =>
                            void runAction(key, () =>
                              addAdminTrackingEvent({
                                shipmentId: parcel.id,
                                status,
                                locationName: meta.locationName,
                                description: meta.description,
                              }),
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                        >
                          <CirclePlay className="h-4 w-4" />
                          Zastosuj przejscie
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
                    Ten parcel jest juz poza transit story albo wymaga innego technicznego narzedzia.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
