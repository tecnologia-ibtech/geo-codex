import { test, expect } from '@playwright/test';
import { loginIGS } from '../fixtures/auth';
import {
  btnSpan,
  btnSpanNumber,
  btnSim,
  btnNotificacao,
  verificaExistencia,
  aguardarAteElementoSumir,
} from '../fixtures/navigation';

test.describe('Importacao de Vendas', () => {
  test.beforeEach(async ({ page }) => {
    await loginIGS(page);
  });

  test('importa vendas1 via tela de integracao @e2e', async ({ page }) => {
    // Verificar que GEOvendas esta visivel
    await expect(page.locator("//span[normalize-space()='GEOvendas']")).toBeVisible();

    // Navegar ate Integracao
    await btnSpan(page, 'GEOvendas', 0);
    await btnSpan(page, 'Configurações', 0);
    await btnSpan(page, 'Integração', 7000);

    // Fechar notificacao de erro de conexao se existir
    if (await verificaExistencia(page, "//p[normalize-space()='java.net.UnknownHostException: dotnet-stockcentral']")) {
      await btnNotificacao(page, 'java.net.UnknownHostException: dotnet-stockcentral', 4000);
    }

    // Clicar no botao de importacao de vendas (span index 150)
    await btnSpanNumber(page, 150, 5000);

    // Confirmar importacao
    await btnSim(page);

    // Aguardar elemento de importacao sumir (ate 20 minutos)
    await aguardarAteElementoSumir(page, "(//div[contains(text(),'Importação de Vendas1')])[last()]", 20);

    // Verificar se houve erro na integracao
    const isErroIntegracao = await verificaExistencia(page, "(//div[@class='v-Notification error v-Notification-error'])[last()]");
    expect(isErroIntegracao).toBeFalsy();
  });
});
