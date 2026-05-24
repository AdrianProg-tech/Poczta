import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, LockKeyhole, PackagePlus, RefreshCw } from 'lucide-react';
import {
  addAdminTrackingEvent,
  createAdminParcel,
  formatDateTime,
  getAdminParcels,
  type AdminParcelRecord,
  type CreateAdminParcelPayload,
} from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { StatusBadge } from '../components/StatusBadge';

const lockerScenarios: Array<{
  id: string;
  label: string;
  description: string;
  payload: Omit<CreateAdminParcelPayload, 'trackingNumber'>;
}> = [
  {
    id: 'locker-put',
    label: 'Przesylka trafia do skrytki',
    description: 'Start od `REDIRECTED_TO_PICKUP`, a potem wloz przesylke do maszyny.',
    payload: {
      status: 'REDIRECTED_TO_PICKUP',
      deliveryType: 'PICKUP_POINT',
      senderName: 'Demo Sender Locker Ops',
      senderPhone: '+48999000999',
      recipientName: 'Demo odbior skrytki',
      recipientPhone: '+48123000123',
      weight: 0.9,
      sizeCategory: 'S',
    },
  },
  {
    id: 'locker-ready',
    label: 'Przesylka juz czeka w maszynie',
    description: 'Start bezposrednio od `AWAITING_PICKUP`, aby szybko pokazac odbior.',
    payload: {
      status: 'AWAITING_PICKUP',
      deliveryType: 'PICKUP_POINT',
      senderName: 'Demo Sender Machine Ready',
      senderPhone: '+48145000145',
      recipientName: 'Demo gotowa skrytka',
      recipientPhone: '+48156000156',
      weight: 1.3,
      sizeCategory: 'M',
    },
  },
];

function createLockerTrackingNumber() {
  return `LK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export default function AdminLockerLab() {
  const [parcels, setParcels] = useState<AdminParcelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadParcels = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminParcels();
      setParcels(data);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nie udalo sie pobrac zestawu demo skrytek.');
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
      setError(requestError instanceof Error ? requestError.message : 'Operacja demo skrytek nie powiodla sie.');
    } finally {
      setBusyKey(null);
    }
  }

  const lockerParcels = useMemo(
    () =>
      [...parcels]
        .filter((parcel) => parcel.deliveryType === 'PICKUP_POINT' || parcel.trackingNumber.startsWith('LK'))
        .sort((left, right) => (right.createdAt ?? '').localeCompare(left.createdAt ?? '')),
    [parcels],
  );

  return (
    <DashboardShell role="admin" title="Laboratorium skrytek">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3">
            <Link to="/admin/demo-lab" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Wroc do laboratorium operacji demo
            </Link>
          </div>
          <h2 className="mb-2 text-2xl">Symulacja skrytki i maszyny</h2>
          <p className="text-muted-foreground">
            Techniczna strona do analogowego scenariusza paczkomatu: wloz przesylke do maszyny albo wydaj ja odbiorcy.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadParcels()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Odswiez laboratorium skrytek
        </button>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}

      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        {lockerScenarios.map((scenario) => {
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
                onClick={() =>
                  void runAction(key, () =>
                    createAdminParcel({
                      trackingNumber: createLockerTrackingNumber(),
                      ...scenario.payload,
                    }),
                  )
                }
                className="rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
              >
                Dodaj scenariusz skrytki
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {lockerParcels.slice(0, 12).map((parcel) => {
          const putKey = `put-${parcel.id}`;
          const releaseKey = `release-${parcel.id}`;
          const returnKey = `return-${parcel.id}`;
          const canPut = parcel.status === 'REDIRECTED_TO_PICKUP' || parcel.status === 'IN_TRANSIT';
          const canRelease = parcel.status === 'AWAITING_PICKUP';
          const canReturn = parcel.status === 'AWAITING_PICKUP' || parcel.status === 'REDIRECTED_TO_PICKUP';

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
                </div>
              </div>

              <div className="mb-4 rounded-xl bg-secondary p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <LockKeyhole className="h-4 w-4" />
                  Akcje maszyny
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!canPut || busyKey === putKey}
                    onClick={() =>
                      void runAction(putKey, () =>
                        addAdminTrackingEvent({
                          shipmentId: parcel.id,
                          status: 'AWAITING_PICKUP',
                          locationName: 'Komora skrytki A-12',
                          description: 'Przesylka zostala umieszczona w technicznej skrytce i czeka na odbior.',
                        }),
                      )
                    }
                    className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    Wloz do skrytki
                  </button>

                  <button
                    type="button"
                    disabled={!canRelease || busyKey === releaseKey}
                    onClick={() =>
                      void runAction(releaseKey, () =>
                        addAdminTrackingEvent({
                          shipmentId: parcel.id,
                          status: 'DELIVERED',
                          locationName: 'Odbior ze skrytki zakonczony',
                          description: 'Odbiorca otworzyl techniczna skrytke i odebral przesylke.',
                        }),
                      )
                    }
                    className="rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:opacity-50"
                  >
                    Otworz i wydaj
                  </button>

                  <button
                    type="button"
                    disabled={!canReturn || busyKey === returnKey}
                    onClick={() =>
                      void runAction(returnKey, () =>
                        addAdminTrackingEvent({
                          shipmentId: parcel.id,
                          status: 'RETURNED',
                          locationName: 'Locker return handling',
                          description: 'Parcel was not collected and moved to technical return handling.',
                        }),
                      )
                    }
                    className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    Nieodebrana -&gt; zwrot
                  </button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Uzyj tej strony tylko do demo i technicznej symulacji. Publiczny user nie ma do niej dostepu.
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
