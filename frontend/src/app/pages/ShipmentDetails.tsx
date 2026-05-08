import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { AlertCircle, Calendar, MapPin, Printer, RotateCcw, User } from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPaymentMethod,
  getClientShipmentDetails,
  type ClientShipmentDetails,
} from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function ShipmentDetails() {
  const { id } = useParams();
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [shipment, setShipment] = useState<ClientShipmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadShipment() {
      if (!currentUser?.email || !id) {
        setIsLoading(false);
        setShipment(null);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getClientShipmentDetails(currentUser.email, id);
        if (active) {
          setShipment(data);
          setError(null);
        }
      } catch (requestError) {
        if (active) {
          setShipment(null);
          setError(requestError instanceof Error ? requestError.message : 'Nie znaleziono przesyłki.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadShipment();

    return () => {
      active = false;
    };
  }, [currentUser?.email, id]);

  if (isLoading) {
    return <DashboardShell role="client" title="Szczegóły przesyłki">Ładowanie szczegółów...</DashboardShell>;
  }

  if (!shipment) {
    return (
      <DashboardShell role="client" title="Szczegóły przesyłki">
        <div className="max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <h2 className="mb-3 text-2xl">Nie znaleziono przesyłki</h2>
          <p className="mb-6 text-muted-foreground">{error ?? 'Wybrana przesyłka nie istnieje albo nie jest dostępna.'}</p>
          <Link
            to="/client/shipments"
            className="rounded-lg bg-accent px-6 py-3 text-white transition-colors hover:bg-accent/90"
          >
            Wróć do listy przesyłek
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="client" title="Szczegóły przesyłki">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h2 className="text-2xl">{shipment.trackingNumber}</h2>
            <StatusBadge status={shipment.currentStatus} />
          </div>
          <p className="text-muted-foreground">
            Dozwolone akcje: {shipment.allowedActions.length > 0 ? shipment.allowedActions.join(', ') : 'brak'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {shipment.allowedActions.includes('REQUEST_REDIRECTION') ? (
            <Link
              to={`/client/shipments/${shipment.trackingNumber}/redirect`}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" />
              Przekieruj do punktu
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
          >
            <Printer className="h-4 w-4" />
            Drukuj
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg">Dane adresowe</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm uppercase tracking-wide">Nadawca</span>
                </div>
                <div className="space-y-1">
                  <div>{shipment.sender.name}</div>
                  <div className="text-sm text-muted-foreground">{shipment.sender.phone}</div>
                  <div className="flex items-start gap-1 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    {shipment.sender.address}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm uppercase tracking-wide">Odbiorca</span>
                </div>
                <div className="space-y-1">
                  <div>{shipment.recipient.name}</div>
                  <div className="text-sm text-muted-foreground">{shipment.recipient.phone}</div>
                  <div className="flex items-start gap-1 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    {shipment.recipient.address}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg">Parametry paczki</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-sm text-muted-foreground">Waga</div>
                <div>{shipment.parcel.weight} kg</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-muted-foreground">Gabaryt</div>
                <div>{shipment.parcel.sizeCategory}</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-muted-foreground">Wartość deklarowana</div>
                <div>{formatCurrency(shipment.parcel.declaredValue)}</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-muted-foreground">Delikatna</div>
                <div>{shipment.parcel.fragile ? 'Tak' : 'Nie'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-6 text-lg">Historia przesyłki</h3>
            <div className="space-y-6">
              {shipment.history.length === 0 ? (
                <div className="text-muted-foreground">Ta przesyłka nie ma jeszcze żadnych zdarzeń trackingowych.</div>
              ) : null}

              {shipment.history.map((item, index) => (
                <div key={`${item.eventTime}-${item.status}-${index}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-accent' : 'bg-muted'}`} />
                    {index !== shipment.history.length - 1 ? <div className="mt-2 h-full w-0.5 bg-border" /> : null}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="mb-1 flex items-center gap-3">
                      <StatusBadge status={item.status} />
                      <span className="text-sm text-muted-foreground">{formatDateTime(item.eventTime)}</span>
                    </div>
                    <div className="mb-1">{item.description}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {item.locationName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg">Dostawa</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-accent/10 p-3">
                <Calendar className="h-5 w-5 text-accent" />
                <div>
                  <div className="text-sm text-muted-foreground">Szacowana dostawa</div>
                  <div>{formatDate(shipment.delivery.estimatedDeliveryDate)}</div>
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm text-muted-foreground">Typ dostawy</div>
                <div>{shipment.delivery.deliveryType === 'COURIER' ? 'Kurier' : shipment.delivery.deliveryType}</div>
              </div>

              {shipment.delivery.targetPointCode ? (
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">Punkt docelowy</div>
                  <div>{shipment.delivery.targetPointCode}</div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg">Płatność</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={shipment.payment.status} type="payment" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Kwota</span>
                <span>{formatCurrency(shipment.payment.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Metoda</span>
                <span className="text-sm">{formatPaymentMethod(shipment.payment.method)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Referencja</span>
                <span className="text-sm">{shipment.payment.externalReference ?? 'Brak'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6">
            <div className="mb-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
              <div>
                <h4 className="mb-1 text-sm">Problem z przesyłką?</h4>
                <p className="text-sm text-muted-foreground">Reklamacje są już podpięte do żywego backendu.</p>
              </div>
            </div>
            <Link
              to="/client/claims"
              className="block w-full rounded-lg bg-destructive px-4 py-2 text-center text-white transition-colors hover:bg-destructive/90"
            >
              Zgłoś reklamację
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
