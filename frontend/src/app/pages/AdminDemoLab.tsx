import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Boxes, CirclePlay, PackagePlus, RefreshCw, Route } from 'lucide-react';
import { buildScenarioPayload, scenarioTemplates, sortParcelsByCreatedAt, technicalTransitions, transitionMeta } from '../adminDemoFlows';
import {
  addAdminTrackingEvent,
  createAdminParcel,
  formatDateTime,
  getAdminParcels,
  getPublicTracking,
  type AdminParcelRecord,
  type CreateAdminParcelPayload,
  type PublicTrackingResponse,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';

export default function AdminDemoLab() {
  const [parcels, setParcels] = useState<AdminParcelRecord[]>([]);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [tracking, setTracking] = useState<PublicTrackingResponse | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadParcels = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminParcels();
      const sorted = sortParcelsByCreatedAt(data);
      setParcels(sorted);
      setSelectedParcelId((current) => current ?? sorted[0]?.id ?? null);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie pobrac demo parcels.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadParcels();
  }, [loadParcels]);

  const selectedParcel = useMemo(
    () => parcels.find((parcel) => parcel.id === selectedParcelId) ?? null,
    [parcels, selectedParcelId],
  );

  const loadTracking = useCallback(async () => {
    if (!selectedParcel?.trackingNumber) {
      setTracking(null);
      return;
    }

    try {
      setTracking(await getPublicTracking(selectedParcel.trackingNumber));
    } catch {
      setTracking(null);
    }
  }, [selectedParcel?.trackingNumber]);

  useEffect(() => {
    void loadTracking();
  }, [loadTracking]);

  async function runAction(key: string, action: () => Promise<unknown>) {
    setBusyKey(key);
    setError(null);
    try {
      await action();
      await loadParcels();
      await loadTracking();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Operacja demo nie powiodla sie.');
    } finally {
      setBusyKey(null);
    }
  }

  const filteredParcels = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return parcels;
    }

    return parcels.filter((parcel) =>
      [parcel.trackingNumber, parcel.status, parcel.deliveryType, parcel.recipientName, parcel.senderName]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [parcels, search]);

  const availableTransitions = useMemo(() => {
    if (!selectedParcel?.status) {
      return [];
    }
    return technicalTransitions[selectedParcel.status] ?? [];
  }, [selectedParcel?.status]);

  return (
    <DashboardShell role="admin" title="Demo Operations Lab">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3">
            <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Wroc do operations console
            </Link>
          </div>
          <h2 className="mb-2 text-2xl">Hidden demo operations lab</h2>
          <p className="text-muted-foreground">
            Techniczny ekran admin/ops do tworzenia i przesuwania demo parcels po realnym workflow backendu.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadParcels()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Odswiez demo lab
        </button>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}

      <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <PackagePlus className="h-5 w-5 text-accent" />
          <h3 className="text-lg">Quick-create technical scenarios</h3>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {scenarioTemplates.map((scenario) => {
            const key = `create-${scenario.id}`;
            return (
              <div key={scenario.id} className="rounded-xl border border-border bg-secondary p-4">
                <div className="mb-2 text-base">{scenario.label}</div>
                <p className="mb-4 text-sm text-muted-foreground">{scenario.description}</p>
                <button
                  type="button"
                  disabled={busyKey === key}
                  onClick={() =>
                    void runAction(key, async () => {
                      const created = await createAdminParcel(buildScenarioPayload(scenario.payload));
                      setSelectedParcelId(created.id);
                      setSearch(created.trackingNumber);
                    })
                  }
                  className="rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
                >
                  Utworz scenariusz
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr),minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <label className="mb-2 block text-sm text-muted-foreground">Szukaj po trackingu, statusie lub typie dostawy</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="DM..., AWAITING_PICKUP, COURIER, recipient"
              className="w-full rounded-lg border border-border bg-input-background px-4 py-3 outline-none transition-colors focus:border-accent"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-6">
              <h3 className="text-lg">Technical parcel set</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Niskopoziomowe demo parcels do seedowania timeline, depot i locker stories.
              </p>
            </div>

            {isLoading ? <div className="p-6">Ladowanie parcels...</div> : null}

            {!isLoading ? (
              <div className="divide-y divide-border">
                {filteredParcels.slice(0, 20).map((parcel) => (
                  <button
                    key={parcel.id}
                    type="button"
                    onClick={() => setSelectedParcelId(parcel.id)}
                    className={`flex w-full flex-col gap-3 p-6 text-left transition-colors hover:bg-muted/40 ${
                      selectedParcelId === parcel.id ? 'bg-accent/5' : ''
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="mb-1">{parcel.trackingNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {parcel.deliveryType} | {parcel.recipientName} | {formatDateTime(parcel.createdAt)}
                        </div>
                      </div>
                      <StatusBadge status={parcel.status} />
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Boxes className="h-5 w-5 text-accent" />
              <h3 className="text-lg">Selected parcel</h3>
            </div>

            {selectedParcel ? (
              <div className="space-y-4">
                <div>
                  <div className="text-2xl">{selectedParcel.trackingNumber}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={selectedParcel.status} />
                    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                      {selectedParcel.deliveryType}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 text-sm">
                  <div>
                    <div className="mb-1 text-muted-foreground">Sender</div>
                    <div>{selectedParcel.senderName}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-muted-foreground">Recipient</div>
                    <div>{selectedParcel.recipientName}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-muted-foreground">Created</div>
                    <div>{formatDateTime(selectedParcel.createdAt)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">Wybierz technical parcel z listy.</div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Route className="h-5 w-5 text-accent" />
              <h3 className="text-lg">Workflow transitions</h3>
            </div>

            {selectedParcel ? (
              availableTransitions.length ? (
                <div className="space-y-3">
                  {availableTransitions.map((status) => {
                    const meta = transitionMeta[status];
                    const key = `transition-${selectedParcel.id}-${status}`;

                    return (
                      <div key={status} className="rounded-lg border border-border p-4">
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
                                shipmentId: selectedParcel.id,
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
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Dla tego statusu nie ma juz nastepnych przejsc w technical workflow.</div>
              )
            ) : (
              <div className="text-sm text-muted-foreground">Najpierw wybierz parcel do symulacji.</div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg">Live public tracking preview</h3>
            {tracking ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {tracking.trackingNumber} | {tracking.destinationSummary}
                </div>
                <StatusBadge status={tracking.currentStatus} />
                <div className="space-y-4">
                  {tracking.history.slice(0, 6).map((item, index) => (
                    <div key={`${item.eventTime}-${item.status}-${index}`} className="rounded-lg bg-secondary p-4">
                      <div className="mb-1 flex items-center gap-2">
                        <StatusBadge status={item.status} />
                        <span className="text-sm text-muted-foreground">{formatDateTime(item.eventTime)}</span>
                      </div>
                      <div>{item.description}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{item.locationName}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Tracking preview pojawi sie po wybraniu parcel i odswiezeniu historii.</div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
