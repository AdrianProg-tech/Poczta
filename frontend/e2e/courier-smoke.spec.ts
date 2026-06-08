import { expect, test } from '@playwright/test';
import { expectTexts, loginAsDemoRole } from './helpers';

test('courier task board exposes batch controls and next-step guidance', async ({ page }) => {
  await loginAsDemoRole(page, 'courier');

  await page.goto('/courier/tasks');

  await expect(page.getByRole('heading', { name: 'Active tasks' })).toBeVisible();
  await expectTexts(page, [
    'Accept selected',
    'Start selected',
    'Deliver selected',
    'Save attempt + redirect for selected',
    'Next step',
  ]);
});
