import { Page } from '@playwright/test';

export async function loginPedidos(page: Page, user?: string, pass?: string) {
  const username = user || process.env.PEDIDOS_USER;
  const password = pass || process.env.PEDIDOS_PASS;
  if (!username || !password) {
    throw new Error('PEDIDOS_USER and PEDIDOS_PASS must be set in .env or passed as arguments');
  }
  await page.goto('/#/pages/signin');
  await page.getByPlaceholder('Login').fill(username);
  await page.getByPlaceholder('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForLoadState('networkidle');
}
