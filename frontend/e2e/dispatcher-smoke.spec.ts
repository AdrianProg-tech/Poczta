import { expect, test } from '@playwright/test';
import { expectTexts, loginAsDemoRole } from './helpers';

test('dispatcher scope can open shipments board and hidden transit labs', async ({ page }) => {
  await loginAsDemoRole(page, 'dispatcher');

  await page.goto('/admin/shipments');
  await expect(page.getByRole('heading', { name: 'Operacyjny board przesylek' })).toBeVisible();
  await expectTexts(page, ['Do przydzialu kuriera', 'Punktowe handoffy']);

  await page.goto('/admin/demo/transit');
  await expect(page.getByRole('heading', { name: 'Laboratorium tranzytu' })).toBeVisible();
  await expect(page.getByText('Historia tranzytu', { exact: false })).toBeVisible();

  await page.goto('/admin/demo/handover');
  await expect(page.getByRole('heading', { name: 'Laboratorium przekazan' })).toBeVisible();
  await expect(page.getByText('Historia przekazan', { exact: false })).toBeVisible();
});
