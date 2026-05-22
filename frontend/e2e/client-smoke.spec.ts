import { expect, test } from '@playwright/test';
import { expectTexts, loginAsDemoRole } from './helpers';

test('client shipments page exposes list-level quick actions and summaries', async ({ page }) => {
  await loginAsDemoRole(page, 'client');

  await page.goto('/client/shipments');

  await expect(page.getByRole('heading', { name: 'Lista przesylek' })).toBeVisible();
  await expectTexts(page, ['Czekaja na platnosc', 'Mozna przekierowac', 'Reklamacja', 'Drukuj']);
  await expect(page.locator('tbody tr').first()).toBeVisible();
});
