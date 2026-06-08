import { expect, test } from '@playwright/test';
import { expectTexts, loginAsDemoRole } from './helpers';

test('point dashboard and operational queues expose bulk ergonomics', async ({ page }) => {
  await loginAsDemoRole(page, 'point');

  await page.goto('/point');
  await expect(page.getByRole('heading', { name: 'Pickup point panel' })).toBeVisible();
  await expectTexts(page, ['Print shift report', 'Export queue CSV']);

  await page.goto('/point/accept');
  await expect(page.getByRole('heading', { name: 'Accept and post onward' })).toBeVisible();
  await expectTexts(page, ['Accept selected', 'Post selected onward']);

  await page.goto('/point/release');
  await expect(page.getByRole('heading', { name: 'Release parcel to client' })).toBeVisible();
  await expectTexts(page, ['Release selected']);

  await page.goto('/point/payment-verification');
  await expect(page.getByRole('heading', { name: 'Offline payment confirmation' })).toBeVisible();
  await expectTexts(page, ['Confirm selected payments', 'Collect + release selected']);
});
