<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Marketplace-blueviolet?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQyIDAtOC0zLjU4LTgtOHMzLjU4LTggOC04IDggMy41OCA4IDgtMy41OCA4LTggOHoiLz48L3N2Zz4=&logoColor=white" alt="Codex Marketplace"/>
  <br/>
  <img src="https://img.shields.io/badge/Geovendas-IBTech-00B4D8?style=for-the-badge" alt="Geovendas"/>
  <img src="https://img.shields.io/badge/Plugins-6-success?style=for-the-badge" alt="6 Plugins"/>
  <img src="https://img.shields.io/badge/Stacks-Java%20%7C%20.NET%20%7C%20Node%20%7C%20Vue%20%7C%20Python-orange?style=for-the-badge" alt="Multi-stack"/>
</p>

# geo-codex

Marketplace local de plugins e skills do Codex para o ecossistema **Geovendas** da IBTech. Ele concentra contexto de codebase, automacoes de workflow, knowledge bases arquiteturais e ferramentas operacionais para o time de desenvolvimento.

---

## Plugins

| Plugin | Comando | Descricao |
|--------|---------|-----------|
| [geo-git](./geo-git/) | `/commit`, `/pr` | Git workflow — commit semantico e criacao de PRs |
| [geo-ops](./geo-ops/) | `/jira-geo`, `/firebase-deploy` | Jira GEO, PostgreSQL read-only, Firebase deploy |
| [geo-pedidos](./geo-pedidos/) | automatico | Knowledge base: Forca de Vendas (ISF) |
| [geo-360](./geo-360/) | automatico | Knowledge base: CRM360 (11 projetos, 5 stacks) |
| [geo-qa](./geo-qa/) | `/qa-test QUA-1234` | Entrevista QA Testers e gera testes Playwright/TypeScript automatizados |

---

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

---

## Instalacao

```bash
# macOS / Linux
./install.sh
```

```powershell
# Windows PowerShell
.\install.ps1
```

Os instaladores:

- criam links dos plugins em `~/plugins`
- publicam as skills em `~/.codex/skills`
- registram/atualizam o marketplace home-local em `~/.agents/plugins/marketplace.json`
- registram os MCPs declarados no repo com `codex mcp add`

Apos a instalacao:

- abra uma nova sessao para usar as skills instaladas em `~/.codex/skills`
- faca um restart completo do app Codex para recarregar plugins e slash commands na UI

```bash
codex
> /commit           # commit semantico + push
> /pr               # cria PR no GitHub
> /jira-geo         # gerencia tarefas no board GEO
> /firebase-deploy  # build + deploy Firebase
> /qa-test QUA-1234 # gera testes automatizados
```

---

## Estrutura do Repositorio

```
geo-codex/
├── .agents/plugins/
│   └── marketplace.json          # Manifesto do marketplace
├── geo-git/                      # Plugin: Git workflow
│   ├── .codex-plugin/plugin.json
│   ├── skills/
│   │   ├── commit/               #   commit semantico automatizado
│   │   └── create-pr/            #   criacao de PRs com titulo convencional
│   ├── commands/                 #   /commit, /pr
│   └── README.md
├── geo-ops/                      # Plugin: Operacoes e integracao
│   ├── .codex-plugin/plugin.json
│   ├── skills/
│   │   ├── jira-geo/             #   board GEO do Jira Cloud
│   │   ├── postgres/             #   queries PostgreSQL read-only
│   │   └── firebase-deploy/      #   build + deploy Firebase Hosting
│   ├── commands/                 #   /jira-geo, /firebase-deploy
│   └── README.md
├── geo-pedidos/                  # Plugin: Knowledge base Forca de Vendas
│   ├── .codex-plugin/plugin.json
│   ├── skills/
│   │   └── geovendas-pedidos/
│   └── README.md
├── geo-360/                      # Plugin: Knowledge base CRM360
│   ├── .codex-plugin/plugin.json
│   ├── skills/
│   │   └── geovendas360/
│   └── README.md
├── geo-qa/                       # Plugin: QA test generator
│   ├── .codex-plugin/plugin.json
│   ├── commands/                 #   /qa-test
│   ├── skills/
│   │   └── qa-test/              #   skill de geracao de testes
│   ├── tests/                    #   testes Playwright gerados
│   │   ├── vaadin6/              #     testes do IGS (Vaadin 6)
│   │   ├── vaadin24/             #     testes do CRM360 (Vaadin 24)
│   │   └── pedidos/              #     testes do Pedidos (ISF)
│   └── README.md
├── skills/                       # Skills repo-locais fora de plugins
│   ├── geo-repo-sync/
│   └── repo-to-docs-geovendas/
└── README.md
```

---

## Contribuindo

### Adicionando uma skill a um plugin existente

1. Crie uma pasta dentro de `<plugin>/skills/` com o nome da skill
2. Adicione um `SKILL.md` com frontmatter YAML:

```yaml
---
name: minha-skill
description: "Descricao curta do que a skill faz e quando usar"
allowed-tools: Bash(git:*), Read, Grep, Glob
---

# Titulo da Skill

Instrucoes detalhadas que o Claude vai seguir...
```

3. Atualize o `README.md` do plugin com a nova skill

### Criando um novo plugin

1. Crie uma pasta na raiz com o prefixo `geo-` (ex: `geo-deploy/`)
2. Adicione `.codex-plugin/plugin.json` com metadados do plugin
3. Adicione a estrutura: `skills/`, opcionalmente `commands/`, e `README.md`
4. Registre o plugin em `.agents/plugins/marketplace.json`
5. Abra um PR descrevendo o caso de uso

### Tipos de skill

- **Workflow**: automatiza tarefas repetitivas (commit, deploy, PR)
- **Operacional**: interage com servicos externos (Jira, PostgreSQL, Firebase)
- **Knowledge Base**: ensina o Claude sobre arquitetura e padroes do projeto
- **QA / Testes**: gera testes automatizados a partir de tarefas Jira

---

<p align="center">
  <sub>Mantido pelo time de desenvolvimento da <a href="https://geovendas.com">Geovendas</a> / IBTech</sub>
</p>
