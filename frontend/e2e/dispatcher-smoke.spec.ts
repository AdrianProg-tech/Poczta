import { expect, test } from '@playwright/test';
import { expectTexts, loginAsDemoRole } from './helpers';

test('dispatcher scope can open shipments board and hidden transit labs', async ({ page }) => {
  await loginAsDemoRole(page, 'dispatcher');

  await page.goto('/admin/shipments');
  await expect(page.getByRole('heading', { name: 'Shipment board' }).first()).toBeVisible();
  await expectTexts(page, ['Awaiting courier assignment', 'Point handoffs']);

  await page.goto('/admin/demo/transit');
  await expect(page.getByRole('heading', { name: 'Centrum sortowania' }).first()).toBeVisible();
  await expect(page.getByText('Przeglad tras', { exact: false })).toBeVisible();

  await page.goto('/admin/demo/handover');
  await expect(page.getByRole('heading', { name: 'Laboratorium przekazan' }).first()).toBeVisible();
  await expect(page.getByText('Historia przekazan', { exact: false })).toBeVisible();
});
