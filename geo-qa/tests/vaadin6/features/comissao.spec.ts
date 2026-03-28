import { test, expect } from '@playwright/test';
import { loginIGS } from '../fixtures/auth';
import {
  btnSpan,
  btnSim,
  verificaExistencia,
  divContains,
  aguardarAte,
} from '../fixtures/navigation';

const FV_URL = process.env.FV_URL || 'http://localhost:9000';

test.describe('Comissao', () => {
  test.beforeEach(async ({ page }) => {
    await loginIGS(page);
  });

  test('calcula comissao do pedido via FV @e2e', async ({ page }) => {
    // Bloquear envio de pedidos ao ERP
    await btnSpan(page, 'Força de Vendas', 2000);
    await btnSpan(page, 'Pedidos/Clientes Pendentes', 7000);

    if (await verificaExistencia(page, "//span[contains(text(),'Bloquear envio de pedidos ao ERP')]")) {
      await btnSpan(page, 'Bloquear envio de pedidos ao ERP', 2000);
      await btnSim(page);
    }

    // Acessar Forca de Vendas
    await page.goto(FV_URL);
    await page.waitForLoadState('networkidle');

    // Login no FV
    await page.locator("//input[@id='cpLogin']").fill('rep57831');
    await page.waitForTimeout(500);
    await page.locator("//input[@id='cpPassword']").fill('kaiani2021');
    await page.waitForTimeout(500);
    await page.locator("//button[@class='btn btn-primary btn-lg btn-block ng-scope']").click();
    await aguardarAte(page, "(//button[@type='button'][normalize-space()='Sincronizar Selecionados'])[1]", 1);

    // Clicar no botao de Integracao
    await page.locator("//i[@class='fa fa-refresh']").click();
    await page.waitForTimeout(3000);

    // Desmarcar integracoes de pedidos
    await page.locator("(//span[contains(., 'Envio de pedidos prontos')])").click();
    await page.waitForTimeout(300);
    await page.locator("(//span[contains(., 'Atualização dos pedidos enviados')])").click();
    await page.waitForTimeout(300);

    // Sincronizar
    await page.locator("(//button[@type='button'][normalize-space()='Sincronizar Selecionados'])[1]").click();
    await page.waitForTimeout(4000);
    await page.locator("(//span[contains(., 'Sincronizando...')])").waitFor({ state: 'hidden', timeout: 10 * 60_000 });
    await page.waitForTimeout(1500);

    await page.waitForTimeout(5000);

    // Dashboard -> Novo Pedido
    await page.locator("//i[@class='fa fa-dashboard']").click();
    await page.waitForTimeout(3000);

    await page.locator("(//button[contains(., 'Novo Pedido')])[1]").click();
    await page.waitForTimeout(2000);

    // Selecionar tabela de preco
    const selectTabPreco = page.locator('(//select)[1]');
    await selectTabPreco.click();
    await page.waitForTimeout(700);
    await page.locator("(//select)[1]//option[contains(., '20260101')]").click();
    await page.waitForTimeout(2000);

    // Adicionar itens ao pedido
    await page.locator("//input[@id='cpQtdeProduto2']").fill('120');
    await page.waitForTimeout(2000);
    await page.locator("(//button[contains(., 'Adicionar')])[3]").click();
    await page.waitForTimeout(2000);

    // Guia Revisao
    await page.keyboard.press('PageUp');
    await page.waitForTimeout(1000);
    await page.locator("(//a[normalize-space()='Revisão'])[1]").click();
    await page.waitForTimeout(2000);

    // Guia Geral
    await page.keyboard.press('PageUp');
    await page.waitForTimeout(1000);
    await page.locator("(//a[normalize-space()='Geral'])[1]").click();
    await page.waitForTimeout(2000);

    // Adicionar cliente ao pedido
    await page.locator("//input[@id='cpCodCliente']").fill('60541');
    await page.waitForTimeout(1000);
    await page.locator("//input[@id='cpCondPagto']").fill('1');
    await page.waitForTimeout(1000);

    // Guia Anexo
    await page.keyboard.press('PageUp');
    await page.waitForTimeout(1000);
    await page.locator("(//a[normalize-space()='Anexo'])[1]").click();
    await page.waitForTimeout(2000);

    // Finalizar e sincronizar pedido
    await page.keyboard.press('PageUp');
    await page.waitForTimeout(1000);
    await page.locator("(//a[normalize-space()='Finalização'])[1]").click();
    await page.waitForTimeout(2000);
    await page.locator("(//button[contains(., 'Finalizar')])[1]").click();
    await page.waitForTimeout(2000);
    await page.locator("(//button[contains(., 'Sim')])[1]").click();
    await page.waitForTimeout(2000);
    await page.locator("(//div[contains(text(),'Pronto')])[1]").click();
    await page.waitForTimeout(5000);

    await page.locator("(//button[contains(., 'Sincronizar')])[1]").click();
    await page.waitForTimeout(2000);
    await page.locator("(//button[contains(., 'Sim')])[1]").click();
    await page.waitForTimeout(2000);
    await page.waitForTimeout(30000);
    await aguardarAte(page, "//span[normalize-space()='Detalhar Pedido - Enviado']", 3);

    // Voltar ao IGS
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await loginIGS(page);

    // Clicar em Enviados
    await page.locator("//div[contains(text(),'Enviados')]").click();
    await page.waitForTimeout(2000);

    // Consultar pedidos
    await btnSpan(page, 'Consultar', 5000);

    // Detalhar primeiro pedido
    await page.locator("(//table//tr[1]/td[14]//img)[last()]").click();
    await page.waitForTimeout(5000);

    // Calcular Comissao
    await btnSpan(page, 'Calcular Comissão', 2000);

    // Verificar resultado da comissao
    const comissao = page.locator("(//h1[contains(text(),'Comissão calculada de acordo com as políticas comerciais atuais foi: 11,00')])[1]");
    await expect(comissao).toBeVisible({ timeout: 10000 });
  });
});
