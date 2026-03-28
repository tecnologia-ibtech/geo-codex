import { test, expect } from '@playwright/test';
import { loginIGS } from '../fixtures/auth';
import {
  btnSpan,
  btnSim,
  verificaExistencia,
} from '../fixtures/navigation';

test.describe('Pedidos Clientes Pendentes - Impressao', () => {
  test.beforeEach(async ({ page }) => {
    await loginIGS(page);
  });

  test('imprime pedido detalhado e resumido @e2e', async ({ page, context }) => {
    // Verificar que GEOvendas esta visivel
    await expect(page.locator("//span[normalize-space()='GEOvendas']")).toBeVisible();

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
    await page.locator("(//tbody[1]/tr[1]/td[14]/div[1])[5]").click();
    await page.waitForTimeout(5000);

    // Impressao detalhada - esperar nova pagina
    const [detailedPage] = await Promise.all([
      context.waitForEvent('page'),
      page.locator("(//span[contains(text(),'Imprimir Detalhado')])[1]").click(),
    ]);
    await detailedPage.waitForLoadState();
    await page.waitForTimeout(6000);

    // Verificar que botao Imprimir existe
    const imprimirExists = await verificaExistencia(page, "(//span[contains(text(),'Imprimir')])");
    expect(imprimirExists).toBeTruthy();
    await page.waitForTimeout(3000);

    // Fechar a janela de impressao detalhada
    await detailedPage.locator("//span[contains(text(),'Fechar')]").click();
    await page.waitForTimeout(3000);

    // Voltar para a janela original
    await page.bringToFront();
    await page.waitForTimeout(2000);

    // Impressao resumida
    await page.locator("//span[normalize-space()='Imprimir']").click();
    const imprimirResumidoExists = await verificaExistencia(page, "(//span[contains(text(),'Imprimir')])");
    expect(imprimirResumidoExists).toBeTruthy();
    await page.waitForTimeout(5000);

    // Fechar a nova guia de impressao resumida
    const pages = context.pages();
    const printPage = pages.find(p => p !== page);
    if (printPage) {
      await printPage.close();
    }

    // Voltar para a janela original
    await page.bringToFront();
  });
});
