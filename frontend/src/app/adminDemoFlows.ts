import type { AdminParcelRecord, CreateAdminParcelPayload } from './api';

export const technicalTransitions: Record<string, Array<CreateAdminParcelPayload['status']>> = {
  CREATED: ['PAID', 'CANCELED'],
  PAID: ['READY_FOR_POSTING', 'AWAITING_PICKUP', 'CANCELED'],
  READY_FOR_POSTING: ['POSTED', 'CANCELED'],
  POSTED: ['IN_TRANSIT', 'RETURNED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'REDIRECTED_TO_PICKUP', 'AWAITING_PICKUP', 'RETURNED'],
  OUT_FOR_DELIVERY: ['DELIVERY_ATTEMPT', 'DELIVERED', 'RETURNED'],
  DELIVERY_ATTEMPT: ['OUT_FOR_DELIVERY', 'REDIRECTED_TO_PICKUP', 'AWAITING_PICKUP', 'RETURNED'],
  REDIRECTED_TO_PICKUP: ['AWAITING_PICKUP', 'RETURNED'],
  AWAITING_PICKUP: ['DELIVERED', 'RETURNED'],
};

export const transitionMeta: Record<CreateAdminParcelPayload['status'], { label: string; locationName: string; description: string }> = {
  REGISTERED: { label: 'Registered', locationName: 'Demo intake', description: 'Technical registration event for demo parcel.' },
  CREATED: { label: 'Created', locationName: 'Demo intake', description: 'Technical parcel created for operations demo.' },
  PAID: { label: 'Mark as paid', locationName: 'Demo payment', description: 'Technical payment confirmation for demo parcel.' },
  READY_FOR_POSTING: {
    label: 'Prepare for dispatch',
    locationName: 'Demo depot',
    description: 'Shipment prepared for dispatch and ready for the next operational handoff.',
  },
  POSTED: {
    label: 'Post from point/depot',
    locationName: 'Demo outbound dock',
    description: 'Shipment posted from technical handoff point.',
  },
  IN_TRANSIT: {
    label: 'Move to linehaul transit',
    locationName: 'Linehaul transit',
    description: 'Shipment moved between depots in technical demo flow.',
  },
  OUT_FOR_DELIVERY: {
    label: 'Hand over to courier',
    locationName: 'Courier route',
    description: 'Shipment was released for final-mile delivery.',
  },
  DELIVERY_ATTEMPT: {
    label: 'Record failed attempt',
    locationName: 'Delivery attempt',
    description: 'Courier attempted delivery but recipient was unavailable.',
  },
  REDIRECTED_TO_PICKUP: {
    label: 'Redirect to pickup',
    locationName: 'Redirect processing',
    description: 'Shipment redirected from courier flow into pickup handling.',
  },
  AWAITING_PICKUP: {
    label: 'Place into pickup/locker flow',
    locationName: 'Pickup ready',
    description: 'Shipment is now waiting for recipient pickup in the technical demo flow.',
  },
  DELIVERED: {
    label: 'Complete delivery',
    locationName: 'Delivered',
    description: 'Shipment was successfully released to the recipient.',
  },
  RETURNED: {
    label: 'Return to sender',
    locationName: 'Return handling',
    description: 'Shipment left the active flow and entered return processing.',
  },
  CANCELED: {
    label: 'Cancel shipment',
    locationName: 'Canceled',
    description: 'Shipment was canceled in the technical operations flow.',
  },
};

export const scenarioTemplates: Array<{
  id: string;
  label: string;
  description: string;
  payload: Omit<CreateAdminParcelPayload, 'trackingNumber'>;
}> = [
  {
    id: 'courier-ready',
    label: 'Courier dispatch starter',
    description: 'READY_FOR_POSTING courier parcel ready for depot and route simulation.',
    payload: {
      status: 'READY_FOR_POSTING',
      deliveryType: 'COURIER',
      senderName: 'Demo Sender Warsaw',
      senderPhone: '+48111000111',
      recipientName: 'Demo Courier Recipient',
      recipientPhone: '+48222000222',
      weight: 2.4,
      sizeCategory: 'M',
    },
  },
  {
    id: 'linehaul-transit',
    label: 'Transit parcel',
    description: 'IN_TRANSIT parcel for depot and linehaul storytelling.',
    payload: {
      status: 'IN_TRANSIT',
      deliveryType: 'COURIER',
      senderName: 'Demo Sender Gdansk',
      senderPhone: '+48333000333',
      recipientName: 'Demo Transit Recipient',
      recipientPhone: '+48444000444',
      weight: 4.1,
      sizeCategory: 'L',
    },
  },
  {
    id: 'redirect-pickup',
    label: 'Redirect to pickup',
    description: 'REDIRECTED_TO_PICKUP parcel for point/locker follow-up flows.',
    payload: {
      status: 'REDIRECTED_TO_PICKUP',
      deliveryType: 'PICKUP_POINT',
      senderName: 'Demo Sender Poznan',
      senderPhone: '+48555000555',
      recipientName: 'Demo Redirect Recipient',
      recipientPhone: '+48666000666',
      weight: 1.1,
      sizeCategory: 'S',
    },
  },
  {
    id: 'locker-waiting',
    label: 'Locker waiting pickup',
    description: 'AWAITING_PICKUP parcel for machine-style release demo.',
    payload: {
      status: 'AWAITING_PICKUP',
      deliveryType: 'PICKUP_POINT',
      senderName: 'Demo Sender Krakow',
      senderPhone: '+48777000777',
      recipientName: 'Demo Locker Recipient',
      recipientPhone: '+48888000888',
      weight: 0.8,
      sizeCategory: 'S',
    },
  },
];

export function createTechnicalTrackingNumber(prefix: string) {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function buildScenarioPayload(template: (typeof scenarioTemplates)[number]['payload']): CreateAdminParcelPayload {
  return {
    trackingNumber: createTechnicalTrackingNumber('DM'),
    ...template,
  };
}

export function sortParcelsByCreatedAt(parcels: AdminParcelRecord[]) {
  return [...parcels].sort((left, right) => (right.createdAt ?? '').localeCompare(left.createdAt ?? ''));
}

export function getTransitDemoParcels(parcels: AdminParcelRecord[]) {
  return sortParcelsByCreatedAt(parcels).filter((parcel) =>
    ['READY_FOR_POSTING', 'POSTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(parcel.status),
  );
}

export function getHandoverDemoParcels(parcels: AdminParcelRecord[]) {
  return sortParcelsByCreatedAt(parcels).filter((parcel) =>
    ['READY_FOR_POSTING', 'POSTED', 'IN_TRANSIT', 'REDIRECTED_TO_PICKUP', 'AWAITING_PICKUP'].includes(parcel.status),
  );
}
