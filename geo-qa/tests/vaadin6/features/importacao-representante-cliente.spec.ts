import { test, expect } from '@playwright/test';
import { loginIGS } from '../fixtures/auth';
import {
  btnSpan,
  btnSpanNumber,
  btnSim,
  validaIntegracao,
} from '../fixtures/navigation';

test.describe('Importacao de Representante-Cliente', () => {
  test.beforeEach(async ({ page }) => {
    await loginIGS(page);
  });

  test('importa representantes dos clientes via tela de integracao @e2e', async ({ page }) => {
    // Verificar que GEOvendas esta visivel
    await expect(page.locator("//span[normalize-space()='GEOvendas']")).toBeVisible();

    // Navegar ate Integracao
    await btnSpan(page, 'GEOvendas', 2000);
    await btnSpan(page, 'Configurações', 2000);
    await btnSpan(page, 'Integração', 7000);

    // Clicar no botao de importacao de representantes dos clientes (span index 53)
    await btnSpanNumber(page, 53, 5000);

    // Confirmar importacao
    await btnSim(page);

    // Validar integracao (polling ate 30 min)
    await validaIntegracao(page);
    await page.waitForTimeout(3000);
  });
});
