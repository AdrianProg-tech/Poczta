import { describe, expect, it } from 'vitest';
import { demoRoleOptions, type PointQueueResponse } from '../app/api';
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
