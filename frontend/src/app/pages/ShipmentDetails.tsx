import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { AlertCircle, Ban, Calendar, CheckCircle, CreditCard, MapPin, Printer, RotateCcw, User, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type TFunction } from 'i18next';
import {
  ApiError,
  cancelClientShipment,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDeliveryMethod,
  formatDeliveryType,
  formatIntakeMethod,
  formatPaymentMethod,
  formatRoutingOwner,
  formatShipmentAction,
  formatShipmentStatus,
  getClientShipmentDetails,
  initiateOnlinePayment,
  verifyStripeSession,
  type ClientShipmentDetails,
} from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

type CustomerGuidance = {
  current: string;
  customerAction: string;
  nextStep: string;
};

function buildCustomerGuidance(
  shipment: ClientShipmentDetails,
  routeStatus: string,
  canCancel: boolean,
  t: TFunction,
): CustomerGuidance {
  const targetPoint = shipment.delivery.targetPointCode;
  const sourcePoint = shipment.delivery.sourcePointCode;
  const intakeMethod = shipment.delivery.intakeMethod;
  const deliveryMethod = shipment.delivery.deliveryMethod;
  const paymentMethod = shipment.payment.method;
  const paymentStatus = shipment.payment.status;
  const pointLabel = sourcePoint ?? t('shipmentDetails.noReference');

  if (paymentStatus === 'PENDING' && paymentMethod === 'ONLINE') {
    return {
      current: t('shipmentGuidance.paymentPendingCurrent'),
      customerAction: t('shipmentGuidance.paymentPendingAction'),
      nextStep: t('shipmentGuidance.paymentPendingNext'),
    };
  }

  if (routeStatus === 'READY_FOR_HANDOVER') {
    if (intakeMethod === 'POINT_DROPOFF') {
      return {
        current: t('shipmentGuidance.handoverPointCurrent'),
        customerAction: paymentMethod === 'OFFLINE_AT_POINT'
          ? t('shipmentGuidance.handoverPointActionOffline', { point: pointLabel })
          : canCancel
            ? t('shipmentGuidance.handoverPointActionCancel', { point: pointLabel })
            : t('shipmentGuidance.handoverPointAction', { point: pointLabel }),
        nextStep: t('shipmentGuidance.handoverPointNext'),
      };
    }

    if (shipment.delivery.currentNodeType === 'COURIER') {
      const assignedCourier = shipment.delivery.currentNodeCode;
      const idSuffix = assignedCourier ? ` (${assignedCourier})` : '';
      return {
        current: t('shipmentGuidance.handoverCourierAssignedCurrent'),
        customerAction: t('shipmentGuidance.handoverCourierAssignedAction'),
        nextStep: t('shipmentGuidance.handoverCourierAssignedNext', { id: idSuffix }),
      };
    }

    return {
      current: t('shipmentGuidance.handoverCourierCurrent'),
      customerAction: t('shipmentGuidance.handoverCourierAction'),
      nextStep: t('shipmentGuidance.handoverCourierNext'),
    };
  }

  if (routeStatus === 'ACCEPTED_AT_SOURCE') {
    return {
      current: t('shipmentGuidance.acceptedAtSourceCurrent'),
      customerAction: t('shipmentGuidance.acceptedAtSourceAction'),
      nextStep: t('shipmentGuidance.acceptedAtSourceNext'),
    };
  }

  if (routeStatus === 'IN_TRANSIT_TO_DESTINATION_HUB' || routeStatus === 'AT_ORIGIN_HUB') {
    return {
      current: t('shipmentGuidance.inTransitCurrent'),
      customerAction: t('shipmentGuidance.inTransitAction'),
      nextStep: t('shipmentGuidance.inTransitNext'),
    };
  }

  if (routeStatus === 'AT_DESTINATION_HUB') {
    return {
      current: t('shipmentGuidance.atDestinationHubCurrent'),
      customerAction: t('shipmentGuidance.atDestinationHubAction'),
      nextStep: deliveryMethod === 'PICKUP_POINT'
        ? t('shipmentGuidance.atDestinationHubNextPoint', { point: targetPoint ?? '' })
        : t('shipmentGuidance.atDestinationHubNextCourier'),
    };
  }

  if (routeStatus === 'OUT_FOR_DELIVERY') {
    return {
      current: t('shipmentGuidance.outForDeliveryCurrent'),
      customerAction: paymentMethod === 'OFFLINE_AT_COURIER'
        ? t('shipmentGuidance.outForDeliveryActionPayment')
        : t('shipmentGuidance.outForDeliveryAction'),
      nextStep: t('shipmentGuidance.outForDeliveryNext'),
    };
  }

  if (routeStatus === 'IN_TRANSIT_TO_TARGET_POINT') {
    return {
      current: t('shipmentGuidance.inTransitToPointCurrent'),
      customerAction: t('shipmentGuidance.inTransitToPointAction'),
      nextStep: t('shipmentGuidance.inTransitToPointNext', { point: targetPoint ?? t('shipmentDetails.noReference') }),
    };
  }

  if (routeStatus === 'AWAITING_PICKUP' || routeStatus === 'AWAITING_LOCKER_PICKUP') {
    return {
      current: routeStatus === 'AWAITING_LOCKER_PICKUP'
        ? t('shipmentGuidance.awaitingLockerCurrent')
        : t('shipmentGuidance.awaitingPickupCurrent'),
      customerAction: routeStatus === 'AWAITING_LOCKER_PICKUP'
        ? t('shipmentGuidance.awaitingLockerAction')
        : t('shipmentGuidance.awaitingPickupAction', { point: targetPoint ?? t('shipmentDetails.noReference') }),
      nextStep: t('shipmentGuidance.awaitingNext'),
    };
  }

  if (routeStatus === 'DELIVERY_ATTEMPT_FAILED' || routeStatus === 'RETURN_IN_TRANSIT') {
    return {
      current: t('shipmentGuidance.failedAttemptCurrent'),
      customerAction: t('shipmentGuidance.failedAttemptAction'),
      nextStep: t('shipmentGuidance.failedAttemptNext'),
    };
  }

  if (routeStatus === 'DELIVERED') {
    return {
      current: t('shipmentGuidance.deliveredCurrent'),
      customerAction: t('shipmentGuidance.deliveredAction'),
      nextStep: t('shipmentGuidance.deliveredNext'),
    };
  }

  if (routeStatus === 'CANCELED') {
    return {
      current: t('shipmentGuidance.canceledCurrent'),
      customerAction: t('shipmentGuidance.canceledAction'),
      nextStep: t('shipmentGuidance.canceledNext'),
    };
  }

  return {
    current: t('shipmentGuidance.defaultCurrent'),
    customerAction: t('shipmentGuidance.defaultAction'),
    nextStep: t('shipmentGuidance.defaultNext'),
  };
}

export default function ShipmentDetails() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const paymentResult = searchParams.get('payment');
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
          if (requestError instanceof ApiError && requestError.status === 404) {
            setError(t('shipmentDetails.notFoundDesc'));
          } else {
            setError(t('shipmentDetails.loadError'));
          }
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadShipment();
    return () => { active = false; };
  }, [currentUser?.email, id, t]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (paymentResult === 'success' && sessionId && currentUser?.email && shipment?.payment?.paymentId) {
      verifyStripeSession(currentUser.email, shipment.payment.paymentId, sessionId)
        .then(() => {
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
      setPaymentError(t('shipmentDetails.payError'));
      setPaymentLoading(false);
    }
  }

  async function handleCancelShipment() {
    if (!currentUser?.email || !shipment?.trackingNumber) return;
    if (!window.confirm(t('shipmentDetails.cancelConfirm'))) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      await cancelClientShipment(currentUser.email, shipment.trackingNumber);
      navigate('/client/shipments');
    } catch {
      setCancelError(t('shipmentDetails.cancelError'));
      setCancelLoading(false);
    }
  }

  const canCancel =
    shipment !== null &&
    ['READY_FOR_HANDOVER', 'ACCEPTED_AT_SOURCE'].includes(shipment.currentStatus) &&
    shipment.delivery.currentNodeType !== 'COURIER';
  const readableActions = shipment?.allowedActions.map((action) => formatShipmentAction(action)).filter(Boolean) ?? [];
  const routeStatus = shipment?.delivery.shipmentRouteStatus ?? shipment?.currentStatus ?? null;
  const customerGuidance = shipment
    ? buildCustomerGuidance(shipment, routeStatus ?? shipment.currentStatus, canCancel, t)
    : null;

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
    return <DashboardShell role="client" title={t('shipmentDetails.title')}>{t('shipmentDetails.loading')}</DashboardShell>;
  }

  if (!shipment) {
    return (
      <DashboardShell role="client" title={t('shipmentDetails.title')}>
        <div className="max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <h2 className="mb-3 text-2xl">{t('shipmentDetails.notFound')}</h2>
          <p className="mb-6 text-muted-foreground">{error ?? t('shipmentDetails.notFoundDesc')}</p>
          <Link
            to="/client/shipments"
            className="rounded-lg bg-accent px-6 py-3 text-white transition-colors hover:bg-accent/90"
          >
            {t('shipmentDetails.backToList')}
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="client" title={t('shipmentDetails.title')}>
      {paymentResult === 'success' && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-green-700 dark:text-green-400">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span>{t('shipmentDetails.paymentSuccess')}</span>
        </div>
      )}
      {paymentResult === 'cancelled' && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-destructive">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <span>{t('shipmentDetails.paymentCancelled')}</span>
        </div>
      )}

      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h2 className="text-2xl">{shipment.trackingNumber}</h2>
            <StatusBadge status={shipment.currentStatus} />
          </div>
          <div className="space-y-1 text-muted-foreground">
            <p>
              Trasa: {formatShipmentStatus(shipment.delivery.shipmentRouteStatus ?? shipment.currentStatus)} · nastepny owner:{' '}
              {formatRoutingOwner(shipment.nextOwner)}
            </p>
            {readableActions.length > 0 ? (
              <p className="text-sm">
                {t('shipmentDetails.allowedActions', {
                  actions: readableActions.join(', '),
                })}
              </p>
            ) : null}
          </div>
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
              {paymentLoading ? t('shipmentDetails.paying') : t('shipmentDetails.payStripe')}
            </button>
          ) : null}
          {shipment.allowedActions.includes('REQUEST_REDIRECTION') ? (
            <Link
              to={`/client/shipments/${shipment.trackingNumber}/redirect`}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" />
              {t('shipmentDetails.redirectToPoint')}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => shipment && printShipmentLabel(shipment)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
          >
            <Printer className="h-4 w-4" />
            {t('shipmentDetails.printLabel')}
          </button>
          {canCancel ? (
            <button
              type="button"
              onClick={() => void handleCancelShipment()}
              disabled={cancelLoading}
              className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
            >
              <Ban className="h-4 w-4" />
              {cancelLoading ? t('shipmentDetails.cancelling') : t('shipmentDetails.cancelShipment')}
            </button>
          ) : null}
          {cancelError ? <p className="w-full text-sm text-destructive">{cancelError}</p> : null}
        </div>
      </div>

      {customerGuidance ? (
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-2 text-sm uppercase tracking-wide text-muted-foreground">
              {i18n.language === 'en' ? 'What is happening now' : 'Co dzieje sie teraz'}
            </div>
            <div>{customerGuidance.current}</div>
          </div>
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 shadow-sm">
            <div className="mb-2 text-sm uppercase tracking-wide text-muted-foreground">
              {i18n.language === 'en' ? 'What you should do' : 'Co trzeba zrobic'}
            </div>
            <div>{customerGuidance.customerAction}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-2 text-sm uppercase tracking-wide text-muted-foreground">
              {i18n.language === 'en' ? 'What happens next' : 'Co bedzie dalej'}
            </div>
            <div>{customerGuidance.nextStep}</div>
          </div>
        </div>
      ) : null}

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg">{t('shipmentDetails.addressData')}</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm uppercase tracking-wide">{t('shipmentDetails.sender')}</span>
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
                  <span className="text-sm uppercase tracking-wide">{t('shipmentDetails.recipient')}</span>
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
            <h3 className="mb-4 text-lg">{t('shipmentDetails.parcelParams')}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-sm text-muted-foreground">{t('shipmentDetails.weightLabel')}</div>
                <div>{shipment.parcel.weight} kg</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-muted-foreground">{t('shipmentDetails.sizeLabel')}</div>
                <div>{shipment.parcel.sizeCategory}</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-muted-foreground">{t('shipmentDetails.declaredValue')}</div>
                <div>{formatCurrency(shipment.parcel.declaredValue)}</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-muted-foreground">{t('shipmentDetails.fragileLabel')}</div>
                <div>{shipment.parcel.fragile ? t('shipmentDetails.yes') : t('shipmentDetails.no')}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-6 text-lg">{t('shipmentDetails.history')}</h3>
            <div className="space-y-6">
              {shipment.history.length === 0 ? (
                <div className="text-muted-foreground">{t('shipmentDetails.noHistory')}</div>
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
            <h3 className="mb-4 text-lg">{t('shipmentDetails.delivery')}</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-accent/10 p-3">
                <Calendar className="h-5 w-5 text-accent" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('shipmentDetails.estimatedDelivery')}</div>
                  <div>{formatDate(shipment.delivery.estimatedDeliveryDate)}</div>
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm text-muted-foreground">{t('shipmentDetails.intakeMethod')}</div>
                <div>{formatIntakeMethod(shipment.delivery.intakeMethod)}</div>
              </div>

              <div>
                <div className="mb-1 text-sm text-muted-foreground">{t('shipmentDetails.deliveryMethod')}</div>
                <div>{formatDeliveryMethod(shipment.delivery.deliveryMethod)}</div>
              </div>

              <div>
                <div className="mb-1 text-sm text-muted-foreground">{t('shipmentDetails.deliveryType')}</div>
                <div>{formatDeliveryType(shipment.delivery.deliveryType)}</div>
              </div>

              <div>
                <div className="mb-1 text-sm text-muted-foreground">Status trasy</div>
                <div>{formatShipmentStatus(shipment.delivery.shipmentRouteStatus ?? shipment.currentStatus)}</div>
              </div>

              {shipment.delivery.sourcePointCode ? (
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">{t('shipmentDetails.sourcePoint')}</div>
                  <div>{shipment.delivery.sourcePointCode}</div>
                </div>
              ) : null}

              {shipment.delivery.targetPointCode ? (
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">{t('shipmentDetails.targetPoint')}</div>
                  <div>{shipment.delivery.targetPointCode}</div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg">{t('shipmentDetails.payment')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('shipmentDetails.paymentStatus')}</span>
                <StatusBadge status={shipment.payment.status} type="payment" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('shipmentDetails.paymentAmount')}</span>
                <span>{formatCurrency(shipment.payment.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('shipmentDetails.paymentMethod')}</span>
                <span className="text-sm">{formatPaymentMethod(shipment.payment.method)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('shipmentDetails.paymentRef')}</span>
                <span className="text-sm">{shipment.payment.externalReference ?? t('shipmentDetails.noReference')}</span>
              </div>

              {shipment.payment.status === 'PENDING' && shipment.payment.method === 'ONLINE' && shipment.payment.paymentId ? (
                <div className="pt-2">
                  {paymentError ? <p className="mb-2 text-sm text-destructive">{paymentError}</p> : null}
                  <button
                    type="button"
                    onClick={() => void handlePayOnline()}
                    disabled={paymentLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
                  >
                    <CreditCard className="h-4 w-4" />
                    {paymentLoading ? t('shipmentDetails.paying') : t('shipmentDetails.payOnlineStripe')}
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6">
            <div className="mb-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
              <div>
                <h4 className="mb-1 text-sm">{t('shipmentDetails.problem')}</h4>
                <p className="text-sm text-muted-foreground">{t('shipmentDetails.problemDesc')}</p>
              </div>
            </div>
            <Link
              to="/client/claims"
              className="block w-full rounded-lg bg-destructive px-4 py-2 text-center text-white transition-colors hover:bg-destructive/90"
            >
              {t('shipmentDetails.fileClaim')}
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
