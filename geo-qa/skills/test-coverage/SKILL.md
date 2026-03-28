---
name: test-coverage
description: "Analisa qualquer projeto, identifica gaps de cobertura de testes e gera testes Playwright/TypeScript para cobri-los. Use quando o usuario diz /test-coverage, pede para 'cobrir testes', 'aumentar cobertura', 'gerar testes para o projeto', ou quer saber o que esta sem teste."
allowed-tools: Bash, Read, Grep, Glob, Agent, Write, Edit
---

# test-coverage — Cobertura de Testes Playwright para Qualquer Projeto

Voce eh um especialista em testes automatizados que analisa projetos, identifica o que nao esta coberto por testes, e gera testes Playwright/TypeScript para preencher os gaps.

## Invocacao

```
/test-coverage                    (analisa o projeto no diretorio atual)
/test-coverage src/pages          (foco em um diretorio especifico)
/test-coverage --api-only         (foco em endpoints API)
```

---

## FASE 1: Discovery do Projeto

Ao ser invocado, analisar automaticamente o projeto atual:

### 1.1 Detectar Stack

Ler arquivos-chave para entender o projeto:

```
package.json          → dependencias, scripts, framework
tsconfig.json         → TypeScript config
vite.config.*         → Vite (Vue, React, Svelte)
next.config.*         → Next.js
nuxt.config.*         → Nuxt.js
angular.json          → Angular
playwright.config.*   → Playwright ja configurado?
jest.config.*         → Jest existente?
vitest.config.*       → Vitest existente?
```

Classificar:
- **Framework**: Vue, React, Angular, Next.js, Nuxt, Svelte, Express, outro
- **Linguagem**: TypeScript ou JavaScript
- **Tipo de app**: SPA, SSR, API-only, fullstack
- **Test runner existente**: Playwright, Jest, Vitest, Cypress, nenhum

### 1.2 Mapear Rotas e Paginas

Procurar rotas/paginas do projeto:

- **Vue/Nuxt**: `src/router/`, `pages/`, componentes `*.vue`
- **React/Next**: `app/`, `pages/`, `src/routes/`
- **Angular**: `app-routing.module.ts`, `*.routing.ts`
- **Express/API**: `routes/`, `controllers/`, arquivos com `app.get/post/put/delete`
- **Generico**: qualquer arquivo que defina endpoints ou rotas

Para cada rota/pagina encontrada, registrar:
- Caminho da rota (ex: `/dashboard`, `/api/users`)
- Arquivo fonte
- Tipo (pagina, API endpoint, componente)

### 1.3 Inventariar Testes Existentes

Procurar testes ja existentes:

```
**/*.spec.ts      **/*.test.ts
**/*.spec.js      **/*.test.js
**/*.spec.tsx     **/*.test.tsx
**/e2e/**         **/tests/**
**/__tests__/**   **/cypress/**
```

Para cada arquivo de teste:
- Qual area/rota/componente testa?
- Que tipo de teste (unit, integration, e2e, api)?
- Quantos test cases tem?

### 1.4 Gerar Mapa de Cobertura

Cruzar rotas/paginas com testes existentes para produzir:

```
=== MAPA DE COBERTURA ===

COBERTO:
  /login .................. login.spec.ts (3 testes: happy path, erro senha, erro user)
  /api/users .............. users-api.test.ts (5 testes: CRUD + validacao)

SEM COBERTURA:
  /dashboard .............. nenhum teste encontrado
  /settings ............... nenhum teste encontrado
  /api/orders ............. nenhum teste encontrado
  /api/orders/:id ......... nenhum teste encontrado

COBERTURA PARCIAL:
  /products ............... products.spec.ts (1 teste: so listagem, falta CRUD)
  /api/auth ............... auth.test.ts (2 testes: login OK, falta logout/refresh)
```

---

## FASE 2: Assessment — Apresentar ao Usuario

Apresentar os resultados da analise de forma clara:

```
Analisei o projeto [nome] e encontrei:

**Stack:** [framework] + [linguagem]
**Rotas/paginas:** X encontradas
**Testes existentes:** Y arquivos, Z test cases
**Cobertura estimada:** XX% das rotas/paginas tem algum teste

**Gaps criticos (sem nenhum teste):**
1. [rota/pagina] — [por que eh critica: tem logica de negocio, eh fluxo principal, etc.]
2. ...

**Gaps parciais (teste incompleto):**
1. [rota/pagina] — tem [N] testes mas falta [o que falta]
2. ...
```

Depois perguntar:

"Quais areas voce quer priorizar? Posso:
1. Cobrir tudo que esta sem teste (comecando pelos mais criticos)
2. Focar em uma area especifica (ex: so API, so paginas)
3. Completar os testes parciais primeiro"

Esperar a decisao do usuario antes de prosseguir.

---

## FASE 3: Setup — Garantir Infraestrutura de Testes

### 3.1 Se Playwright ja esta configurado

Verificar se `playwright.config.ts` existe e tem projetos configurados.
Usar a configuracao existente. Adaptar testes ao padrao do projeto.

### 3.2 Se Playwright NAO esta configurado

Perguntar ao usuario:

"O projeto ainda nao tem Playwright configurado. Posso configurar agora:
- Instalar dependencias (`@playwright/test`)
- Criar `playwright.config.ts` com projetos para este stack
- Criar estrutura de pastas (`tests/`, fixtures, etc.)
- Criar fixture de autenticacao base

Quer que eu configure?"

Se sim, criar setup minimo:

```bash
npm init playwright@latest --yes
```

Ou configurar manualmente se o projeto tem necessidades especificas.

### 3.3 Analisar Padroes Existentes

Se ja existem testes no projeto, ANALISAR e SEGUIR os padroes:
- Estrutura de imports
- Helper functions/fixtures usados
- Padroes de seletores (getByRole vs locator vs data-testid)
- Padrao de nomes de arquivos
- Padrao de describes/its
- Setup/teardown patterns

**REGRA: Sempre replicar o padrao existente.** Nao impor um padrao novo se o projeto ja tem um.

---

## FASE 4: Planejamento

Antes de gerar codigo, apresentar o plano:

```
Vou gerar os seguintes testes:

**Arquivo:** tests/[area]/[descricao].spec.ts

**E2E (@e2e):**
1. [descricao do teste] — cobre [rota/pagina]
2. [descricao do teste] — cobre [rota/pagina]

**API (@api):**
1. [descricao do teste] — cobre [endpoint]
2. [descricao do teste] — cobre [endpoint]

**Total:** X testes novos, cobrindo Y rotas/paginas anteriormente sem teste

Aprova este plano?
```

Esperar aprovacao explicita.

---

## FASE 5: Geracao de Testes

### Convencoes

- Seguir o padrao de nomes do projeto (se existir) ou usar `[area]-[descricao].spec.ts`
- Usar `test.describe('[Area]: [Descricao]', () => { ... })` como wrapper
- Tags: `@e2e`, `@api`, `@smoke` para filtrar
- Testes independentes — cada um faz seu proprio setup
- `test.beforeEach` para autenticacao quando necessario

### Antes de gerar, verificar reutilizacao

1. Se ja existem testes para a mesma area, LER e entender o que cobrem
2. Decidir: ESTENDER teste existente ou CRIAR novo
3. Se existem fixtures/helpers, REUTILIZAR — nunca duplicar logica

### Padrao de Teste — E2E

```typescript
import { test, expect } from '@playwright/test';

test.describe('[Area]: [Funcionalidade]', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login, navegacao, etc.
  });

  test('deve [acao esperada no happy path] @e2e', async ({ page }) => {
    // Navegar
    await page.goto('/rota');

    // Interagir
    await page.getByRole('button', { name: 'Acao' }).click();

    // Validar
    await expect(page.getByText('Resultado')).toBeVisible();
  });

  test('deve lidar com [cenario de erro] @e2e', async ({ page }) => {
    await page.goto('/rota');
    // Tentar acao invalida e validar erro
  });
});
```

### Padrao de Teste — API

```typescript
import { test, expect } from '@playwright/test';

test.describe('API: [Recurso]', () => {
  test('GET /endpoint retorna dados corretos @api', async ({ request }) => {
    const response = await request.get('/api/endpoint');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty('campo');
  });

  test('POST /endpoint cria recurso @api', async ({ request }) => {
    const response = await request.post('/api/endpoint', {
      data: { campo: 'valor' }
    });
    expect(response.status()).toBe(201);
  });

  test('POST /endpoint rejeita dados invalidos @api', async ({ request }) => {
    const response = await request.post('/api/endpoint', {
      data: {}
    });
    expect(response.status()).toBe(400);
  });
});
```

### Padrao de Teste — Smoke (navegacao basica)

Para cobertura rapida de paginas sem teste:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Smoke: Navegacao', () => {
  test('pagina [nome] carrega sem erros @smoke', async ({ page }) => {
    await page.goto('/rota');
    await expect(page).toHaveTitle(/titulo esperado/i);
    // Verificar que nao ha erros no console
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
});
```

---

## FASE 6: Validacao

1. **Verificar que o teste compila:**
   ```bash
   npx playwright test --list
   ```
   Se falhar, corrigir erros de TypeScript.

2. **Tentar executar:**
   Perguntar: "O projeto esta rodando localmente? Posso executar os testes?"
   - Se sim: `npx playwright test [arquivo] --headed`
   - Se nao: informar que precisa ser validado depois

3. **Mostrar resultado:**
   - Passou: "Todos os X testes passaram!"
   - Falhou: corrigir e re-executar (ate 3 tentativas)
   - Nao executou: "Testes gerados e prontos para execucao"

4. **Atualizar mapa de cobertura:**
   Mostrar o mapa atualizado com os novos testes incluidos

---

## Regras Gerais

- NUNCA gerar testes sem aprovacao do plano
- NUNCA commitar credenciais
- SEMPRE analisar testes existentes antes de criar novos
- SEMPRE seguir o padrao de codigo do projeto
- SEMPRE reutilizar fixtures e helpers existentes
- SEMPRE usar seletores acessiveis (getByRole, getByLabel, getByText) como primeira opcao
- Se o projeto nao tem testes, comecar com smoke tests para cobrir navegacao basica
- Se o projeto ja tem testes, focar nos gaps mais criticos
- Preferir testes simples e confiaveis a testes complexos e frageis
- Para projetos grandes, sugerir cobertura incremental (nao tentar cobrir tudo de uma vez)
- Gerar no maximo 10 arquivos de teste por execucao — se precisar de mais, dividir em rodadas
