import { Page, Locator } from '@playwright/test';

// ---------------------------------------------------------------------------
// Button helpers
// ---------------------------------------------------------------------------

export async function btnVaadin24(page: Page, text: string) {
  await page.locator(`(//vaadin-button[normalize-space()='${text}'])[1]`).click();
  await page.waitForTimeout(500);
}

export async function btnSalvarVaadin24(page: Page) {
  await page.locator("//vaadin-button[normalize-space()='Salvar']").click();
}

export async function btnEditarVaadin24(page: Page) {
  await page.locator("(//vaadin-icon[@icon='vaadin:pencil'])[1]").click();
  await page.waitForTimeout(500);
}

// ---------------------------------------------------------------------------
// Input fields
// ---------------------------------------------------------------------------

/**
 * Fill a Vaadin 24 input by its label text.
 * Finds the <label>, reads its `for` attribute, then targets the associated <input>.
 */
export async function campoInputVaadin24(page: Page, label: string, value: string) {
  const labelEl = page.locator(`//label[normalize-space()='${label}']`);
  const inputId = await labelEl.getAttribute('for');
  if (!inputId) throw new Error(`Label '${label}' nao possui atributo 'for'`);

  const campo = page.locator(`#${inputId}`);
  await campo.evaluate((el: HTMLInputElement) => { el.value = ''; });
  await campo.fill(value);
  await page.waitForTimeout(500);
}

/** Same as campoInputVaadin24, but for labels that appear multiple times (1-based index). */
export async function campoInputVaadin24Index(page: Page, label: string, value: string, index: number) {
  const labelEl = page.locator(`(//label[normalize-space()='${label}'])[${index}]`);
  const inputId = await labelEl.getAttribute('for');
  if (!inputId) throw new Error(`Label '${label}' (index ${index}) nao possui atributo 'for'`);

  const campo = page.locator(`#${inputId}`);
  await campo.evaluate((el: HTMLInputElement) => { el.value = ''; });
  await campo.fill(value);
  await page.waitForTimeout(500);
}

// ---------------------------------------------------------------------------
// Checkbox (flag) helpers
// ---------------------------------------------------------------------------

/** Returns the Locator for the Vaadin checkbox at the given 1-based position. */
export function flagVaadin24(page: Page, position: number): Locator {
  return page.locator(`//vaadin-checkbox[${position}]`);
}

/** Checks whether a Vaadin checkbox is currently checked. */
export async function valorFlagVaadin24(page: Page, position: number): Promise<boolean> {
  const flag = flagVaadin24(page, position);
  return (await flag.getAttribute('checked')) !== null;
}
