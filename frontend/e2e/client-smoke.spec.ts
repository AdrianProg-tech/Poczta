import { expect, test } from '@playwright/test';
import { expectTexts, loginAsDemoRole } from './helpers';

test('client shipments page exposes list-level quick actions and summaries', async ({ page }) => {
  await loginAsDemoRole(page, 'client');

  await page.goto('/client/shipments');

  await expect(page.getByRole('heading', { name: 'All shipments' })).toBeVisible();
  await expectTexts(page, ['Awaiting payment', 'Can redirect', 'Complaint', 'Print']);
  await expect(page.locator('tbody tr').first()).toBeVisible();
});
