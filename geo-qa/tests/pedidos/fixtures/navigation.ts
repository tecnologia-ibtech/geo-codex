import { Page } from '@playwright/test';
import {
  aguardarAte,
  aguardarAteElementoSumir,
  btnSpan,
  btnApagarMultiSelectVaadin6,
  btnXpathEspecifico,
  divContains,
  identificaBtnPorTexto,
  scrollarAteFim,
  scrollarAteTopo,
  verificaExistencia,
  verificarExistenciaBtnPorTexto,
  transformarStringEmNumber,
  btnSim,
} from '../../vaadin6/fixtures/navigation';

// ---------------------------------------------------------------------------
// XPath constants
// ---------------------------------------------------------------------------

const xpathBtnSincSelecionados = "(//button[@type='button'][normalize-space()='Sincronizar Selecionados'])[1]";
const xpathCancelarEnvioERP = "//div[normalize-space()='Cancelar envio do pedido ao ERP.']//input";
const xpathIdPedidoFV = "//span[@data-ng-bind='pedido.idLoteIntegracao']";
const xpathSelectTabPreco = "(//select)[1]";
const xpathBtnSairPedidosVaadin6 = "(//span[@class='v-button-wrap']//span[normalize-space()='Sair'])[last()]";

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

export async function sincronizar(page: Page) {
  await page.locator(xpathBtnSincSelecionados).click();
  await page.waitForTimeout(4000);
  await aguardarAteElementoSumir(page, "(//span[contains(., 'Sincronizando...')])", 10);
  await page.waitForTimeout(1500);
}

export async function desmarcarIntegracoesPedidos(page: Page, nomeSpan: string) {
  await page.locator(`(//span[contains(., '${nomeSpan}')])`).click();
  await page.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// Price table & payment condition
// ---------------------------------------------------------------------------

export async function selecionarTabelaPreco(page: Page, codTabPreco: string, delayMs = 700) {
  await page.locator(xpathSelectTabPreco).click();
  await page.waitForTimeout(700);
  await page.locator(`${xpathSelectTabPreco}//option[contains(., '${codTabPreco}')]`).click();
  await page.waitForTimeout(delayMs);
}

export async function selecionarCondPagPorPrazoMedio(page: Page, prazoMedio: string) {
  await page.locator(`//div[normalize-space()='Condição de Pagamento *']//button//i[@class='fa fa-search']`).click();
  await page.waitForTimeout(1500);
  await page.locator(`((//tr//td[3])[contains(.,(//span[contains(text(),'${prazoMedio}')]))])[1]`).click();
  await page.waitForTimeout(2000);
}

// ---------------------------------------------------------------------------
// Order tabs
// ---------------------------------------------------------------------------

export async function guiasPedido(page: Page, guia: string, xpathElementoClicavel?: string | null) {
  await scrollarAteTopo(page, xpathElementoClicavel);
  await page.locator(`(//a[normalize-space()='${guia}'])[1]`).click();
  await page.waitForTimeout(2000);
}

// ---------------------------------------------------------------------------
// Order initialization & finalization
// ---------------------------------------------------------------------------

export async function inicializacaoPedido(page: Page, codTabelaPreco: string) {
  await btnDashboardFv(page);
  await btnFv(page, 'Novo Pedido', 1);
  await aguardarAte(page, xpathSelectTabPreco, 1);
  await selecionarTabelaPreco(page, codTabelaPreco, 5000);
}

export async function finalizarSincronizarPedido(page: Page) {
  console.log('Finalizando pedido.');
  await guiasPedido(page, 'Finalização');
  await btnFv(page, 'Finalizar', 1);
  await btnFv(page, 'Sim', 1);
  await divContains(page, 'Pronto', 5000);

  console.log('Sincronizando pedido.');
  await btnFv(page, 'Sincronizar', 1);
  await btnFv(page, 'Sim', 1);
  console.log('Enviando pedido para o IGS');
  await page.waitForTimeout(30000);
  await aguardarAte(page, "//span[normalize-space()='Detalhar Pedido - Enviado']", 3);
}

// ---------------------------------------------------------------------------
// Add products to cart
// ---------------------------------------------------------------------------

export async function adicionarReferenciaCarrinho(
  page: Page,
  indexRefer: number,
  numColunas: number,
  numLinhas: number,
  valor: string,
) {
  const btnValido = await verificarExistenciaBtnPorTexto(page, 'Sortir', indexRefer);
  if (!btnValido) return;

  await identificaBtnPorTexto(page, 'Sortir', indexRefer, 1000);
  await percorrerParaPreencherInputs(page, numColunas, numLinhas, valor);
  await page.waitForTimeout(1000);
  await identificaBtnPorTexto(page, 'Adicionar', 1, 1000);
}

// ---------------------------------------------------------------------------
// Table modal input helpers
// ---------------------------------------------------------------------------

export async function preencherInputTabelaModal(
  page: Page,
  coluna: number,
  linha: number,
  valor: string,
  isPedido = false,
) {
  const xpathColunaTabela = `((//div[@class='modal-content'])[1]//tbody//td[${coluna}])`;
  const xpathCelulaTabela = `${xpathColunaTabela}[${linha}]`;
  const xpathInput = `${xpathCelulaTabela}//input`;
  const xpathSkuBloqueada = `${xpathCelulaTabela}//i[@class='fa fa-lock'][1]`;

  const celulaValida = await validarExistenciaInputCelulaTabela(
    page, xpathColunaTabela, xpathCelulaTabela, xpathSkuBloqueada, xpathInput, coluna, linha,
  );
  if (!celulaValida) return;

  let valorFinal = valor;
  if (isPedido) {
    valorFinal = await valorConsiderandoEstoque(page, xpathCelulaTabela, valor);
  }

  const input = page.locator(xpathInput);
  await input.click();
  await input.fill(valorFinal);
}

async function percorrerParaPreencherInputs(page: Page, numColunas: number, numLinhas: number, valor: string) {
  const maxCol = numColunas + 2;
  const maxRow = numLinhas + 1;
  for (let i = 2; i < maxCol; i++) {
    for (let j = 1; j < maxRow; j++) {
      await preencherInputTabelaModal(page, i, j, valor, true);
    }
  }
}

async function validarExistenciaInputCelulaTabela(
  page: Page,
  xpathColunaTabela: string,
  xpathCelulaTabela: string,
  xpathSkuBloqueada: string,
  xpathInput: string,
  coluna: number,
  linha: number,
): Promise<boolean> {
  if (!(await verificaExistencia(page, xpathColunaTabela))) {
    console.log(`\nAtencao! A coluna ${coluna} nao existe para preencher informacoes!`);
    return false;
  }
  if (!(await verificaExistencia(page, xpathCelulaTabela))) {
    console.log(`\nAtencao! A coluna ${coluna} e linha ${linha} nao existem para preencher informacoes!`);
    return false;
  }
  if (await verificaExistencia(page, xpathSkuBloqueada)) {
    console.log(`\nAtencao! A SKU esta bloqueada! Coluna: ${coluna} | Linha: ${linha}`);
    return false;
  }
  if (!(await verificaExistencia(page, xpathInput))) {
    console.log(`\nAtencao! Input nao existe no seguinte Xpath: ${xpathInput}`);
    return false;
  }
  return true;
}

async function valorConsiderandoEstoque(page: Page, xpathCelulaTabela: string, valor: string): Promise<string> {
  const xpathDivQtdeEstoque = `(${xpathCelulaTabela}//h6)[1]//div`;
  const estoqueLimitado = await verificaExistencia(page, xpathDivQtdeEstoque);
  if (!estoqueLimitado) return valor;

  const estoqueDisponivel = await page.locator(xpathDivQtdeEstoque).textContent() ?? '0';
  const estoque = transformarStringEmNumber(estoqueDisponivel);
  const valorInput = transformarStringEmNumber(valor);

  return valorInput > estoque ? String(estoque) : valor;
}

// ---------------------------------------------------------------------------
// Order ID
// ---------------------------------------------------------------------------

export async function getIdPedido(page: Page): Promise<string> {
  const el = page.locator(xpathIdPedidoFV);
  return (await el.textContent() ?? '').trim();
}

// ---------------------------------------------------------------------------
// ERP blocking & query
// ---------------------------------------------------------------------------

export async function bloquearEnvioPedidosERP(page: Page) {
  console.log('Clicando em Forca de Vendas.');
  await btnSpan(page, 'Força de Vendas', 2000);
  console.log('Abrindo Pedidos Clientes Pendentes.');
  await btnSpan(page, 'Pedidos/Clientes Pendentes', 7000);

  console.log('Verifica se esta bloqueado o envio de pedidos');
  if (await verificaExistencia(page, "//span[contains(text(),'Bloquear envio de pedidos ao ERP')]")) {
    await btnSpan(page, 'Bloquear envio de pedidos ao ERP', 2000);
    console.log('Envio de pedidos nao estava bloqueado, realizando o bloqueio.');
    await btnSim(page);
  }
}

export async function consultarPedidosEnviados(page: Page) {
  await btnSpan(page, 'Força de Vendas', 500);
  await btnSpan(page, 'Pedidos/Clientes Pendentes', 6000);
  await divContains(page, 'Enviados', 1500);
  await btnApagarMultiSelectVaadin6(page, 'Representante', 1000);
  await btnSpan(page, 'Sim', 500);
  await btnSpan(page, 'Consultar', 5000);
}

// ---------------------------------------------------------------------------
// Cancel & close order
// ---------------------------------------------------------------------------

export async function cancelarFecharPedido(page: Page) {
  await scrollarAteFim(page);
  await page.locator(xpathCancelarEnvioERP).click();
  await page.waitForTimeout(2500);
  await btnXpathEspecifico(page, xpathBtnSairPedidosVaadin6, 4000);
}

export async function abrirPedidoPorId(page: Page, idPedido: string) {
  await page.locator(
    `(//tr[contains(.,(//div[normalize-space()='${idPedido}'])[1])]//div)[last()]`,
  ).click();
  await page.waitForTimeout(7000);
}

// ---------------------------------------------------------------------------
// FV navigation buttons
// ---------------------------------------------------------------------------

export async function btnIntegracao(page: Page) {
  await page.locator("//i[@class='fa fa-refresh']").click();
  await page.waitForTimeout(3000);
}

export async function btnDashboardFv(page: Page) {
  await page.locator("//i[@class='fa fa-dashboard']").click();
  await page.waitForTimeout(3000);
}

export async function btnFv(page: Page, btnName: string, index: number) {
  await page.locator(`(//button[contains(., '${btnName}')])[${index}]`).click();
  await page.waitForTimeout(2000);
}
