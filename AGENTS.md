# geo-codex

Marketplace do Codex para o ecossistema Geovendas/IBTech. Este repositorio contem plugins que dao ao Codex contexto sobre o codebase — automacoes de workflow, knowledge base arquitetural e ferramentas de produtividade.

## Estrutura

```
geo-codex/
├── .codex-plugin/
│   └── marketplace.json      # Registro de todos os plugins
├── geo-git/                  # Plugin: Git workflow (commit, PR)
├── geo-ops/                  # Plugin: Jira, PostgreSQL, Firebase
├── geo-pedidos/              # Plugin: Knowledge base Forca de Vendas (ISF)
├── geo-360/                  # Plugin: Knowledge base CRM360
├── geo-setup/                # Plugin: Project setup (AGENTS.md, skills, MCP)
├── skills/                   # Skills locais do repositorio
│   ├── geo-repo-sync/        #   Sync de geo-claude -> geo-codex
│   └── repo-to-docs-geovendas/
└── scripts/repo_sync.py      # Motor de sync compartilhado
```

## Convencoes

### Plugins

- Toda pasta de plugin usa prefixo `geo-` (ex: `geo-git`, `geo-ops`)
- Metadados ficam em `<plugin>/.codex-plugin/plugin.json`
- Skills ficam em `<plugin>/skills/<nome-skill>/SKILL.md`
- Commands ficam em `<plugin>/commands/<nome>.md`
- Cada plugin tem `README.md` com tabela de skills
- Todo plugin novo deve ser registrado em `.agents/plugins/marketplace.json`

### Skills (SKILL.md)

- Frontmatter YAML obrigatorio: `name`, `description`
- `description` deve incluir quando a skill e acionada (trigger context)
- `allowed-tools` opcional, depende do tipo
- Nome da skill em kebab-case
- Tres tipos: workflow, operacional, knowledge-base

### plugin.json

Campos obrigatorios:

```json
{
  "name": "geo-<nome>",
  "description": "...",
  "version": "1.0.0",
  "author": {
    "name": "IBTech - Geovendas",
    "email": "dev@ibtech.inf.br"
  },
  "repository": "https://github.com/tecnologia-ibtech/geo-codex",
  "license": "MIT",
  "keywords": []
}
```

### Commands

Formato padrao — wrapper leve que aponta pra skill:

```yaml
---
description: "<descricao>"
disable-model-invocation: true
---

Invoke the <plugin>:<skill> skill and follow it exactly as presented to you
```

## Idioma

- Codigo, frontmatter, nomes de arquivos e commits: ingles
- Conteudo de skills (instrucoes, docs): portugues ou ingles dependendo do publico
- Mensagens de commit: ingles, Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)

## Workflow

- Use as skills internas (`create-plugin`, `create-skill`, `update-skill`) para manter consistencia ao criar ou editar plugins
- Use `skills/geo-repo-sync/scripts/run_sync.sh --dry-run` para revisar sync de `geo-claude` para `geo-codex`
