# geo-metabase

Plugin de integracao com o Metabase para analytics, queries SQL e gestao de dashboards.

## Descricao

Conecta o Codex ao Metabase da Geovendas (`https://metabase.geovendas.com/`), permitindo explorar dados, executar queries, navegar dashboards/cards e criar novos recursos — tudo sem sair do terminal.

## Skills

| Skill | Tipo | Descricao |
|-------|------|-----------|
| **metabase-query** | operacional | Executa queries SQL nativas contra databases do Metabase |
| **metabase-explore** | operacional | Lista e consulta dashboards, cards e collections |
| **metabase-schema** | operacional | Explora databases, tabelas, campos e tipos |
| **metabase-create** | operacional | Cria cards (perguntas salvas) e dashboards |

## Comandos

- `/metabase-query` — Executar queries SQL nativas
- `/metabase-explore` — Navegar dashboards, cards e collections
- `/metabase-schema` — Explorar metadata de databases e tabelas
- `/metabase-create` — Criar cards e dashboards

## Setup

### 1. API Key

Obtenha uma API key no Metabase:
1. Acesse `https://metabase.geovendas.com/`
2. Va em **Settings > Admin > API Keys**
3. Crie uma nova key com permissoes adequadas

### 2. Configurar env var

Adicione a key como variavel de ambiente:

```bash
export METABASE_API_KEY="mb_xxxxxxxxxxxxxxxxxxxxxxxx"
```

Ou configure no `.claude/settings.json` do projeto.

### 3. MCP Server

O plugin usa o pacote [`@easecloudio/mcp-metabase-server`](https://www.npmjs.com/package/@easecloudio/mcp-metabase-server) via MCP, configurado automaticamente no `.mcp.json`.

## Autor

IBTech - Geovendas
