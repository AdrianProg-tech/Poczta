import { expect, test } from '@playwright/test';
import { expectTexts, loginAsDemoRole } from './helpers';

test('point dashboard and operational queues expose bulk ergonomics', async ({ page }) => {
  await loginAsDemoRole(page, 'point');

  await page.goto('/point');
  await expect(page.getByRole('heading', { name: 'Panel punktu odbioru' })).toBeVisible();
  await expectTexts(page, ['Drukuj raport zmiany', 'Eksportuj CSV kolejek']);

  await page.goto('/point/accept');
  await expect(page.getByRole('heading', { name: 'Przyjecie i nadanie dalej' })).toBeVisible();
  await expectTexts(page, ['Przyjmij zaznaczone', 'Nadaj zaznaczone dalej']);

  await page.goto('/point/release');
  await expect(page.getByRole('heading', { name: 'Wydanie paczki klientowi' })).toBeVisible();
  await expectTexts(page, ['Wydaj zaznaczone']);

  await page.goto('/point/payment-verification');
  await expect(page.getByRole('heading', { name: 'Potwierdzenie platnosci offline' })).toBeVisible();
  await expectTexts(page, ['Potwierdz zaznaczone platnosci', 'Pobierz + wydaj zaznaczone']);
});
