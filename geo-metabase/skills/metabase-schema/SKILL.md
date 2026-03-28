---
name: metabase-schema
description: "Explore Metabase database metadata — databases, tables, fields and types. Use when: (1) discovering available databases, (2) listing tables in a database, (3) checking field names and types, (4) understanding data structure before writing queries. Requires METABASE_API_KEY env var."
---

# Metabase Schema — Exploracao de Metadata

Explora a estrutura dos databases conectados ao Metabase: databases, tabelas, campos e tipos.

## Pre-requisitos

- Env var `METABASE_API_KEY` configurada
- MCP server `metabase` ativo (via `.mcp.json` do plugin)

## Workflow

### 1. Listar databases

```
Use MCP tool: list_databases
```

Retorna todos os databases conectados ao Metabase com seus IDs e nomes.

### 2. Explorar tabelas

Para ver as tabelas de um database:
```
Use MCP tool: list_tables
- database_id: <id>
```

### 3. Ver campos de uma tabela

Para detalhes dos campos (colunas) de uma tabela:
```
Use MCP tool: get_table_metadata
- table_id: <id>
```

Isso retorna: nome do campo, tipo, descricao e se e foreign key.

### 4. Apresentar resultados

- Liste databases em tabela com ID e nome
- Liste tabelas em tabela com ID, nome e schema
- Liste campos com nome, tipo e descricao
- Destaque foreign keys e relacoes entre tabelas

## Uso Tipico

Este skill e o ponto de partida antes de executar queries. O fluxo recomendado:

1. `metabase-schema` — entender a estrutura
2. `metabase-query` — executar a query com base na estrutura descoberta

## Dicas

- Metabase pode ter multiplos databases conectados (producao, analytics, etc.)
- Campos com tipo `type/FK` indicam foreign keys
- Use a descricao dos campos quando disponivel para entender o significado dos dados
- Se uma tabela nao aparece, pode ser que esteja oculta no Metabase — verificar permissoes
