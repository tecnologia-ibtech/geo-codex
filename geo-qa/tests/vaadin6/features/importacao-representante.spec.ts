import { test, expect } from '@playwright/test';
import { loginIGS } from '../fixtures/auth';
import {
  btnSpan,
  btnSpanNumber,
  btnSim,
  aguardarAte,
} from '../fixtures/navigation';

test.describe('Importacao de Representante', () => {
  test.beforeEach(async ({ page }) => {
    await loginIGS(page);
  });

  test('importa representantes via tela de integracao @e2e', async ({ page }) => {
    await page.waitForTimeout(20000);

    // Verificar que GEOvendas esta visivel
    await expect(page.locator("//span[normalize-space()='GEOvendas']")).toBeVisible();

    // Navegar ate Integracao
    await btnSpan(page, 'GEOvendas', 2000);
    await btnSpan(page, 'Configurações', 2000);
    await btnSpan(page, 'Integração', 7000);

    // Clicar no botao de importacao de representantes (span index 48)
    await btnSpanNumber(page, 48, 2000);
    await page.waitForTimeout(1000);

    // Confirmar importacao
    await btnSim(page);

    // Aguardar notificacao de sucesso
    await aguardarAte(page, "(//div[@class='v-Notification'])[1]", 30);
    await page.waitForTimeout(3000);
  });
});
