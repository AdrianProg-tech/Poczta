import { expect, type Page } from '@playwright/test';

export type DemoRole = 'client' | 'courier' | 'point' | 'admin' | 'dispatcher';

const roleLabels: Record<DemoRole, string> = {
  client: 'Klient',
  courier: 'Kurier',
  point: 'Punkt',
  admin: 'Administrator',
  dispatcher: 'Dyspozytor',
};

const roleEmails: Record<DemoRole, string> = {
  client: 'jan.kowalski.client@example.com',
  courier: 'courier.warsaw.1@example.com',
  point: 'point.warsaw.pop-waw-01@example.com',
  admin: 'admin.review@example.com',
  dispatcher: 'ops.dispatch@example.com',
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
  const email = roleEmails[role];

  await page.goto('/login');
  const roleButton = page.getByRole('button', { name: new RegExp(`^${escapeRegExp(roleLabel)}`) });
  if (await roleButton.count()) {
    await expect(roleButton.first()).toBeVisible();
    await roleButton.first().click();
  }
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill('demo1234');
  await page.getByRole('button', { name: /Zaloguj/i }).last().click();
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(dashboardPath)}(?:$|/)`));
}

export async function expectTexts(page: Page, texts: string[]) {
  for (const text of texts) {
    await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
  }
}
