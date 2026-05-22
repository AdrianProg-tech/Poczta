import { expect, type Page } from '@playwright/test';

export type DemoRole = 'client' | 'courier' | 'point' | 'admin' | 'dispatcher';

const roleLabels: Record<DemoRole, string> = {
  client: 'Klient',
  courier: 'Kurier',
  point: 'Punkt',
  admin: 'Administrator',
  dispatcher: 'Dyspozytor',
};

const dashboardPaths: Record<DemoRole, string> = {
  client: '/client',
  courier: '/courier',
  point: '/point',
  admin: '/admin',
  dispatcher: '/admin',
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function loginAsDemoRole(page: Page, role: DemoRole) {
  const roleLabel = roleLabels[role];
  const dashboardPath = dashboardPaths[role];

  await page.goto('/login');
  await expect(page.getByRole('button', { name: new RegExp(`^${escapeRegExp(roleLabel)}`) })).toBeVisible();
  await page.getByRole('button', { name: new RegExp(`^${escapeRegExp(roleLabel)}`) }).click();
  await page.getByRole('button', { name: `Zaloguj jako ${roleLabel}` }).click();
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(dashboardPath)}(?:$|/)`));
}

export async function expectTexts(page: Page, texts: string[]) {
  for (const text of texts) {
    await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
  }
}
