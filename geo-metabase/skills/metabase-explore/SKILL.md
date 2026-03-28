---
name: metabase-explore
description: "Navigate and search Metabase dashboards, cards (saved questions) and collections. Use when: (1) listing dashboards, (2) searching for saved questions/cards, (3) browsing collections, (4) viewing dashboard contents, (5) getting card details or results. Requires METABASE_API_KEY env var."
---

# Metabase Explore — Dashboards, Cards e Collections

Navega e consulta recursos existentes no Metabase: dashboards, cards (perguntas salvas) e collections.

## Pre-requisitos

- Env var `METABASE_API_KEY` configurada
- MCP server `metabase` ativo (via `.mcp.json` do plugin)

## Workflow

### 1. Listar ou buscar recursos

#### Dashboards
```
Use MCP tool: list_dashboards
```

Para detalhes de um dashboard especifico:
```
Use MCP tool: get_dashboard
- dashboard_id: <id>
```

#### Cards (Perguntas Salvas)
```
Use MCP tool: list_cards
```

Para ver resultados de um card:
```
Use MCP tool: get_card
- card_id: <id>
```

#### Collections
```
Use MCP tool: list_collections
```

Para conteudo de uma collection:
```
Use MCP tool: get_collection_items
- collection_id: <id>
```

### 2. Busca por termo

Se o usuario procura algo especifico:
```
Use MCP tool: search
- query: "<termo de busca>"
```

Isso retorna dashboards, cards e collections que contenham o termo.

### 3. Apresentar resultados

- Liste recursos em formato tabela com ID, nome e descricao
- Para dashboards, liste os cards contidos
- Para cards, mostre o tipo de visualizacao e a query subjacente se relevante

## Dicas

- Collections funcionam como pastas — organizam dashboards e cards
- Cards podem ser "questions" (com visualizacao) ou "models" (datasets reutilizaveis)
- Dashboards agrupam multiplos cards em uma unica visualizacao
- Use `search` quando o usuario nao sabe o nome exato do recurso
