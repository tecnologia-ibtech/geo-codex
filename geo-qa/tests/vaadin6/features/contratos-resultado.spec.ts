import { test, expect } from '@playwright/test';
import { loginIGS } from '../fixtures/auth';
import {
  btnSpan,
  btnSim,
  aguardarAte,
  verificaExistencia,
} from '../fixtures/navigation';

test.describe('Contratos de Resultado', () => {
  test.beforeEach(async ({ page }) => {
    await loginIGS(page);
  });

  test('reabrir, liberar e calcular contrato de resultado @e2e', async ({ page }) => {
    // Verificar que GEOvendas esta visivel
    await expect(page.locator("//span[normalize-space()='GEOvendas']")).toBeVisible();

    // Navegar ate Contratos
    await btnSpan(page, 'Analytics - Contrato de Resultados', 500);
    await btnSpan(page, 'Configuração', 500);
    await btnSpan(page, 'Contratos', 500);

    // Ordenar por Situacao
    await page.locator("(//div[normalize-space()='Situação'])[1]").click();
    await page.waitForTimeout(5000);

    // Editar contrato
    await page.locator('(//img)[8]').click();
    await page.waitForTimeout(5000);

    // Reabrir contrato
    await btnSpan(page, 'Reabrir', 500);

    // Liberar contrato
    await btnSpan(page, 'Liberar', 500);

    // Calcular contrato
    await btnSpan(page, 'Calcular', 500);
    await btnSim(page);

    // Aguardar integracao com sucesso
    await aguardarAte(page, "(//h1[normalize-space()='Integração foi realizada com sucesso'])[1]", 10);

    // Verificar se o contrato esta encerrado (botao Reabrir presente)
    const reabrirExists = await verificaExistencia(page, "//span[contains(text(),'Reabrir')]");
    expect(reabrirExists).toBeTruthy();
  });
});
