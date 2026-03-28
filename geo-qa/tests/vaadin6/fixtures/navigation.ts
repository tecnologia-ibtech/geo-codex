import { Page, FrameLocator } from '@playwright/test';

// ---------------------------------------------------------------------------
// System access
// ---------------------------------------------------------------------------

/** Navigate to a system URL and maximize viewport. */
export async function acessarSistema(page: Page, url: string) {
  await page.goto(url);
  await page.setViewportSize({ width: 1920, height: 1080 });
}

// ---------------------------------------------------------------------------
// Menu navigation (IGS Vaadin 6)
// ---------------------------------------------------------------------------

export async function acessarMenu(page: Page, menu: string, delayMs = 1000) {
  await page.locator(`//div[@class='v-captiontext'][normalize-space()='${menu}']`).click();
  await page.waitForTimeout(delayMs);
}

export async function acessarMenuConfigs(page: Page, menu: string, delayMs = 1000) {
  await page.locator(`//div[contains(text(),'${menu}')]`).click();
  await page.waitForTimeout(delayMs);
}

export async function btnFecharMenus(page: Page) {
  await page.locator(`(//span[@class='v-tabsheet-caption-close'])[last()]`).click();
}

// ---------------------------------------------------------------------------
// Iframe handling
// ---------------------------------------------------------------------------

/** Switch to an iframe whose src contains the given string. Returns a FrameLocator. */
export async function acessarIframe(page: Page, src: string): Promise<FrameLocator> {
  await page.waitForSelector(`iframe[src*='${src}']`, { timeout: 5000 });
  return page.frameLocator(`iframe[src*='${src}']`);
}

// ---------------------------------------------------------------------------
// Button helpers
// ---------------------------------------------------------------------------

export async function btnSpan(page: Page, text: string, delayMs = 1000) {
  await page.locator(`//span[normalize-space()='${text}'][1]`).click();
  await page.waitForTimeout(delayMs);
}

export async function btnSpanModalVaadin6(page: Page, text: string, delayMs = 1000) {
  await page.locator(`(//span[@class='v-button-caption'][normalize-space()='${text}'])[1]`).click();
  await page.waitForTimeout(delayMs);
}

export async function btnSim(page: Page) {
  await page.locator(`//span[contains(text(),'Sim')]`).click();
  await page.waitForTimeout(5000);
}

export async function btnSairModal(page: Page) {
  await page.locator(`(//span[normalize-space()='Sair'])[last()]`).click();
  await page.waitForTimeout(1500);
}

export async function btnNotificacao(page: Page, text: string, delayMs = 1000) {
  await page.locator(`//p[normalize-space()='${text}']`).click();
  await page.waitForTimeout(delayMs);
}

export async function btnSpanNumber(page: Page, index: number, delayMs = 1000) {
  await page.locator(`(//span)[(${index})]`).click();
  await page.waitForTimeout(delayMs);
}

export async function identificaBtnPorTexto(page: Page, text: string, index: number, delayMs = 1000) {
  await page.locator(`(//button[contains(normalize-space(.), '${text}')])[${index}]`).click();
  await page.waitForTimeout(delayMs);
}

export async function verificarExistenciaBtnPorTexto(page: Page, text: string, index: number): Promise<boolean> {
  const xpath = `(//button[contains(normalize-space(.), '${text}')])[${index}]`;
  const exists = await verificaExistencia(page, xpath);
  if (!exists) {
    console.log(`\nAtencao! O botao ${text} nao existe!`);
  }
  return exists;
}

export async function btnXpathEspecifico(page: Page, xpath: string, delayMs = 1000) {
  await page.locator(xpath).click();
  await page.waitForTimeout(delayMs);
}

export async function btnLabel(page: Page, text: string) {
  await page.locator(`(//label[normalize-space()='${text}'])[1]`).click();
  await page.waitForTimeout(500);
}

export async function btnApagarMultiSelectVaadin6(page: Page, nomeDiv: string, delayMs = 1000) {
  await page.locator(`((//div[normalize-space()='${nomeDiv}'])[1]//span[@class='v-button-wrap'])[2]`).click();
  await page.waitForTimeout(delayMs);
}

// ---------------------------------------------------------------------------
// Click helpers
// ---------------------------------------------------------------------------

export async function divContains(page: Page, text: string, delayMs = 1000) {
  await page.locator(`(//div[contains(text(),'${text}')])[1]`).click();
  await page.waitForTimeout(delayMs);
}

export async function clicarRegistroTabela(page: Page, text: string, delayMs = 1000) {
  await page.locator(`//table//tr//td//div//div[contains(text(),'${text}')]`).click();
  await page.waitForTimeout(delayMs);
}

// ---------------------------------------------------------------------------
// Scroll
// ---------------------------------------------------------------------------

export async function scrollarAteTopo(page: Page, xpathElementoClicavel?: string | null) {
  if (xpathElementoClicavel) {
    await page.locator(xpathElementoClicavel).click();
  }
  await page.keyboard.press('PageUp');
  await page.waitForTimeout(1000);
}

export async function scrollarAteFim(page: Page, xpathElementoClicavel?: string | null) {
  if (xpathElementoClicavel) {
    await page.locator(xpathElementoClicavel).click();
  }
  await page.keyboard.press('PageDown');
  await page.waitForTimeout(1000);
}

// ---------------------------------------------------------------------------
// Waits & element checks
// ---------------------------------------------------------------------------

export async function aguardarAte(page: Page, xpath: string, timeoutMinutes: number) {
  await page.locator(xpath).waitFor({ state: 'visible', timeout: timeoutMinutes * 60_000 });
}

export async function aguardarAteElementoSumir(page: Page, xpath: string, timeoutMinutes: number) {
  await page.locator(xpath).waitFor({ state: 'hidden', timeout: timeoutMinutes * 60_000 });
}

/**
 * Polls for integration completion (success notification) with a 30-minute timeout.
 * Throws if an error notification appears.
 */
export async function validaIntegracao(page: Page) {
  const timeout = 30 * 60_000;
  const poll = 30_000;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const erro = page.locator(`//div[contains(@class,'v-Notification-error')]`);
    if (await erro.isVisible({ timeout: 1000 }).catch(() => false)) {
      throw new Error('Erro detectado na integracao.');
    }

    const sucesso = page.locator(`(//div[@class='v-Notification'])[1]`);
    if (await sucesso.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('Integracao finalizada com sucesso.');
      return;
    }

    await page.waitForTimeout(poll);
  }

  throw new Error('Timeout de 30 minutos atingido aguardando integracao.');
}

export async function verificaExistencia(page: Page, xpath: string): Promise<boolean> {
  return (await page.locator(xpath).count()) > 0;
}

export async function fecharErro(page: Page, xpath: string) {
  if (await verificaExistencia(page, xpath)) {
    await page.locator(xpath).click();
    await page.waitForTimeout(2000);
  }
}

// ---------------------------------------------------------------------------
// Utility conversions (kept for parity with Java helpers)
// ---------------------------------------------------------------------------

export function transformarStringEmNumber(str: string | null | undefined): number {
  if (!str || str.trim() === '') return 0;
  return Number(str.replace(',', '.').trim());
}
