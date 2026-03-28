import { test, expect } from '@playwright/test';
import { loginIGS } from '../fixtures/auth';
import {
  btnSpan,
  verificaExistencia,
} from '../fixtures/navigation';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginIGS(page);
  });

  test('exibe dashboard de contrato de resultados com representante @e2e', async ({ page }) => {
    // Verificar que GEOvendas esta visivel
    await expect(page.locator("//span[normalize-space()='GEOvendas']")).toBeVisible();

    // Navegar ate Dashboard
    await btnSpan(page, 'Analytics - Contrato de Resultados', 500);
    await btnSpan(page, 'Dashboard', 500);
    await page.waitForTimeout(5000);

    // Expandir representante DALTON
    await page.locator("(//span[contains(text(),'DALTON')])[1]").click();
    await page.waitForTimeout(2000);

    // Verificar se Meta em Reais ate hoje esta presente
    const metaExists = await verificaExistencia(page, "(//center[normalize-space()='Meta em Reais até hoje'])[1]");
    expect(metaExists).toBeTruthy();
  });
});
