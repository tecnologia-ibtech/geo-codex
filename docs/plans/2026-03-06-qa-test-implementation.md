# qa-test Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the `qa-test` skill and Playwright test infrastructure so QA can generate automated tests via `/qa-test QUA-1234`.

**Architecture:** A Codex skill (`skills/qa-test/SKILL.md`) that interviews QA testers and generates Playwright/TypeScript tests into `tests/`. The test project supports 3 systems (vaadin6, vaadin24, pedidos) with parametrized URLs.

**Tech Stack:** TypeScript, Playwright, Node.js, Codex Skills (YAML frontmatter markdown)

---

### Task 1: Initialize tests/ project with package.json

**Files:**
- Create: `tests/package.json`

**Step 1: Create package.json**

```json
{
  "name": "geo-qa-tests",
  "version": "1.0.0",
  "private": true,
  "description": "Testes automatizados de QA para o ecossistema Geovendas",
  "scripts": {
    "test": "npx playwright test",
    "test:vaadin6": "npx playwright test --project=vaadin6",
    "test:vaadin24": "npx playwright test --project=vaadin24",
    "test:pedidos": "npx playwright test --project=pedidos",
    "test:api": "npx playwright test --grep @api",
    "test:e2e": "npx playwright test --grep @e2e",
    "report": "npx playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.50.0",
    "dotenv": "^16.4.0"
  }
}
```

**Step 2: Install dependencies**

Run: `cd /Users/gab/repo/geo-codex/tests && npm install`
Expected: `node_modules/` created, `package-lock.json` generated

**Step 3: Add node_modules to .gitignore**

Create `tests/.gitignore`:
```
node_modules/
test-results/
playwright-report/
.env
```

**Step 4: Install Playwright browsers**

Run: `cd /Users/gab/repo/geo-codex/tests && npx playwright install chromium`
Expected: Chromium browser downloaded

**Step 5: Commit**

```bash
cd /Users/gab/repo/geo-codex
git add tests/package.json tests/package-lock.json tests/.gitignore
git commit -m "chore(qa-test): initialize Playwright test project"
```

---

### Task 2: Create TypeScript and environment config

**Files:**
- Create: `tests/tsconfig.json`
- Create: `tests/.env.example`

**Step 1: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@vaadin6/*": ["./vaadin6/*"],
      "@vaadin24/*": ["./vaadin24/*"],
      "@pedidos/*": ["./pedidos/*"]
    }
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 2: Create .env.example**

```env
# Vaadin 6 (IGS)
VAADIN6_BASE_URL=http://localhost:8080/IBTech_Geo/app
VAADIN6_USER=
VAADIN6_PASS=

# Vaadin 24 (CRM360)
VAADIN24_BASE_URL=http://localhost:8081
VAADIN24_USER=
VAADIN24_PASS=

# Pedidos (ISF / Forca de Vendas)
PEDIDOS_BASE_URL=http://localhost:9000
PEDIDOS_USER=
PEDIDOS_PASS=
```

**Step 3: Commit**

```bash
cd /Users/gab/repo/geo-codex
git add tests/tsconfig.json tests/.env.example
git commit -m "chore(qa-test): add TypeScript config and env template"
```

---

### Task 3: Create playwright.config.ts with multi-project setup

**Files:**
- Create: `tests/playwright.config.ts`

**Step 1: Create playwright.config.ts**

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'vaadin6',
      testDir: './vaadin6/features',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.VAADIN6_BASE_URL || 'http://localhost:8080/IBTech_Geo/app',
      },
    },
    {
      name: 'vaadin24',
      testDir: './vaadin24/features',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.VAADIN24_BASE_URL || 'http://localhost:8081',
      },
    },
    {
      name: 'pedidos',
      testDir: './pedidos/features',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PEDIDOS_BASE_URL || 'http://localhost:9000',
      },
    },
  ],
});
```

**Step 2: Verify config loads**

Run: `cd /Users/gab/repo/geo-codex/tests && npx playwright test --list 2>&1 | head -5`
Expected: No config errors (may say "no tests found" which is fine)

**Step 3: Commit**

```bash
cd /Users/gab/repo/geo-codex
git add tests/playwright.config.ts
git commit -m "chore(qa-test): add Playwright multi-project config"
```

---

### Task 4: Create auth fixtures for all 3 systems

**Files:**
- Create: `tests/vaadin6/fixtures/auth.ts`
- Create: `tests/vaadin24/fixtures/auth.ts`
- Create: `tests/pedidos/fixtures/auth.ts`

**Step 1: Create directory structure**

Run: `mkdir -p /Users/gab/repo/geo-codex/tests/{vaadin6,vaadin24,pedidos}/{fixtures,features}`

**Step 2: Create vaadin6 auth fixture**

Vaadin 6 login is inside an iframe at `/IBTech_Geo/app`. The login form uses Vaadin's server-side rendered components with a traditional username/password form.

```typescript
// tests/vaadin6/fixtures/auth.ts
import { Page } from '@playwright/test';

export async function loginIGS(page: Page, user?: string, pass?: string) {
  const username = user || process.env.VAADIN6_USER;
  const password = pass || process.env.VAADIN6_PASS;
  if (!username || !password) {
    throw new Error('VAADIN6_USER and VAADIN6_PASS must be set in .env or passed as arguments');
  }
  await page.goto('/');
  await page.getByLabel('Login').fill(username);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForLoadState('networkidle');
}
```

**Step 3: Create vaadin24 auth fixture**

Vaadin 24 (CRM360) uses JWT token-based authentication with Spring Security.

```typescript
// tests/vaadin24/fixtures/auth.ts
import { Page } from '@playwright/test';

export async function loginCRM360(page: Page, user?: string, pass?: string) {
  const username = user || process.env.VAADIN24_USER;
  const password = pass || process.env.VAADIN24_PASS;
  if (!username || !password) {
    throw new Error('VAADIN24_USER and VAADIN24_PASS must be set in .env or passed as arguments');
  }
  await page.goto('/');
  await page.getByLabel('Login').fill(username);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForLoadState('networkidle');
}
```

**Step 4: Create pedidos auth fixture**

Pedidos (ISF) is an AngularJS SPA with login at `/pages/signin`. Credentials are encrypted and stored in browser session.

```typescript
// tests/pedidos/fixtures/auth.ts
import { Page } from '@playwright/test';

export async function loginPedidos(page: Page, user?: string, pass?: string) {
  const username = user || process.env.PEDIDOS_USER;
  const password = pass || process.env.PEDIDOS_PASS;
  if (!username || !password) {
    throw new Error('PEDIDOS_USER and PEDIDOS_PASS must be set in .env or passed as arguments');
  }
  await page.goto('/#/pages/signin');
  await page.getByPlaceholder('Login').fill(username);
  await page.getByPlaceholder('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForLoadState('networkidle');
}
```

**Step 5: Commit**

```bash
cd /Users/gab/repo/geo-codex
git add tests/vaadin6/ tests/vaadin24/ tests/pedidos/
git commit -m "chore(qa-test): add auth fixtures for all 3 systems"
```

---

### Task 5: Create placeholder spec files to validate project structure

**Files:**
- Create: `tests/vaadin6/features/.gitkeep`
- Create: `tests/vaadin24/features/.gitkeep`
- Create: `tests/pedidos/features/.gitkeep`

**Step 1: Create gitkeep files**

Run: `touch /Users/gab/repo/geo-codex/tests/{vaadin6,vaadin24,pedidos}/features/.gitkeep`

**Step 2: Verify full structure**

Run: `find /Users/gab/repo/geo-codex/tests -type f | sort`

Expected:
```
tests/.env.example
tests/.gitignore
tests/package-lock.json
tests/package.json
tests/playwright.config.ts
tests/tsconfig.json
tests/vaadin6/features/.gitkeep
tests/vaadin6/fixtures/auth.ts
tests/vaadin24/features/.gitkeep
tests/vaadin24/fixtures/auth.ts
tests/pedidos/features/.gitkeep
tests/pedidos/fixtures/auth.ts
```

**Step 3: Commit**

```bash
cd /Users/gab/repo/geo-codex
git add tests/
git commit -m "chore(qa-test): add feature directories with gitkeep"
```

---

### Task 6: Write the SKILL.md for qa-test

This is the core deliverable — the skill file that drives the entire QA interview and test generation flow.

**Files:**
- Create: `skills/qa-test/SKILL.md`

**Step 1: Create skill directory**

Run: `mkdir -p /Users/gab/repo/geo-codex/skills/qa-test`

**Step 2: Write SKILL.md**

The skill must contain:
1. YAML frontmatter with name, description
2. Overview and invocation
3. Phase 1: Jira task collection (using Atlassian MCP)
4. Phase 2: QA interview protocol (aggressive questioning)
5. Phase 3: Test plan (present to QA for approval)
6. Phase 4: Test generation (Playwright/TS patterns for each system)
7. Phase 5: Validation and commit
8. Reference: system-specific selectors and patterns
9. Reference: test file naming convention
10. Reference: fixture usage patterns

```markdown
---
name: qa-test
description: "Gera testes automatizados Playwright/TypeScript a partir de tarefas Jira de qualidade (QUA-*). Use quando o usuario diz /qa-test, pede para gerar testes de QA, ou menciona uma tarefa QUA-XXXX. A skill entrevista o QA Tester para extrair fluxos, telas e cenarios, depois gera e commita os testes."
---

# qa-test — Gerador de Testes Automatizados para QA

Voce eh um especialista em testes automatizados que entrevista QA Testers para gerar testes Playwright/TypeScript. Seu objetivo eh extrair o maximo de informacao do QA e gerar testes que cobrem UI/E2E, API e logica de negocio.

## Invocacao

```
/qa-test QUA-1234
/qa-test              (sem tarefa — modo livre)
```

## Projeto de Testes

Os testes ficam em: `~/repo/geo-codex/tests/`

Estrutura:
```
tests/
├── playwright.config.ts       # Config multi-projeto (vaadin6, vaadin24, pedidos)
├── .env                       # URLs e credenciais locais (nao commitado)
├── vaadin6/
│   ├── fixtures/auth.ts       # loginIGS(page, user?, pass?)
│   └── features/              # QUA-XXXX-descricao.spec.ts
├── vaadin24/
│   ├── fixtures/auth.ts       # loginCRM360(page, user?, pass?)
│   └── features/
└── pedidos/
    ├── fixtures/auth.ts       # loginPedidos(page, user?, pass?)
    └── features/
```

## FASE 1: Coleta Automatica

Ao receber uma tarefa QUA-*:

1. Buscar a tarefa no Jira usando o MCP Atlassian:
   - Ler titulo, descricao, comentarios
   - Extrair links de Pull Requests (campo customizado ou remote links)
   - Identificar sistemas afetados pelo repositorio das PRs:
     - `geovendas-vaadin6` ou `geovendas-vaadin` → projeto `vaadin6`
     - `geovendas-vaadin24` ou `geovendas-vaadin23` ou `ibtech-geovendas` → projeto `vaadin24`
     - `pedidos` ou `geovendas-isf` → projeto `pedidos`

2. Se encontrou PRs, analisar os diffs:
   - Listar arquivos alterados
   - Identificar: telas (views/controllers), endpoints (REST/resources), entidades (models/entities)
   - Mapear o que mudou para fluxos testaveis

3. Se NAO encontrou PRs na tarefa:
   - Perguntar ao QA: "Nao encontrei PRs vinculadas a QUA-XXXX. Pode me passar os links das Pull Requests?"

Sem tarefa Jira (modo livre):
- Perguntar: "Qual sistema vamos testar? (IGS/Vaadin 6, CRM360/Vaadin 24, ou Pedidos/ISF)"
- Perguntar: "Descreva o que precisa ser testado"

## FASE 2: Entrevista do QA

### Regras da Entrevista

- **UMA pergunta por vez** — nunca bombardear com multiplas perguntas
- **Nunca aceitar respostas vagas** — se o QA diz "testar a tela de pedidos", perguntar "Qual fluxo especifico? Criacao? Edicao? Consulta? Finalizacao?"
- **Sempre pedir exemplos concretos** — "Me de um exemplo de dado que voce usaria nesse teste"
- **Apos cada resposta, perguntar "E se...?"** — explorar edge cases
- **Preferir multipla escolha** quando possivel
- **Nao parar ate o QA confirmar** que nao tem mais cenarios

### Roteiro de Perguntas

1. **Confirmacao de escopo** (se veio do Jira):
   "Analisei as PRs e identifiquei que foram alterados: [lista]. Confirma que esses sao os fluxos que preciso testar?"

2. **Telas afetadas**:
   "Quais telas especificas eu preciso acessar para testar isso? Me descreva o caminho de navegacao."

3. **Cenarios de sucesso (happy path)**:
   "Descreva passo a passo o que um usuario faria nessa tela para o cenario funcionar corretamente."

4. **Cenarios de erro**:
   "O que acontece se o usuario [deixar campo vazio / colocar valor invalido / nao ter permissao]? Qual mensagem de erro espera?"

5. **Edge cases**:
   "Tem algum cenario que ja deu bug antes nessa area? Alguma combinacao de dados que costuma dar problema?"

6. **Dados de teste**:
   "Quais dados preciso para executar esses testes? (clientes, produtos, tabelas de preco, etc.)"

7. **Credenciais**:
   "Quais credenciais de acesso uso para testar? (usuario e senha do sistema)"
   - Salvar no .env local, NUNCA commitar

8. **Validacoes especificas**:
   "Alem do que discutimos, tem alguma validacao especifica que preciso checar? (calculo, integracao, mensagem, redirect)"

9. **Confirmacao final**:
   "Entao vou gerar testes para: [resumo completo]. Tem mais algum cenario que esquecemos?"

## FASE 3: Planejamento

Antes de gerar codigo, apresentar ao QA o plano:

```
Vou gerar os seguintes testes para QUA-XXXX:

**UI/E2E (@e2e):**
1. [descricao do teste e2e 1]
2. [descricao do teste e2e 2]

**API (@api):**
1. [descricao do teste api 1]

**Code-level (@code):**
1. [descricao do teste code 1]

Arquivo: tests/[projeto]/features/QUA-XXXX-[descricao].spec.ts

Aprova este plano?
```

Esperar aprovacao antes de gerar.

## FASE 4: Geracao de Testes

### Convencoes

- Nome do arquivo: `QUA-XXXX-descricao-curta.spec.ts` (kebab-case)
- Usar `test.describe('QUA-XXXX: Descricao', () => { ... })` como wrapper
- Tags nos testes: `@e2e`, `@api`, `@code` para filtrar por nivel
- Importar fixtures de auth do projeto correspondente
- Screenshots automaticos em falha (ja configurado no playwright.config.ts)

### Antes de gerar, verificar reutilizacao

1. Verificar se ja existe teste para a mesma area em `tests/[projeto]/features/`
2. Se existir, avaliar se deve ATUALIZAR o teste existente ou CRIAR novo
3. Verificar se fixtures existentes cobrem o que precisa (login, navegacao, dados)
4. Se precisar de nova fixture, criar em `tests/[projeto]/fixtures/`

### Padroes de Teste por Nivel

**Nivel 1 — UI/E2E (@e2e):**
```typescript
import { test, expect } from '@playwright/test';
import { loginIGS } from '../fixtures/auth';

test.describe('QUA-XXXX: Descricao', () => {
  test.beforeEach(async ({ page }) => {
    await loginIGS(page);
  });

  test('deve [acao esperada] @e2e', async ({ page }) => {
    // Navegar
    await page.goto('/rota');

    // Interagir
    await page.getByRole('button', { name: 'Acao' }).click();
    await page.getByLabel('Campo').fill('valor');

    // Validar
    await expect(page.getByText('Resultado')).toBeVisible();
  });
});
```

**Nivel 2 — API (@api):**
```typescript
test('API: deve [validacao] @api', async ({ request }) => {
  const response = await request.get('/rest/endpoint');
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.campo).toBe(valorEsperado);
});

test('API: deve rejeitar [cenario invalido] @api', async ({ request }) => {
  const response = await request.post('/rest/endpoint', {
    data: { campo: 'invalido' }
  });
  expect(response.status()).toBe(400);
});
```

**Nivel 3 — Code-level (@code):**
```typescript
test('deve calcular [regra de negocio] corretamente @code', async () => {
  // Testar logica extraida das PRs
  const resultado = calcularDesconto(100, 10);
  expect(resultado).toBe(90);
});
```

### Particularidades por Sistema

**Vaadin 6 (IGS):**
- Renderizacao server-side via GWT — elementos tem classes CSS geradas (v-button, v-textfield)
- Login dentro de iframe em alguns cenarios
- Navegacao por hash fragments: `/app#!nome-da-tela`
- Botoes usam `<span>` com texto — preferir `getByRole('button')` ou `getByText()`
- Waits: usar `waitForLoadState('networkidle')` apos acoes que disparam server roundtrip
- XPath pode ser necessario para componentes Vaadin complexos (grids, trees)

**Vaadin 24 (CRM360):**
- Componentes web nativos (Vaadin Web Components) — mais acessiveis que Vaadin 6
- Usar `getByRole()` e `getByLabel()` como primeira opcao
- REST API em `/api/v1/` — testar com `request` context
- Swagger disponivel em `/swagger-ui/` para referencia de endpoints
- Autenticacao via JWT token no header `X-Api-Key`
- Para testes de API autenticados, extrair token apos login

**Pedidos (ISF):**
- SPA AngularJS — rotas com hash: `/#/comercial/cadPedido`
- Offline-first com PouchDB — testar sync eh critico
- Formularios com Angular directives — usar `getByPlaceholder()` ou `locator('[ng-model="..."]')`
- Muitos selects customizados — pode precisar de `page.selectOption()` ou click em dropdown
- API backend em Express: `/pedido/`, `/cliente/`, `/prospect/`
- Login armazena dados criptografados no localStorage

## FASE 5: Validacao e Commit

1. **Verificar que o teste compila:**
   ```bash
   cd ~/repo/geo-codex/tests
   npx playwright test --project=[projeto] --grep "QUA-XXXX" --list
   ```
   Se falhar, corrigir erros de TypeScript.

2. **Tentar executar (se ambiente disponivel):**
   Perguntar ao QA: "O sistema [nome] esta rodando localmente? Posso executar os testes agora para validar?"
   - Se sim: `npx playwright test --project=[projeto] --grep "QUA-XXXX"`
   - Se nao: informar que o teste foi gerado mas precisa ser validado quando o ambiente estiver disponivel

3. **Mostrar resultado ao QA:**
   - Se passou: "Todos os testes passaram! Vou commitar."
   - Se falhou: "O teste [nome] falhou com [erro]. Vou ajustar." → corrigir e re-executar
   - Se nao executou: "O teste foi gerado e esta pronto para execucao. Vou commitar."

4. **Commit:**
   ```bash
   cd ~/repo/geo-codex
   git add tests/[projeto]/features/QUA-XXXX-*.spec.ts
   git add tests/[projeto]/fixtures/  # se criou/atualizou fixtures
   git commit -m "test(QUA-XXXX): [descricao do que foi testado]"
   ```

5. **Push:**
   Perguntar ao QA: "Posso fazer push dos testes para o repositorio remoto?"
```

**Step 3: Verify skill is well-formed**

Run: `head -5 /Users/gab/repo/geo-codex/skills/qa-test/SKILL.md`
Expected: YAML frontmatter with `---`, `name: qa-test`, `description: "..."`

**Step 4: Commit**

```bash
cd /Users/gab/repo/geo-codex
git add skills/qa-test/SKILL.md
git commit -m "feat(qa-test): add QA test generation skill"
```

---

### Task 7: Update README.md with qa-test skill

**Files:**
- Modify: `README.md`

**Step 1: Read current README**

Read `/Users/gab/repo/geo-codex/README.md` to find insertion points.

**Step 2: Add qa-test to skills tables**

Add a new section "QA / Testes" to the skills table (after "Knowledge Base"):

```markdown
### QA / Testes

| Skill | Comando | Descricao |
|-------|---------|-----------|
| [qa-test](./skills/qa-test/) | `/qa-test QUA-1234` | Entrevista QA Testers e gera testes Playwright/TypeScript automatizados a partir de tarefas Jira |
```

Add a detailed section after the geovendas360 section:

```markdown
### `/qa-test` — Gerador de Testes para QA

Entrevista QA Testers e gera testes automatizados Playwright/TypeScript a partir de tarefas Jira (QUA-*).

```
QA diz:     /qa-test QUA-1234
Claude faz: Le Jira → analisa PRs → entrevista QA → gera testes → commita
```

**Fluxo**:
1. Busca tarefa QUA-* e PRs vinculadas no Jira
2. Entrevista agressiva: extrai telas, fluxos, cenarios, edge cases
3. Apresenta plano de testes para aprovacao
4. Gera testes em 3 niveis (UI/E2E, API, Code-level)
5. Valida, executa e commita

**Sistemas suportados**: IGS (Vaadin 6), CRM360 (Vaadin 24), Pedidos (ISF)

**Testes ficam em**: `tests/` organizado por sistema
```

Update the repository structure diagram to include `tests/` and `skills/qa-test/`.

Update the badges to show `Skills-8` instead of `Skills-7`.

**Step 3: Commit**

```bash
cd /Users/gab/repo/geo-codex
git add README.md
git commit -m "docs: add qa-test skill to README"
```

---

### Task 8: End-to-end validation

**Step 1: Verify skill is discoverable**

Run: `ls -la /Users/gab/repo/geo-codex/skills/qa-test/SKILL.md`
Expected: File exists with content

**Step 2: Verify tests project structure**

Run: `find /Users/gab/repo/geo-codex/tests -type f -not -path '*/node_modules/*' | sort`

Expected:
```
tests/.env.example
tests/.gitignore
tests/package-lock.json
tests/package.json
tests/playwright.config.ts
tests/tsconfig.json
tests/vaadin6/features/.gitkeep
tests/vaadin6/fixtures/auth.ts
tests/vaadin24/features/.gitkeep
tests/vaadin24/fixtures/auth.ts
tests/pedidos/features/.gitkeep
tests/pedidos/fixtures/auth.ts
```

**Step 3: Verify Playwright config loads all 3 projects**

Run: `cd /Users/gab/repo/geo-codex/tests && npx playwright test --list 2>&1`
Expected: Lists 3 projects (vaadin6, vaadin24, pedidos), no config errors

**Step 4: Verify symlink to skills works**

If skills are symlinked to `~/~/.codex/skills/`, verify:
Run: `ls -la ~/~/.codex/skills/qa-test/SKILL.md 2>/dev/null || echo "Symlink not found - user needs to run: ln -sf ~/repo/geo-codex/skills/qa-test ~/~/.codex/skills/qa-test"`

**Step 5: Final commit (if any remaining changes)**

```bash
cd /Users/gab/repo/geo-codex
git status
# If changes exist:
git add -A && git commit -m "chore(qa-test): final structure validation"
```

---

## Summary

| Task | Deliverable | Commit |
|------|------------|--------|
| 1 | `tests/package.json`, deps installed | `chore(qa-test): initialize Playwright test project` |
| 2 | `tests/tsconfig.json`, `tests/.env.example` | `chore(qa-test): add TypeScript config and env template` |
| 3 | `tests/playwright.config.ts` | `chore(qa-test): add Playwright multi-project config` |
| 4 | Auth fixtures for 3 systems | `chore(qa-test): add auth fixtures for all 3 systems` |
| 5 | Feature directories with .gitkeep | `chore(qa-test): add feature directories with gitkeep` |
| 6 | `skills/qa-test/SKILL.md` (core skill) | `feat(qa-test): add QA test generation skill` |
| 7 | Updated README.md | `docs: add qa-test skill to README` |
| 8 | End-to-end validation | cleanup commit if needed |
