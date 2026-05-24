import type { AdminParcelRecord, CreateAdminParcelPayload } from './api';

export interface DemoStoryStageMeta {
  lane: 'WAREHOUSE' | 'LINEHAUL' | 'FINAL_MILE' | 'PICKUP' | 'EXCEPTION' | 'DONE';
  title: string;
  owner: string;
  nextOwner: string;
  summary: string;
  checkpoint: string;
}

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
    id: 'delivery-attempt',
    label: 'Failed final-mile attempt',
    description: 'DELIVERY_ATTEMPT parcel for courier exception, redirect, and retry storytelling.',
    payload: {
      status: 'DELIVERY_ATTEMPT',
      deliveryType: 'COURIER',
      senderName: 'Demo Sender Wroclaw',
      senderPhone: '+48999000999',
      recipientName: 'Demo Attempt Recipient',
      recipientPhone: '+48123000123',
      weight: 3.5,
      sizeCategory: 'M',
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
    id: 'return-flow',
    label: 'Return to sender',
    description: 'RETURNED parcel for warehouse exception and reverse-logistics storytelling.',
    payload: {
      status: 'RETURNED',
      deliveryType: 'COURIER',
      senderName: 'Demo Sender Szczecin',
      senderPhone: '+48101000101',
      recipientName: 'Demo Return Recipient',
      recipientPhone: '+48202000202',
      weight: 2.2,
      sizeCategory: 'M',
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
    ['READY_FOR_POSTING', 'POSTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERY_ATTEMPT', 'RETURNED'].includes(parcel.status),
  );
}

export function getHandoverDemoParcels(parcels: AdminParcelRecord[]) {
  return sortParcelsByCreatedAt(parcels).filter((parcel) =>
    ['READY_FOR_POSTING', 'POSTED', 'IN_TRANSIT', 'DELIVERY_ATTEMPT', 'REDIRECTED_TO_PICKUP', 'AWAITING_PICKUP', 'RETURNED'].includes(
      parcel.status,
    ),
  );
}

export const transitStoryMeta: Record<string, DemoStoryStageMeta> = {
  READY_FOR_POSTING: {
    lane: 'WAREHOUSE',
    title: 'Inbound warehouse ready',
    owner: 'Depot ops',
    nextOwner: 'Outbound dock',
    summary: 'Parcel is checked in, sorted, and waiting for outbound release.',
    checkpoint: 'Ready to move from warehouse sorting into outbound dispatch.',
  },
  POSTED: {
    lane: 'WAREHOUSE',
    title: 'Outbound dock scan',
    owner: 'Outbound dock',
    nextOwner: 'Linehaul carrier',
    summary: 'Parcel left the origin depot and has a clean outbound handoff scan.',
    checkpoint: 'Dispatch complete. Next visible move should be inter-hub transit.',
  },
  IN_TRANSIT: {
    lane: 'LINEHAUL',
    title: 'Linehaul between hubs',
    owner: 'Linehaul',
    nextOwner: 'Final-mile depot',
    summary: 'Parcel is moving between depots or hubs and should not stall too long here.',
    checkpoint: 'Monitor for arrival at destination depot or escalation into exception flow.',
  },
  OUT_FOR_DELIVERY: {
    lane: 'FINAL_MILE',
    title: 'Final-mile courier route',
    owner: 'Courier',
    nextOwner: 'Recipient or pickup fallback',
    summary: 'Courier has custody and should either deliver or record an attempt outcome.',
    checkpoint: 'Expect delivery, failed attempt, or redirect into pickup operations.',
  },
  DELIVERY_ATTEMPT: {
    lane: 'EXCEPTION',
    title: 'Delivery exception',
    owner: 'Courier exception handling',
    nextOwner: 'Courier retry or pickup point',
    summary: 'Courier could not complete the drop and must either retry, redirect, or return.',
    checkpoint: 'This is the main exception lane for last-mile storytelling.',
  },
  RETURNED: {
    lane: 'EXCEPTION',
    title: 'Reverse logistics',
    owner: 'Returns desk',
    nextOwner: 'Sender support',
    summary: 'Parcel left the active route and entered return-to-sender handling.',
    checkpoint: 'Use this lane for warehouse exceptions and non-delivery end states.',
  },
  DELIVERED: {
    lane: 'DONE',
    title: 'Delivered',
    owner: 'Recipient handoff complete',
    nextOwner: 'Archive',
    summary: 'Parcel has completed the active chain successfully.',
    checkpoint: 'Demo can now pivot to payments, claims, or archive review.',
  },
  REDIRECTED_TO_PICKUP: {
    lane: 'PICKUP',
    title: 'Redirect prepared',
    owner: 'Redirect processing',
    nextOwner: 'Pickup point',
    summary: 'Last-mile failed and parcel is now being rerouted into assisted pickup.',
    checkpoint: 'Point staff still need to accept the redirected parcel.',
  },
  AWAITING_PICKUP: {
    lane: 'PICKUP',
    title: 'Pickup ready',
    owner: 'Pickup point or locker',
    nextOwner: 'Recipient',
    summary: 'Parcel is physically ready for recipient collection in point or locker flow.',
    checkpoint: 'Final user-facing handoff happens here.',
  },
};

export const handoverStoryMeta: Record<string, DemoStoryStageMeta> = {
  READY_FOR_POSTING: {
    lane: 'WAREHOUSE',
    title: 'Depot prep',
    owner: 'Depot ops',
    nextOwner: 'Linehaul',
    summary: 'Ops still owns the parcel and can narrate intake, sorting, and dispatch prep.',
    checkpoint: 'First operational handoff begins when the parcel is posted out.',
  },
  POSTED: {
    lane: 'WAREHOUSE',
    title: 'Posted from depot',
    owner: 'Outbound dock',
    nextOwner: 'Linehaul',
    summary: 'The parcel has a clean warehouse handoff and is ready for transport between facilities.',
    checkpoint: 'This is the visible bridge between depot and courier worlds.',
  },
  IN_TRANSIT: {
    lane: 'LINEHAUL',
    title: 'Linehaul in motion',
    owner: 'Transport network',
    nextOwner: 'Courier',
    summary: 'Parcel is between facilities and has not yet reached final-mile custody.',
    checkpoint: 'Use this to narrate inter-city or inter-hub movement.',
  },
  DELIVERY_ATTEMPT: {
    lane: 'EXCEPTION',
    title: 'Courier exception',
    owner: 'Courier',
    nextOwner: 'Courier retry or point',
    summary: 'Courier failed to complete the doorstep handoff and must choose the next rescue path.',
    checkpoint: 'A good moment to explain retry, redirect, or return business rules.',
  },
  REDIRECTED_TO_PICKUP: {
    lane: 'PICKUP',
    title: 'Redirect handed to point',
    owner: 'Redirect ops',
    nextOwner: 'Point operator',
    summary: 'Parcel left courier delivery and now waits for point acceptance.',
    checkpoint: 'The operator handoff changes from courier team to point team.',
  },
  AWAITING_PICKUP: {
    lane: 'PICKUP',
    title: 'Waiting for customer pickup',
    owner: 'Point operator',
    nextOwner: 'Recipient',
    summary: 'Point or locker owns the final release and can manage offline checkout if needed.',
    checkpoint: 'This is the last assisted handoff before completion.',
  },
  RETURNED: {
    lane: 'EXCEPTION',
    title: 'Returned to sender',
    owner: 'Returns team',
    nextOwner: 'Sender support',
    summary: 'The normal pickup or delivery flow ended and parcel entered reverse logistics.',
    checkpoint: 'Use for non-happy-path demo endings and warehouse exception review.',
  },
  DELIVERED: {
    lane: 'DONE',
    title: 'Recipient handoff done',
    owner: 'Archive',
    nextOwner: 'Archive',
    summary: 'No more active operator handoffs remain.',
    checkpoint: 'Natural ending for point pickup or courier delivery storyline.',
  },
};

export function getLaneCount(parcels: AdminParcelRecord[], metaByStatus: Record<string, DemoStoryStageMeta>, lane: DemoStoryStageMeta['lane']) {
  return parcels.filter((parcel) => metaByStatus[parcel.status]?.lane === lane).length;
}
