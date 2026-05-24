import { expect, test } from '@playwright/test';
import { expectTexts, loginAsDemoRole } from './helpers';

test('admin console exposes demo labs and points operations module', async ({ page }) => {
  await loginAsDemoRole(page, 'admin');

  await page.goto('/admin');
  await expect(page.locator('h1', { hasText: 'Panel operacyjny' })).toBeVisible();
  await expectTexts(page, [
    'Otworz laboratorium demo',
    'Otworz laboratorium skrytek',
    'Otworz laboratorium tranzytu',
    'Otworz laboratorium przekazan',
  ]);

  await page.goto('/admin/points');
  await expect(page.getByRole('heading', { name: 'Widok operacyjny punktow' })).toBeVisible();
  await expectTexts(page, ['Obciazenie kolejki', 'Gotowosc operatorow', 'Szybkie przejscia operacyjne']);
});
