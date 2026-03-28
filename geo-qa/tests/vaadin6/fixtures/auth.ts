import { Page } from '@playwright/test';

export async function loginIGS(page: Page, user?: string, pass?: string) {
  const username = user || process.env.VAADIN6_USER;
  const password = pass || process.env.VAADIN6_PASS;
  if (!username || !password) {
    throw new Error('VAADIN6_USER and VAADIN6_PASS must be set in .env or passed as arguments');
  }
  await page.goto('/');
  await page.getByLabel('Login').fill(username);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForLoadState('networkidle');
}
