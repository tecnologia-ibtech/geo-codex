---
name: metabase-create
description: "Create new cards (saved questions) and dashboards in Metabase. Use when: (1) creating a new saved question/card, (2) creating a new dashboard, (3) adding cards to dashboards, (4) organizing resources in collections. Requires METABASE_API_KEY env var."
---

# Metabase Create — Cards e Dashboards

Cria novos recursos no Metabase: cards (perguntas salvas) e dashboards.

## Pre-requisitos

- Env var `METABASE_API_KEY` configurada
- MCP server `metabase` ativo (via `.mcp.json` do plugin)

## Workflow

### 1. Criar um Card (Pergunta Salva)

Primeiro, identifique o database e entenda a estrutura (use skill `metabase-schema`).

```
Use MCP tool: create_card
- name: "<nome descritivo>"
- database_id: <id do database>
- dataset_query: { "type": "native", "native": { "query": "<SQL>" }, "database": <id> }
- display: "<tipo de visualizacao>"  (table, bar, line, pie, scalar, etc.)
- collection_id: <id da collection>  (opcional)
```

### 2. Criar um Dashboard

```
Use MCP tool: create_dashboard
- name: "<nome do dashboard>"
- description: "<descricao>"
- collection_id: <id da collection>  (opcional)
```

### 3. Adicionar Cards a um Dashboard

Apos criar dashboard e cards:
```
Use MCP tool: add_card_to_dashboard
- dashboard_id: <id do dashboard>
- card_id: <id do card>
```

### 4. Organizar em Collections

Para criar uma collection:
```
Use MCP tool: create_collection
- name: "<nome>"
- parent_id: <id da collection pai>  (opcional)
```

## Tipos de Visualizacao

| Tipo | Quando usar |
|------|------------|
| `table` | Dados tabulares, listagens |
| `bar` | Comparacoes entre categorias |
| `line` | Tendencias ao longo do tempo |
| `pie` | Distribuicao proporcional |
| `scalar` | Valor unico (contagem, soma) |
| `row` | Ranking horizontal |
| `area` | Tendencia com volume |

## Boas Praticas

- Nomeie cards de forma descritiva (ex: "Pedidos por Regiao — Ultimos 30 dias")
- Agrupe cards relacionados em collections
- Adicione descricao aos dashboards para contexto
- Teste a query com `metabase-query` antes de salvar como card
- Use collections para organizar por area (Vendas, Financeiro, Operacoes, etc.)
