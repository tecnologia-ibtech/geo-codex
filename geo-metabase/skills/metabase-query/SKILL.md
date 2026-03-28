---
name: metabase-query
description: "Execute native SQL queries against Metabase databases. Use when: (1) running SQL queries for data analysis, (2) investigating data issues, (3) extracting data from Metabase, (4) running ad-hoc reports. Requires METABASE_API_KEY env var."
---

# Metabase Query — SQL Nativo

Executa queries SQL nativas contra databases conectados ao Metabase.

## Pre-requisitos

- Env var `METABASE_API_KEY` configurada
- MCP server `metabase` ativo (via `.mcp.json` do plugin)

## Workflow

### 1. Identificar o database

Antes de executar qualquer query, descubra os databases disponiveis:

```
Use MCP tool: list_databases
```

Anote o `id` do database desejado.

### 2. Executar a query

Use o tool de dataset/native query do MCP server:

```
Use MCP tool: execute_native_query
- database_id: <id do database>
- query: "<SQL>"
```

### 3. Apresentar resultados

- Formate os resultados em tabela markdown
- Se houver muitas linhas, resuma ou mostre as primeiras N
- Destaque valores relevantes para o contexto do usuario

## Regras de Seguranca

- **Prefira SELECT**: evite queries destrutivas (INSERT, UPDATE, DELETE, DROP)
- **Use LIMIT**: sempre adicione LIMIT em queries exploratórias para evitar retornos massivos
- **Não exponha credenciais**: nunca mostre a API key ou dados sensíveis no output

## Exemplos de Uso

| Pedido do usuario | Query sugerida |
|-------------------|---------------|
| "Quantos pedidos tivemos ontem?" | `SELECT COUNT(*) FROM pedidos WHERE data = CURRENT_DATE - 1` |
| "Top 10 clientes por faturamento" | `SELECT cliente, SUM(valor) as total FROM pedidos GROUP BY cliente ORDER BY total DESC LIMIT 10` |
| "Teste de conectividade" | `SELECT 1` |

## Troubleshooting

| Erro | Solucao |
|------|---------|
| API key invalida | Verificar env var `METABASE_API_KEY` |
| Database nao encontrado | Rodar `list_databases` para ver IDs disponiveis |
| Permissao negada | Verificar permissoes da API key no Metabase |
| Timeout | Simplificar query ou adicionar LIMIT |
