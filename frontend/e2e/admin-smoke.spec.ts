import { expect, test } from '@playwright/test';
import { expectTexts, loginAsDemoRole } from './helpers';

test('admin console exposes demo labs and points operations module', async ({ page }) => {
  await loginAsDemoRole(page, 'admin');

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Panel operacyjny' })).toBeVisible();
  await expectTexts(page, ['Open demo lab', 'Open locker lab', 'Open transit lab', 'Open handover lab']);

  await page.goto('/admin/points');
  await expect(page.getByRole('heading', { name: 'Points operations view' })).toBeVisible();
  await expectTexts(page, ['Queue load', 'Owner readiness', 'Quick ops links']);
});
