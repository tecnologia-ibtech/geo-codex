import { test, expect } from '@playwright/test';
import { loginIGS } from '../fixtures/auth';
import {
  btnSpan,
  btnSpanNumber,
  btnSim,
  validaIntegracao,
} from '../fixtures/navigation';

test.describe('Importacao de Clientes', () => {
  test.beforeEach(async ({ page }) => {
    await loginIGS(page);
  });

  test('importa clientes via tela de integracao @e2e', async ({ page }) => {
    // Verificar que GEOvendas esta visivel
    await expect(page.locator("//span[normalize-space()='GEOvendas']")).toBeVisible();

    // Navegar ate Integracao
    await btnSpan(page, 'GEOvendas', 2000);
    await btnSpan(page, 'Configurações', 2000);
    await btnSpan(page, 'Integração', 7000);

    // Clicar no botao de importacao de clientes (span index 69)
    await btnSpanNumber(page, 69, 10000);
    await btnSim(page);

    // Validar integracao (polling ate 30 min)
    await validaIntegracao(page);
    await page.waitForTimeout(3000);
  });
});
