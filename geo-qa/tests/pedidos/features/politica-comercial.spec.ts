import { test, expect, Page, FrameLocator } from '@playwright/test';
import { loginIGS } from '../../vaadin6/fixtures/auth';
import { loginPedidos } from '../fixtures/auth';
import {
  acessarMenu,
  acessarMenuConfigs,
  acessarIframe,
  btnSpan,
  btnSpanModalVaadin6,
  btnFecharMenus,
  clicarRegistroTabela,
  divContains,
  transformarStringEmNumber,
  verificaExistencia,
} from '../../vaadin6/fixtures/navigation';
import {
  sincronizar,
  desmarcarIntegracoesPedidos,
  inicializacaoPedido,
  finalizarSincronizarPedido,
  adicionarReferenciaCarrinho,
  guiasPedido,
  getIdPedido,
  bloquearEnvioPedidosERP,
  consultarPedidosEnviados,
  abrirPedidoPorId,
  btnFv,
  btnDashboardFv,
} from '../fixtures/navigation';
import {
  btnVaadin24,
  btnSalvarVaadin24,
  btnEditarVaadin24,
  campoInputVaadin24,
  campoInputVaadin24Index,
  flagVaadin24,
  valorFlagVaadin24,
} from '../../vaadin24/fixtures/navigation';

// ---------------------------------------------------------------------------
// Environment URLs
// ---------------------------------------------------------------------------

const IGS_BASE_URL = process.env.VAADIN6_BASE_URL || 'http://localhost:8080/IBTech_Geo/app';
const FV_BASE_URL = process.env.PEDIDOS_BASE_URL || 'http://localhost:9000';

// ---------------------------------------------------------------------------
// Inline helpers (functions not yet in shared fixtures)
// ---------------------------------------------------------------------------

/** Fill an input field identified by its HTML id. */
async function populaCampoInputPorId(page: Page, id: string, valor: string) {
  await page.locator(`//input[@id='${id}']`).fill(valor);
  await page.waitForTimeout(500);
}

/** Return the current value of an input field identified by its HTML id. */
async function retornarCampoInputPorId(page: Page, id: string): Promise<string> {
  const xpath = `//input[@id='${id}']`;
  const exists = await verificaExistencia(page, xpath);
  if (!exists) {
    throw new Error(`Nenhum campo input encontrado pelo xpath: ${xpath}`);
  }
  return await page.locator(xpath).inputValue();
}

/** Add multiple product references to the cart. */
async function adicionarVariasReferenciasCarrinho(
  page: Page,
  qtdReferencias: number,
  numColunas: number,
  numLinhas: number,
  valor: string,
) {
  for (let i = 1; i <= qtdReferencias; i++) {
    await adicionarReferenciaCarrinho(page, i, numColunas, numLinhas, valor);
  }
}

/** Format a numeric order ID with pt-BR thousand separators (e.g. 1.234). */
function formatarIdPedidoParaMilhar(idPedido: string): string {
  const num = parseInt(idPedido, 10);
  return num.toLocaleString('pt-BR');
}

/** Select the payment condition by average term. */
async function selecionarCondPagPorPrazoMedio(page: Page, prazoMedio: string) {
  await page.locator(
    `//div[normalize-space()='Condição de Pagamento *']//button//i[@class='fa fa-search']`,
  ).click();
  await page.waitForTimeout(1500);
  await page.locator(
    `((//tr//td[3])[contains(.,(//span[contains(text(),'${prazoMedio}')]))])[1]`,
  ).click();
  await page.waitForTimeout(2000);
}

/** Read the value of an input inside a named div (IGS order detail fields). */
async function buscarElementosEmDivInputValue(page: Page, nomeDiv: string): Promise<string> {
  const el = page.locator(`//div[normalize-space()='${nomeDiv}']//input`);
  return await el.inputValue();
}

// ---------------------------------------------------------------------------
// PoliticaComercial helpers (from PoliticaComercialTest.java)
// ---------------------------------------------------------------------------

/** Navigate to discount configuration in IGS (Vaadin 6 menus -> Vaadin 24 iframe). */
async function acessarConfigsDescontos(page: Page) {
  await btnSpan(page, 'Força de Vendas', 0);
  await btnSpan(page, 'Configuração', 0);
  await btnSpan(page, 'Geral', 10000);
  await acessarMenuConfigs(page, 'Política Comercial', 1000);
  await acessarMenu(page, 'Habilitação de Descontos', 7000);
  await page.waitForTimeout(10000);
}

/** Access the Vaadin 24 iframe for discount flags and return a FrameLocator. */
async function acessarConfigsVaadin24(page: Page): Promise<FrameLocator> {
  return await acessarIframe(page, 'habilitacao-descontos');
}

/** Navigate to the commercial policy for a given price table code. */
async function acessarPoliticaComercial(page: Page, codTabelaPreco: string) {
  // Switch back to main content (exit any iframe)
  await page.mainFrame().locator('body').waitFor();
  await btnFecharMenus(page);
  await btnSpan(page, 'Força de Vendas', 0);
  await btnSpan(page, 'Tabela de Preço', 2000);
  await clicarRegistroTabela(page, codTabelaPreco, 2000);
  await btnSpan(page, 'Política Comercial', 5000);
}

/** Close the commercial policy modal. */
async function fecharPoliticaComercial(page: Page) {
  await divContains(page, 'Capa', 800);
  await btnSpanModalVaadin6(page, 'Sair', 1000);
}

/** Delete all existing commercial discount ranges (inside the Vaadin 24 iframe). */
async function excluirDescontosComerciaisExistentes(frame: FrameLocator) {
  const pencilIcons = frame.locator("//vaadin-icon[@icon='vaadin:pencil']");
  const count = await pencilIcons.count();

  if (count === 0) {
    console.log('Nenhuma faixa de desconto comercial encontrada para exclusao.');
    return;
  }

  console.log(`${count} faixas de desconto comercial serao excluidas.`);
  for (let i = 0; i < count; i++) {
    // Always click the first pencil icon (they shift after deletion)
    await frame.locator("(//vaadin-icon[@icon='vaadin:pencil'])[1]").click();
    await frame.page().waitForTimeout(500);
    await frame.locator("(//vaadin-button[normalize-space()='Excluir'])[1]").click();
    await frame.page().waitForTimeout(500);
    await frame.locator("(//vaadin-button[normalize-space()='Confirmar'])[1]").click();
    await frame.page().waitForTimeout(500);
  }
}

/** Disable unnecessary FV sync integrations. */
async function sincronizacoesDesnecessarias(page: Page) {
  await desmarcarIntegracoesPedidos(page, 'Envio de pedidos prontos');
  await desmarcarIntegracoesPedidos(page, 'Atualização dos pedidos enviados');
  await desmarcarIntegracoesPedidos(page, 'Imagens dos Produtos');
  await desmarcarIntegracoesPedidos(page, 'Agenda');
  await desmarcarIntegracoesPedidos(page, 'Produto EANS');
}

// ---------------------------------------------------------------------------
// DescontoComercial helpers (from DescontoComercialTest.java)
// ---------------------------------------------------------------------------

/** Access the commercial discount registration screen (Vaadin 6 + Vaadin 24 iframe). */
async function acessarCadastroDescontoComercial(page: Page, codTabelaPreco: string): Promise<FrameLocator> {
  console.log(`Acessando a politica comercial da tabela de preco ${codTabelaPreco}`);
  await acessarPoliticaComercial(page, codTabelaPreco);
  await page.locator("//div[@class='v-captiontext'][normalize-space()='Comercial']").click();
  await page.waitForTimeout(4000);

  console.log('Acessando iframe de desconto comercial em vaadin24.');
  return await acessarIframe(page, 'politica-comercial-desconto1');
}

/** Create two commercial discount ranges inside the Vaadin 24 iframe. */
async function cadastraFaixasComerciais(frame: FrameLocator, percFaixa1: string, percFaixa2: string) {
  const page = frame.page();

  await page.waitForTimeout(10000);

  // Range 1
  await frame.locator("(//vaadin-button[normalize-space()='Novo Cadastro'])[1]").click();
  await page.waitForTimeout(10000);

  const labelDesconto1 = frame.locator("//label[normalize-space()='Desconto']");
  const inputId1 = await labelDesconto1.getAttribute('for');
  if (inputId1) {
    const campo1 = frame.locator(`#${inputId1}`);
    await campo1.evaluate((el: HTMLInputElement) => { el.value = ''; });
    await campo1.fill(percFaixa1);
    await page.waitForTimeout(500);
  }

  const labelPecasDe1 = frame.locator("//label[normalize-space()='Peças de']");
  const inputIdPecas1 = await labelPecasDe1.getAttribute('for');
  if (inputIdPecas1) {
    const campoPecas1 = frame.locator(`#${inputIdPecas1}`);
    await campoPecas1.evaluate((el: HTMLInputElement) => { el.value = ''; });
    await campoPecas1.fill('0');
    await page.waitForTimeout(500);
  }

  const labelAte1 = frame.locator("(//label[normalize-space()='até'])[1]");
  const inputIdAte1 = await labelAte1.getAttribute('for');
  if (inputIdAte1) {
    const campoAte1 = frame.locator(`#${inputIdAte1}`);
    await campoAte1.evaluate((el: HTMLInputElement) => { el.value = ''; });
    await campoAte1.fill('50');
    await page.waitForTimeout(500);
  }

  await frame.locator("//vaadin-button[normalize-space()='Salvar']").click();

  // Range 2
  await frame.locator("(//vaadin-button[normalize-space()='Novo Cadastro'])[1]").click();
  await page.waitForTimeout(10000);

  const labelDesconto2 = frame.locator("//label[normalize-space()='Desconto']");
  const inputId2 = await labelDesconto2.getAttribute('for');
  if (inputId2) {
    const campo2 = frame.locator(`#${inputId2}`);
    await campo2.evaluate((el: HTMLInputElement) => { el.value = ''; });
    await campo2.fill(percFaixa2);
    await page.waitForTimeout(500);
  }

  const labelPecasDe2 = frame.locator("//label[normalize-space()='Peças de']");
  const inputIdPecas2 = await labelPecasDe2.getAttribute('for');
  if (inputIdPecas2) {
    const campoPecas2 = frame.locator(`#${inputIdPecas2}`);
    await campoPecas2.evaluate((el: HTMLInputElement) => { el.value = ''; });
    await campoPecas2.fill('51');
    await page.waitForTimeout(500);
  }

  const labelAte2 = frame.locator("(//label[normalize-space()='até'])[1]");
  const inputIdAte2 = await labelAte2.getAttribute('for');
  if (inputIdAte2) {
    const campoAte2 = frame.locator(`#${inputIdAte2}`);
    await campoAte2.evaluate((el: HTMLInputElement) => { el.value = ''; });
    await campoAte2.fill('999999');
    await page.waitForTimeout(500);
  }

  await frame.locator("//vaadin-button[normalize-space()='Salvar']").click();
  await page.waitForTimeout(10000);
}

/** Create an order in FV with the given discount percentage. Returns the formatted order ID. */
async function digitarPedidos(
  page: Page,
  percDesconto: string,
  codCliente: string,
  qtdeReferencias: number,
  codTabelaPreco: string,
): Promise<string> {
  await inicializacaoPedido(page, codTabelaPreco);
  console.log(`Realizando a digitacao de ${qtdeReferencias} referencias.`);
  await adicionarVariasReferenciasCarrinho(page, qtdeReferencias, 2, 3, '3');

  await guiasPedido(page, 'Geral', "//i[@class='fa fa-table']");
  await populaCampoInputPorId(page, 'cpCodCliente', codCliente);
  await selecionarCondPagPorPrazoMedio(page, '0');
  await populaCampoInputPorId(page, 'percDesconto1', percDesconto);
  await finalizarSincronizarPedido(page);

  const idPedido = await getIdPedido(page);
  return formatarIdPedidoParaMilhar(idPedido);
}

/** Attempt to create an order with an invalid discount and validate it gets capped. */
async function digitarPedidoErroneo(
  page: Page,
  percDesconto: string,
  codCliente: string,
  percDescontoMaximo: number,
  codTabelaPreco: string,
) {
  await inicializacaoPedido(page, codTabelaPreco);
  await adicionarVariasReferenciasCarrinho(page, 5, 2, 3, '3');

  await guiasPedido(page, 'Geral', "//i[@class='fa fa-table']");
  await populaCampoInputPorId(page, 'cpCodCliente', codCliente);
  await selecionarCondPagPorPrazoMedio(page, '0');
  await populaCampoInputPorId(page, 'percDesconto1', percDesconto);
  await page.waitForTimeout(1000);

  const valorAplicado = await retornarCampoInputPorId(page, 'percDesconto1');
  const percDescontoAplicado = transformarStringEmNumber(valorAplicado);

  expect(
    percDescontoAplicado,
    `O desconto comercial aplicado erroneamente nao foi corrigido pelo FV. ` +
    `Desconto aplicado: ${percDescontoAplicado} | Desconto maximo: ${percDescontoMaximo}`,
  ).toBe(percDescontoMaximo);
}

/** Validate discount percentages on the IGS order detail screen. */
async function validarDesconto1CapaIGS(page: Page, percDesconto: string) {
  const valorComercialStr = await buscarElementosEmDivInputValue(page, '% Comercial');
  const valorTotalDescontoStr = await buscarElementosEmDivInputValue(page, '% Desconto total');

  const percDescontoComercial = transformarStringEmNumber(valorComercialStr);
  const percDescontoTotal = transformarStringEmNumber(valorTotalDescontoStr);
  const percDescontoPolitica = transformarStringEmNumber(percDesconto);

  expect(
    percDescontoComercial,
    `Desconto em "% Comercial" nao confere com politica. ` +
    `Politica: ${percDescontoPolitica} | Campo: ${percDescontoComercial}`,
  ).toBe(percDescontoPolitica);

  expect(
    percDescontoTotal,
    `Desconto em "% Desconto total" nao confere com politica. ` +
    `Politica: ${percDescontoPolitica} | Campo: ${percDescontoTotal}`,
  ).toBe(percDescontoPolitica);

  console.log('Percentuais de desconto estao corretamente aplicados.');

  // Also read subtotal, total and discount values for completeness
  console.log('Verificando valor total de desconto');
  await buscarElementosEmDivInputValue(page, 'SubTotal');
  await buscarElementosEmDivInputValue(page, 'Total');
  await buscarElementosEmDivInputValue(page, 'Desconto');
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

test.describe('Politica Comercial - Desconto Comercial', () => {
  const COD_CLIENTE = '51150';
  const COD_TABELA_PRECO = '20260110';
  const PERC_FAIXA_1 = '5';
  const PERC_FAIXA_2 = '15';
  const PERC_DESCONTO_ERRONEO = '25';

  test('deve aplicar desconto comercial conforme faixas configuradas', async ({ page }) => {
    test.setTimeout(600_000); // 10 minutes — cross-system test

    // -----------------------------------------------------------------------
    // 1. Login IGS and access discount configurations
    // -----------------------------------------------------------------------
    console.log('Acessando e realizando o login no IGS');
    await page.goto(IGS_BASE_URL);
    await loginIGS(page);

    console.log('Acessando configuracoes de descontos.');
    await acessarConfigsDescontos(page);

    // -----------------------------------------------------------------------
    // 2. Check/enable commercial discount flag (Vaadin 24 iframe)
    // -----------------------------------------------------------------------
    const frameConfigs = await acessarConfigsVaadin24(page);

    console.log('Verificando se flag de desconto comercial esta ativa.');
    const flagChecked = await frameConfigs.locator('//vaadin-checkbox[1]').getAttribute('checked');
    if (flagChecked === null) {
      console.log('Flag de desconto comercial nao esta ativa. Ativando...');
      await frameConfigs.locator('//vaadin-checkbox[1]').click();
      await frameConfigs.locator("//vaadin-button[normalize-space()='Salvar']").click();
      console.log('Configuracoes salvas.');
    } else {
      console.log('Flag de desconto comercial ja esta ativa.');
    }

    // -----------------------------------------------------------------------
    // 3. Access commercial policy for price table and delete existing discounts
    // -----------------------------------------------------------------------
    const frameDesconto = await acessarCadastroDescontoComercial(page, COD_TABELA_PRECO);

    console.log('Excluindo descontos comerciais existentes.');
    await excluirDescontosComerciaisExistentes(frameDesconto);

    // -----------------------------------------------------------------------
    // 4. Create 2 discount ranges: 5% (0-50 pcs) and 15% (51-999999 pcs)
    // -----------------------------------------------------------------------
    console.log('Cadastrando novas faixas de desconto comercial.');
    await cadastraFaixasComerciais(frameDesconto, PERC_FAIXA_1, PERC_FAIXA_2);

    // -----------------------------------------------------------------------
    // 5. Close commercial policy
    // -----------------------------------------------------------------------
    console.log('Fechando a politica comercial.');
    await fecharPoliticaComercial(page);

    // -----------------------------------------------------------------------
    // 6. Block ERP sending
    // -----------------------------------------------------------------------
    console.log('Verificando se envio de pedidos para o ERP esta bloqueado');
    await bloquearEnvioPedidosERP(page);

    // -----------------------------------------------------------------------
    // 7. Login to FV (rep60334)
    // -----------------------------------------------------------------------
    console.log('Acessando o Forca de Vendas.');
    await page.goto(FV_BASE_URL);
    await loginPedidos(page, 'rep60334', 'kaiani2021');
    console.log('Login no Forca de Vendas realizado.');

    // -----------------------------------------------------------------------
    // 8. Disable unnecessary syncs and synchronize
    // -----------------------------------------------------------------------
    console.log('Desmarcando sincronizacoes desnecessarias.');
    await sincronizacoesDesnecessarias(page);
    console.log('Sincronizando o Forca de Vendas.');
    await sincronizar(page);

    // -----------------------------------------------------------------------
    // 9. Create order with 5% discount (quantity within first range)
    // -----------------------------------------------------------------------
    console.log(`Digitando pedido com desconto de ${PERC_FAIXA_1}%.`);
    const idPedido1 = await digitarPedidos(page, PERC_FAIXA_1, COD_CLIENTE, 2, COD_TABELA_PRECO);
    console.log(`Pedido ${idPedido1} gerado e enviado para o IGS.`);

    // -----------------------------------------------------------------------
    // 10. Create order with 15% discount (quantity in higher range)
    // -----------------------------------------------------------------------
    console.log(`Digitando pedido com desconto de ${PERC_FAIXA_2}%.`);
    const idPedido2 = await digitarPedidos(page, PERC_FAIXA_2, COD_CLIENTE, 4, COD_TABELA_PRECO);
    console.log(`Pedido ${idPedido2} gerado e enviado para o IGS.`);

    // -----------------------------------------------------------------------
    // 11. Attempt order with invalid 25% discount (validates max is 15%)
    // -----------------------------------------------------------------------
    console.log(`Tentando digitar pedido com desconto erroneo de ${PERC_DESCONTO_ERRONEO}%.`);
    await digitarPedidoErroneo(page, PERC_DESCONTO_ERRONEO, COD_CLIENTE, 15.0, COD_TABELA_PRECO);
    console.log('Validacao de desconto erroneo esta correta.');

    // -----------------------------------------------------------------------
    // 12. Navigate to IGS and verify discounts in sent orders
    // -----------------------------------------------------------------------
    console.log('Acessando o IGS para validar os pedidos.');
    await page.goto(IGS_BASE_URL);

    console.log('Consultando pedidos enviados.');
    await consultarPedidosEnviados(page);

    console.log(`Validando o pedido ${idPedido1} com %${PERC_FAIXA_1} de desconto.`);
    await abrirPedidoPorId(page, idPedido1);
    await validarDesconto1CapaIGS(page, PERC_FAIXA_1);

    console.log(`Validando o pedido ${idPedido2} com %${PERC_FAIXA_2} de desconto.`);
    await abrirPedidoPorId(page, idPedido2);
    await validarDesconto1CapaIGS(page, PERC_FAIXA_2);

    // -----------------------------------------------------------------------
    // 13. Clean up by deleting created discounts
    // -----------------------------------------------------------------------
    const frameCleanup = await acessarCadastroDescontoComercial(page, COD_TABELA_PRECO);
    console.log('Excluindo descontos comerciais existentes para deixar a base limpa.');
    await excluirDescontosComerciaisExistentes(frameCleanup);

    console.log('O TESTE SOBRE A APLICACAO DE DESCONTO COMERCIAL FOI UM SUCESSO!');
  });
});
