# Design: Skill `qa-test` — Gerador de Testes Automatizados para QA

**Data:** 2026-03-06
**Status:** Aprovado

## Objetivo

Criar uma skill Codex (`/qa-test QUA-1234`) que automatiza a geração de testes Playwright/TypeScript a partir de tarefas Jira do time de qualidade. O QA não precisa escrever código — a skill entrevista, gera, valida e commita os testes.

## Decisões de Design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Framework de teste | Playwright + TypeScript | API moderna, auto-wait, suporte Claude nativo |
| Tipo de componente | Skill puro (não plugin/agent) | Usa infra existente do geo-codex, zero setup |
| Organização dos testes | Por feature/módulo | Simples para QA, sem complexidade de Page Objects |
| Escopo dos testes | 3 níveis (UI, API, Code) | Cobertura completa desde o início |
| Localização dos testes | `geo-codex/tests/` | Tudo junto, fácil de manter |
| Ambiente de execução | Local (preparado para k8s) | URLs parametrizadas via env vars |
| Input | Tarefa QUA-* do Jira | PRs determinam quais projetos testar |
| Credenciais | Solicitadas ao QA | Sem hardcode de senhas |

## Sistemas-Alvo

| Sistema | Stack | URL Local Default | Repo |
|---------|-------|-------------------|------|
| IGS (Vaadin 6) | Java 8, Vaadin 6, GWT | `http://localhost:8080/IBTech_Geo/app` | geovendas-vaadin6 |
| CRM360 (Vaadin 24) | Java 17, Vaadin 23, Spring Boot | `http://localhost:8081` | geovendas-vaadin24 |
| Pedidos (ISF) | CoffeeScript, AngularJS 1.x | `http://localhost:9000` | pedidos |

## Estrutura de Arquivos

```
geo-codex/
├── skills/
│   └── qa-test/
│       └── SKILL.md                  # Skill principal
├── tests/
│   ├── playwright.config.ts          # Config multi-projeto
│   ├── package.json                  # Playwright + TS deps
│   ├── tsconfig.json
│   ├── .env.example                  # Template de config local
│   ├── vaadin6/
│   │   ├── fixtures/                 # Login, dados reutilizáveis
│   │   │   └── auth.ts
│   │   └── features/                 # Testes por feature
│   │       └── QUA-XXXX-descricao.spec.ts
│   ├── vaadin24/
│   │   ├── fixtures/
│   │   │   └── auth.ts
│   │   └── features/
│   └── pedidos/
│       ├── fixtures/
│       │   └── auth.ts
│       └── features/
```

## Fluxo da Skill

### Fase 1: Coleta Automática
- Busca tarefa QUA-* no Jira via MCP Atlassian
- Extrai PRs vinculadas (links ou campo customizado)
- Se PRs ausentes, pede ao QA
- Identifica repos afetados pelo domínio da PR
- Analisa diffs: arquivos alterados, funções, rotas, endpoints

### Fase 2: Entrevista do QA
- Apresenta resumo do que entendeu das PRs
- Perguntas direcionadas:
  1. "Confirma que estes são os fluxos afetados?"
  2. "Quais telas preciso testar?"
  3. "Quais cenários de sucesso?"
  4. "Quais cenários de erro/edge case?"
  5. "Tem algum cenário que já deu bug antes nessa área?"
  6. "Dados de teste necessários?"
  7. "Credenciais de acesso ao sistema?"
- Estratégia agressiva: nunca aceita respostas vagas, pede exemplos concretos
- Após cada resposta, pergunta "E se...?" para edge cases
- Só para quando QA confirma que não tem mais cenários

### Fase 3: Planejamento
- Lista testes que vai gerar nos 3 níveis:
  - **UI/E2E**: navegação, formulários, fluxos visuais
  - **API**: chamadas REST, validação de respostas e schemas
  - **Code**: assertions sobre lógica de negócio das PRs
- QA aprova o plano antes da geração

### Fase 4: Geração
- Verifica testes existentes em `tests/` para reutilização
- Se feature mudou, atualiza teste existente
- Gera/atualiza fixtures compartilhadas (login, dados)
- Gera arquivos `.spec.ts` por feature nomeados `QUA-XXXX-descricao.spec.ts`
- Roda `npx playwright test` para validar que os testes compilam
- Mostra resultado ao QA

### Fase 5: Commit
- Commita testes no geo-codex/tests/
- Formato: `test(QUA-1234): descrição do que foi testado`

## 3 Níveis de Teste

### Nível 1 — UI/E2E (Playwright browser)
- `@playwright/test` com navegação, preenchimento, cliques, assertions visuais
- Cada sistema é um project no `playwright.config.ts` com `baseURL` própria
- Fixtures compartilhadas para login (evita repetir autenticação)
- Screenshots automáticos em falha

### Nível 2 — API/Integration
- Usa `request` context nativo do Playwright (sem libs extras)
- Testa endpoints REST: status codes, response bodies, schemas
- Valida contratos entre frontend e backend

### Nível 3 — Code-level
- Analisa código das PRs e gera assertions TypeScript
- Testa funções de cálculo, transformações, regras de negócio
- Importa módulos diretamente quando possível (TS/JS)
- Para código Java: valida via API ou análise estática

## Exemplo de Teste Gerado

```typescript
// tests/vaadin6/features/QUA-1234-desconto-comercial.spec.ts
import { test, expect } from '@playwright/test';
import { loginIGS } from '../fixtures/auth';

test.describe('QUA-1234: Desconto Comercial', () => {

  test.beforeEach(async ({ page }) => {
    await loginIGS(page);
  });

  // Nível 1 — UI/E2E
  test('deve aplicar desconto de 10% no pedido', async ({ page }) => {
    await page.goto('/app#!politica-comercial');
    await page.getByRole('button', { name: 'Novo Desconto' }).click();
    await page.getByLabel('Percentual').fill('10');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Desconto salvo')).toBeVisible();
  });

  // Nível 2 — API
  test('API: deve retornar desconto criado', async ({ request }) => {
    const response = await request.get('/rest/desconto-comercial/1');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.percentual).toBe(10);
  });
});
```

## Configuração de Ambiente

```env
# .env.example
# Vaadin 6 (IGS)
VAADIN6_BASE_URL=http://localhost:8080/IBTech_Geo/app

# Vaadin 24 (CRM360)
VAADIN24_BASE_URL=http://localhost:8081

# Pedidos (ISF)
PEDIDOS_BASE_URL=http://localhost:9000
```

As URLs são parametrizadas para facilitar migração futura para k8s — basta trocar as env vars.

## Evolução Futura

- **Kubernetes**: trocar URLs locais por URLs do cluster
- **CI/CD**: rodar testes automaticamente em pipeline
- **Promoção para plugin**: se a skill precisar de mais poder (MCP server, hooks)
- **Relatórios**: integrar resultados dos testes de volta no Jira
