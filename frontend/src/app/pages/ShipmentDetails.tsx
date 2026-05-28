import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { AlertCircle, Ban, Calendar, CheckCircle, CreditCard, MapPin, Printer, RotateCcw, User, XCircle } from 'lucide-react';
import {
  cancelClientShipment,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPaymentMethod,
  getClientShipmentDetails,
  initiateOnlinePayment,
  verifyStripeSession,
  type ClientShipmentDetails,
} from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

export default function ShipmentDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const paymentResult = searchParams.get('payment'); // 'success' | 'cancelled'
  const {
    state: { currentUser },
  } = useAppStateContext();
  const [shipment, setShipment] = useState<ClientShipmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

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

  // Auto-verify payment when returning from Stripe success page
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (paymentResult === 'success' && sessionId && currentUser?.email && shipment?.payment?.paymentId) {
      verifyStripeSession(currentUser.email, shipment.payment.paymentId, sessionId)
        .then(() => {
          // Reload shipment data to show updated payment status
          getClientShipmentDetails(currentUser.email!, id!)
            .then(data => setShipment(data))
            .catch(() => null);
        })
        .catch(() => null);
    }
  }, [paymentResult, shipment?.payment?.paymentId, currentUser?.email, id, searchParams]);

  async function handlePayOnline() {
    if (!currentUser?.email || !shipment?.payment?.paymentId) return;
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const { checkoutUrl } = await initiateOnlinePayment(currentUser.email, shipment.payment.paymentId);
      window.location.href = checkoutUrl;
    } catch {
      setPaymentError('Nie udało się uruchomić płatności. Spróbuj ponownie.');
      setPaymentLoading(false);
    }
  }

  async function handleCancelShipment() {
    if (!currentUser?.email || !shipment?.trackingNumber) return;
    if (!window.confirm('Czy na pewno chcesz anulować tę przesyłkę? Tej operacji nie można cofnąć.')) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      await cancelClientShipment(currentUser.email, shipment.trackingNumber);
      navigate('/client/shipments');
    } catch {
      setCancelError('Nie udało się anulować przesyłki. Spróbuj ponownie.');
      setCancelLoading(false);
    }
  }

  const canCancel =
    shipment !== null &&
    ['CREATED', 'PAID', 'READY_FOR_POSTING'].includes(shipment.currentStatus);

  function printShipmentLabel(s: ClientShipmentDetails) {
    const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>Etykieta — ${s.trackingNumber}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; background: #fff; color: #000; padding: 16px; }
  .label { width: 105mm; min-height: 148mm; border: 2px solid #000; padding: 8px; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
  .logo { font-size: 18px; font-weight: bold; }
  .tracking { font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 2px; text-align: center; border: 1px solid #000; padding: 6px; margin-bottom: 8px; }
  .section { margin-bottom: 8px; }
  .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666; border-bottom: 1px solid #ccc; margin-bottom: 4px; padding-bottom: 2px; }
  .name { font-size: 15px; font-weight: bold; }
  .address { font-size: 13px; line-height: 1.4; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #ccc; }
  .meta-item { }
  .meta-label { color: #666; }
  .badge { display: inline-block; border: 1px solid #000; padding: 2px 6px; font-size: 11px; font-weight: bold; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="label">
  <div class="header">
    <div class="logo">🐧 PingwinPost</div>
    <div class="badge">${s.delivery.deliveryType ?? 'STANDARD'}</div>
  </div>
  <div class="tracking">${s.trackingNumber}</div>
  <div class="section">
    <div class="section-title">Nadawca</div>
    <div class="name">${s.sender.name}</div>
    <div class="address">${s.sender.address ?? ''}<br>${s.sender.phone ?? ''}</div>
  </div>
  <div class="section">
    <div class="section-title">Odbiorca</div>
    <div class="name">${s.recipient.name}</div>
    <div class="address">${s.recipient.address ?? ''}<br>${s.recipient.phone ?? ''}</div>
  </div>
  ${s.delivery.targetPointCode ? `<div class="section"><div class="section-title">Punkt odbioru</div><div class="name">${s.delivery.targetPointCode}</div></div>` : ''}
  <div class="meta">
    <div class="meta-item"><div class="meta-label">Waga</div>${s.parcel.weight != null ? `${s.parcel.weight} kg` : '—'}</div>
    <div class="meta-item"><div class="meta-label">Rozmiar</div>${s.parcel.sizeCategory ?? '—'}</div>
    <div class="meta-item"><div class="meta-label">Status</div>${s.currentStatus}</div>
    <div class="meta-item"><div class="meta-label">ETA</div>${s.delivery.estimatedDeliveryDate ?? '—'}</div>
    ${s.parcel.fragile ? '<div class="meta-item" style="grid-column:span 2"><div class="meta-label">⚠ FRAGILE</div></div>' : ''}
  </div>
</div>
<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;
    const win = window.open('', '_blank', 'width=500,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

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
      {paymentResult === 'success' && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-green-700 dark:text-green-400">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span>Płatność zakończona sukcesem. Status zostanie zaktualizowany wkrótce.</span>
        </div>
      )}
      {paymentResult === 'cancelled' && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-destructive">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <span>Płatność została anulowana lub odrzucona. Możesz spróbować ponownie.</span>
        </div>
      )}

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
          {shipment.payment.status === 'PENDING' && shipment.payment.method === 'ONLINE' && shipment.payment.paymentId ? (
            <button
              type="button"
              onClick={() => void handlePayOnline()}
              disabled={paymentLoading}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              {paymentLoading ? 'Przekierowywanie...' : 'Zapłać przez Stripe'}
            </button>
          ) : null}
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
            onClick={() => shipment && printShipmentLabel(shipment)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
          >
            <Printer className="h-4 w-4" />
            Drukuj etykietę
          </button>
          {canCancel ? (
            <button
              type="button"
              onClick={() => void handleCancelShipment()}
              disabled={cancelLoading}
              className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
            >
              <Ban className="h-4 w-4" />
              {cancelLoading ? 'Anulowanie...' : 'Anuluj przesyłkę'}
            </button>
          ) : null}
          {cancelError ? (
            <p className="w-full text-sm text-destructive">{cancelError}</p>
          ) : null}
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

              {shipment.payment.status === 'PENDING' && shipment.payment.method === 'ONLINE' && shipment.payment.paymentId ? (
                <div className="pt-2">
                  {paymentError ? (
                    <p className="mb-2 text-sm text-destructive">{paymentError}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handlePayOnline()}
                    disabled={paymentLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
                  >
                    <CreditCard className="h-4 w-4" />
                    {paymentLoading ? 'Przekierowywanie...' : 'Opłać online (Stripe)'}
                  </button>
                </div>
              ) : null}
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
