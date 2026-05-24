import { getHandoverDemoParcels, getLaneCount, getTransitDemoParcels, handoverStoryMeta, transitStoryMeta } from '../app/adminDemoFlows';
import { describe, expect, it } from 'vitest';
import { demoRoleOptions, type PointQueueResponse } from '../app/api';
import { canCancelPayment, canFailPayment, canMarkPaymentPaid, getPaymentOpsOwner } from '../app/pages/AdminPayments';
import { getPointQueueLoad, getPointReadinessLabel } from '../app/pages/AdminPoints';
import { canShowPaymentShortcut, canShowRedirectShortcut } from '../app/pages/ClientShipments';
import {
  buildPointQueueCsv,
  filterPointQueueItems,
  getPointQueueItemKey,
  getPointQueueStats,
  getSelectedPointQueueItems,
  prunePointQueueSelection,
} from '../app/pointQueue';

describe('demoRoleOptions', () => {
  it('includes a dispatcher preset mapped onto the admin shell', () => {
    expect(demoRoleOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'dispatcher',
          role: 'admin',
          defaultEmail: 'ops.dispatch@example.com',
        }),
      ]),
    );
  });
});

describe('getPointQueueStats', () => {
  it('returns dedicated point workflow routes with live queue counts', () => {
    const queue = {
      acceptQueue: [{ trackingNumber: 'A' }],
      pickupQueue: [{ trackingNumber: 'B' }, { trackingNumber: 'C' }],
      offlinePaymentQueue: [{ trackingNumber: 'D' }, { trackingNumber: 'E' }, { trackingNumber: 'F' }],
    } as PointQueueResponse;

    expect(getPointQueueStats(queue)).toEqual([
      expect.objectContaining({ key: 'accept', path: '/point/accept', value: 1 }),
      expect.objectContaining({ key: 'pickup', path: '/point/release', value: 2 }),
      expect.objectContaining({ key: 'offline', path: '/point/payment-verification', value: 3 }),
    ]);
  });
});

describe('filterPointQueueItems', () => {
  it('matches tracking number, recipient name, and payment id from a manual scan query', () => {
    const items = [
      {
        trackingNumber: 'PW-123',
        recipientName: 'Jan Kowalski',
        paymentId: 'pay-111',
        queueType: 'OFFLINE_PAYMENT',
        shipmentStatus: 'CREATED',
        paymentStatus: 'OFFLINE_PENDING',
      },
      {
        trackingNumber: 'PW-456',
        recipientName: 'Anna Nowak',
        paymentId: 'pay-222',
        queueType: 'PICKUP',
        shipmentStatus: 'AWAITING_PICKUP',
        paymentStatus: 'PAID',
      },
    ] as PointQueueResponse['offlinePaymentQueue'];

    expect(filterPointQueueItems(items, 'pw-123')).toHaveLength(1);
    expect(filterPointQueueItems(items, 'kowalski')).toHaveLength(1);
    expect(filterPointQueueItems(items, 'pay-222')).toHaveLength(1);
    expect(filterPointQueueItems(items, 'missing')).toHaveLength(0);
  });
});

describe('point queue selection helpers', () => {
  const items = [
    {
      trackingNumber: 'PW-123',
      recipientName: 'Jan Kowalski',
      paymentId: null,
      queueType: 'PICKUP',
      shipmentStatus: 'AWAITING_PICKUP',
      paymentStatus: 'PAID',
    },
    {
      trackingNumber: 'PW-456',
      recipientName: 'Anna Nowak',
      paymentId: 'pay-222',
      queueType: 'OFFLINE_PAYMENT',
      shipmentStatus: 'CREATED',
      paymentStatus: 'OFFLINE_PENDING',
    },
  ] as PointQueueResponse['offlinePaymentQueue'];

  it('builds stable keys from tracking number or payment id', () => {
    expect(getPointQueueItemKey(items[0])).toBe('PW-123-PICKUP');
    expect(getPointQueueItemKey(items[1])).toBe('pay-222-OFFLINE_PAYMENT');
  });

  it('returns only selected visible records and prunes stale selections', () => {
    const selected = new Set(['PW-123-PICKUP', 'pay-222-OFFLINE_PAYMENT', 'missing-key']);

    expect(getSelectedPointQueueItems(items, selected)).toHaveLength(2);
    expect([...prunePointQueueSelection(items, selected)]).toEqual(['PW-123-PICKUP', 'pay-222-OFFLINE_PAYMENT']);
  });

  it('builds csv output for shift exports with escaped values', () => {
    const csv = buildPointQueueCsv(items);

    expect(csv).toContain('trackingNumber,recipientName,queueType,shipmentStatus,paymentStatus,paymentId,createdAt,expiresAt');
    expect(csv).toContain('"PW-123","Jan Kowalski","Do wydania","AWAITING_PICKUP","PAID","","",""');
    expect(csv).toContain('"PW-456","Anna Nowak","Offline payment","CREATED","OFFLINE_PENDING","pay-222","",""');
  });
});

describe('admin demo flow filters', () => {
  const parcels = [
    { id: '1', status: 'READY_FOR_POSTING', deliveryType: 'COURIER', createdAt: '2026-05-22T10:00:00Z' },
    { id: '2', status: 'IN_TRANSIT', deliveryType: 'COURIER', createdAt: '2026-05-22T11:00:00Z' },
    { id: '3', status: 'REDIRECTED_TO_PICKUP', deliveryType: 'PICKUP_POINT', createdAt: '2026-05-22T12:00:00Z' },
    { id: '4', status: 'DELIVERED', deliveryType: 'COURIER', createdAt: '2026-05-22T09:00:00Z' },
    { id: '5', status: 'DELIVERY_ATTEMPT', deliveryType: 'COURIER', createdAt: '2026-05-22T13:00:00Z' },
    { id: '6', status: 'RETURNED', deliveryType: 'COURIER', createdAt: '2026-05-22T08:00:00Z' },
  ] as any[];

  it('keeps only transit-friendly parcels in descending created order', () => {
    expect(getTransitDemoParcels(parcels).map((parcel) => parcel.id)).toEqual(['5', '2', '1', '6']);
  });

  it('keeps only handover-friendly parcels in descending created order', () => {
    expect(getHandoverDemoParcels(parcels).map((parcel) => parcel.id)).toEqual(['5', '3', '2', '1', '6']);
  });

  it('counts parcels per storytelling lane', () => {
    const transitParcels = getTransitDemoParcels(parcels);
    const handoverParcels = getHandoverDemoParcels(parcels);

    expect(getLaneCount(transitParcels, transitStoryMeta, 'WAREHOUSE')).toBe(1);
    expect(getLaneCount(transitParcels, transitStoryMeta, 'LINEHAUL')).toBe(1);
    expect(getLaneCount(transitParcels, transitStoryMeta, 'EXCEPTION')).toBe(2);

    expect(getLaneCount(handoverParcels, handoverStoryMeta, 'PICKUP')).toBe(1);
    expect(getLaneCount(handoverParcels, handoverStoryMeta, 'EXCEPTION')).toBe(2);
  });
});

describe('client shipment quick actions', () => {
  it('shows payment shortcut only for pending payments', () => {
    expect(canShowPaymentShortcut({ paymentStatus: 'PENDING' } as any)).toBe(true);
    expect(canShowPaymentShortcut({ paymentStatus: 'PAID' } as any)).toBe(false);
  });

  it('hides redirect shortcut for terminal and pickup states', () => {
    expect(canShowRedirectShortcut({ currentStatus: 'CREATED' } as any)).toBe(true);
    expect(canShowRedirectShortcut({ currentStatus: 'AWAITING_PICKUP' } as any)).toBe(false);
    expect(canShowRedirectShortcut({ currentStatus: 'DELIVERED' } as any)).toBe(false);
  });
});

describe('admin points readiness helpers', () => {
  it('computes readiness and queue load from operators and queue presence', () => {
    const rowWithoutOperator = {
      point: { active: true },
      operators: [],
      queue: null,
    } as any;
    const rowReady = {
      point: { active: true },
      operators: [{ userId: '1' }],
      queue: {
        acceptQueue: [{ trackingNumber: 'A' }],
        pickupQueue: [{ trackingNumber: 'B' }, { trackingNumber: 'C' }],
        offlinePaymentQueue: [],
      },
    } as any;

    expect(getPointReadinessLabel(rowWithoutOperator)).toBe('Brak operatora');
    expect(getPointReadinessLabel(rowReady)).toBe('Gotowy operacyjnie');
    expect(getPointQueueLoad(rowReady)).toBe(3);
  });
});

describe('admin payments ops helpers', () => {
  it('routes pending payments to the right operational owner', () => {
    expect(getPaymentOpsOwner({ method: 'ONLINE', status: 'PENDING' } as any)).toBe('FINANCE');
    expect(getPaymentOpsOwner({ method: 'OFFLINE_AT_POINT', status: 'OFFLINE_PENDING' } as any)).toBe('POINT');
    expect(getPaymentOpsOwner({ method: 'OFFLINE_AT_COURIER', status: 'OFFLINE_PENDING' } as any)).toBe('COURIER');
    expect(getPaymentOpsOwner({ method: 'OFFLINE_AT_COURIER', status: 'OFFLINE_CONFIRMED' } as any)).toBe('ARCHIVE');
  });

  it('allows finance actions only for online pending payments', () => {
    const onlinePending = { method: 'ONLINE', status: 'PENDING' } as any;
    const courierPending = { method: 'OFFLINE_AT_COURIER', status: 'OFFLINE_PENDING' } as any;

    expect(canMarkPaymentPaid(onlinePending)).toBe(true);
    expect(canFailPayment(onlinePending)).toBe(true);
    expect(canCancelPayment(onlinePending)).toBe(true);

    expect(canMarkPaymentPaid(courierPending)).toBe(false);
    expect(canFailPayment(courierPending)).toBe(false);
    expect(canCancelPayment(courierPending)).toBe(true);
  });
});
