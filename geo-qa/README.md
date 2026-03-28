# geo-qa

Plugin do Codex para automacao de testes de QA.

Entrevista QA Testers, gera testes automatizados **Playwright/TypeScript** a partir de tarefas Jira (QUA-*), e analisa cobertura de testes de qualquer projeto.

## Skills

| Skill | Descricao |
|-------|-----------|
| [qa-test](./skills/qa-test/) | Gera testes E2E, API e code-level a partir de entrevista com QA |
| [test-coverage](./skills/test-coverage/) | Analisa qualquer projeto, identifica gaps e gera testes Playwright |

## Commands

| Comando | Descricao |
|---------|-----------|
| `/qa-test QUA-1234` | Inicia geracao de testes para uma tarefa QUA |
| `/qa-test` | Modo livre — sem tarefa Jira |
| `/test-coverage` | Analisa cobertura de testes do projeto atual |
| `/test-coverage src/pages` | Foco em diretorio especifico |

## Sistemas Suportados

| Sistema | Stack | URL Local |
|---------|-------|-----------|
| IGS | Java 8, Vaadin 6 | `http://localhost:8080/IBTech_Geo/app` |
| CRM360 | Java 17, Vaadin 23, Spring Boot | `http://localhost:8081` |
| Pedidos (ISF) | CoffeeScript, AngularJS 1.x | `http://localhost:9000` |

## Documentacao

**Novo no plugin?** Leia o [Guia Completo do QA Tester](./docs/guia-qa-tester.md) — walkthrough passo a passo desde a instalacao ate a entrega da tarefa.

## Setup

```bash
# Instalar dependencias dos testes
cd geo-qa/tests
npm install
npx playwright install chromium

# Configurar credenciais
cp .env.example .env
# Editar .env com usuario/senha dos sistemas
```

## Estrutura dos Testes

```
tests/
├── playwright.config.ts       # Config multi-projeto
├── vaadin6/features/          # Testes do IGS
├── vaadin24/features/         # Testes do CRM360
└── pedidos/features/          # Testes do Pedidos
```

---

<sub>Mantido pelo time de QA da [Geovendas](https://geovendas.com) / IBTech</sub>
