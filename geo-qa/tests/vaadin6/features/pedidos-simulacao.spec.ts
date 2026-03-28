import { test, expect } from '@playwright/test';
import { loginIGS } from '../fixtures/auth';
import {
  btnSpan,
  btnSim,
  verificaExistencia,
} from '../fixtures/navigation';

test.describe('Pedidos Clientes Pendentes - Simulacao', () => {
  test.beforeEach(async ({ page }) => {
    await loginIGS(page);
  });

  test('simula envio de pedido @e2e', async ({ page }) => {
    // Navegar ate Pedidos/Clientes Pendentes
    await btnSpan(page, 'Força de Vendas', 2000);
    await btnSpan(page, 'Pedidos/Clientes Pendentes', 7000);

    // Verificar se esta liberado para o ERP e bloquear envio
    if (await verificaExistencia(page, "//span[contains(text(),'Bloquear envio de pedidos ao ERP')]")) {
      await btnSpan(page, 'Bloquear envio de pedidos ao ERP', 2000);
      await btnSim(page);
    }

    // Entrar na guia Enviados
    await page.locator("//div[contains(text(),'Enviados')]").click();
    await page.waitForTimeout(2000);

    // Consultar pedidos
    await btnSpan(page, 'Consultar', 5000);

    // Detalhar primeiro pedido
    await page.locator("(//tbody[1]/tr[1]/td[14]/div[1]/div[1]/img[1])[last()]").click();
    await page.waitForTimeout(15000);

    // Simular envio do pedido
    await page.locator("//span[contains(text(),'Simular envio pedido')]").click();

    // Verificar que a simulacao esta presente
    const simulacaoExists = await verificaExistencia(page, "(//div[contains(text(),'col1')])[1]");
    expect(simulacaoExists).toBeTruthy();

    await page.waitForTimeout(20000);
  });
});
