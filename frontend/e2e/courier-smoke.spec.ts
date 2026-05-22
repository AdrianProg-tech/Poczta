import { expect, test } from '@playwright/test';
import { expectTexts, loginAsDemoRole } from './helpers';

test('courier task board exposes batch controls and next-step guidance', async ({ page }) => {
  await loginAsDemoRole(page, 'courier');

  await page.goto('/courier/tasks');

  await expect(page.getByRole('heading', { name: 'Aktywne zadania' })).toBeVisible();
  await expectTexts(page, [
    'Przyjmij zaznaczone',
    'Rozpocznij zaznaczone',
    'Dorecz zaznaczone',
    'Zapisz probe + redirect dla zaznaczonych',
    'Nastepny krok',
  ]);
});
