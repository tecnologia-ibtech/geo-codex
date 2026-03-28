import { Page } from '@playwright/test';

export async function loginCRM360(page: Page, user?: string, pass?: string) {
  const username = user || process.env.VAADIN24_USER;
  const password = pass || process.env.VAADIN24_PASS;
  if (!username || !password) {
    throw new Error('VAADIN24_USER and VAADIN24_PASS must be set in .env or passed as arguments');
  }
  await page.goto('/');
  await page.getByLabel('Login').fill(username);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForLoadState('networkidle');
}
