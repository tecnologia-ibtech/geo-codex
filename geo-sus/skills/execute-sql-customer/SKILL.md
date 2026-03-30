---
name: execute-sql-customer
description: >-
  Executa queries SQL no banco de dados PostgreSQL de um cliente GEOvendas via REST API.
  Use quando precisar consultar dados do cliente, verificar pedidos, debugar dados, ou
  diz coisas como 'consulta no cliente X', 'roda SQL no cliente', 'busca dados no ambiente'.
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
---

# Execute SQL on Customer Environment

Roda queries SQL no banco PostgreSQL de um cliente GEOvendas atraves do endpoint REST.

---

## O que essa skill faz

Cada cliente GEOvendas tem seu proprio banco de dados PostgreSQL. Essa skill permite executar
queries de leitura nesses bancos para investigar bugs, verificar dados, ou validar correcoes.

**IMPORTANTE:** Isso eh um endpoint de PRODUCAO. Tenha cuidado com as queries — prefira SELECT
com LIMIT para evitar queries pesadas.

---

## Como usar

### Procedimento obrigatorio para a URL

Ao receber qualquer entrada de ambiente/cliente, siga exatamente esta ordem:

1. Se a entrada for apenas um subdominio simples, como `acme`, converter para `https://acme.geovendas.com.br`
2. Remover uma barra final solta, se existir
3. Se a URL terminar com `/app`, remover esse sufixo
4. Montar o endpoint final como `{BASE_URL_NORMALIZADA}/rest/igs/exec/query`

Nao pedir esclarecimento ao user so porque a URL veio com `/app` ou `/app/`.
Voce deve corrigir isso automaticamente.

### Parametros necessarios:

1. **URL do cliente** — ex: `https://acme.geovendas.com.br`
   - Se o user passou so o subdominio (ex: `acme`), montar: `https://acme.geovendas.com.br`
   - Se receber a URL da app Vaadin, normalizar para a raiz do contexto antes de chamar o REST:
     - `https://lualua.ibtech.inf.br/IBTech_Geo/app`
     - `https://lualua.ibtech.inf.br/IBTech_Geo/app/`
     - ambos devem virar: `https://lualua.ibtech.inf.br/IBTech_Geo`
   - Nunca chamar o endpoint REST em uma URL que ainda termine com `/app`
   - Se nenhum dos dois foi fornecido → PERGUNTAR ao user

2. **SQL** — a query a executar
   - Se o user descreveu o que quer em linguagem natural → construir o SQL
   - Se o user passou SQL pronto → executar como esta

### Normalizacao obrigatoria da URL

Use esta logica literalmente antes do `curl`:

```bash
BASE_URL_RAW="<entrada do user>"

if [[ "$BASE_URL_RAW" != http://* && "$BASE_URL_RAW" != https://* ]]; then
  if [[ "$BASE_URL_RAW" == *.* ]]; then
    BASE_URL_RAW="https://${BASE_URL_RAW}"
  else
    BASE_URL_RAW="https://${BASE_URL_RAW}.geovendas.com.br"
  fi
fi

BASE_URL_NORMALIZED="${BASE_URL_RAW%/}"
BASE_URL_NORMALIZED="${BASE_URL_NORMALIZED%/app}"
ENDPOINT_URL="${BASE_URL_NORMALIZED}/rest/igs/exec/query"
```

### Exemplos de entrada -> saida

| Entrada recebida | URL normalizada | Endpoint final |
|------------------|-----------------|----------------|
| `acme` | `https://acme.geovendas.com.br` | `https://acme.geovendas.com.br/rest/igs/exec/query` |
| `https://acme.geovendas.com.br` | `https://acme.geovendas.com.br` | `https://acme.geovendas.com.br/rest/igs/exec/query` |
| `https://lualua.ibtech.inf.br/IBTech_Geo/app` | `https://lualua.ibtech.inf.br/IBTech_Geo` | `https://lualua.ibtech.inf.br/IBTech_Geo/rest/igs/exec/query` |
| `https://lualua.ibtech.inf.br/IBTech_Geo/app/` | `https://lualua.ibtech.inf.br/IBTech_Geo` | `https://lualua.ibtech.inf.br/IBTech_Geo/rest/igs/exec/query` |

### Executar:

```bash
curl -s -X POST "{ENDPOINT_URL}" \
  -H "Content-Type: application/json" \
  -d '{"query":"<SQL>","user":"geovendas.geolens","password":"G13E5TXca4"}'
```

Checklist mental obrigatorio antes do request:

- `BASE_URL_NORMALIZED` nao termina com `/`
- `BASE_URL_NORMALIZED` nao termina com `/app`
- `ENDPOINT_URL` termina com `/rest/igs/exec/query`

Credenciais sao fixas: `user: geovendas.geolens`, `password: G13E5TXca4`

### Apresentar resultados:

- Formatar o JSON como tabela legivel
- Se resultado vazio → dizer claramente
- Se erro → mostrar a mensagem e sugerir correcao

---

## Regras para construir SQL

Quando voce precisa construir o SQL (user descreveu em linguagem natural):

- **Sintaxe PostgreSQL** (NUNCA JPQL)
- **`WHERE` antes de `GROUP BY`**
- **`ILIKE`** para buscas de texto (case-insensitive)
- **`LIMIT 50`** por padrao (evitar queries pesadas)
- **Evitar** `SELECT *` ao construir SQL novo — prefira sempre especificar colunas

Se o user passou SQL pronto → executar sem modificar.

---

## Referencia: Tabela `geovendas1`

A tabela principal de dados de vendas — uma linha por item de pedido (desnormalizada):

| Coluna | Descricao |
|--------|-----------|
| codEmpresa | Codigo da empresa |
| codColecao | Codigo da colecao |
| codRepres | Codigo do representante |
| codRepresAgrupador | Codigo do grupo de representantes |
| codPedido | Codigo do pedido |
| codCliente | Codigo do cliente |
| nomeCliente | Nome do cliente |
| grupoCliente | Grupo do cliente |
| codIBGE | Codigo IBGE da cidade |
| codMarca | Codigo da marca |
| codLinha | Codigo da linha de produto |
| coringa1 .. coringa6 | Campos customizaveis |
| valorBruto | Valor bruto |
| valorLiquido | Valor liquido |
| valorDesconto | Valor do desconto |
| valorComissao | Valor da comissao |
| quantidade | Quantidade |
| flagPolitica | Flag de politica |
| prazoMedioXValor | Prazo medio x valor |
| dataEmissao | Data de emissao |
| dataReferencia | Data de referencia |
| qtdeItens | Qtde de itens |
| qtdeItensCancelados | Qtde de itens cancelados |

---

## Queries Uteis (exemplos prontos)

```sql
-- Pedidos de um representante
SELECT codpedido, codcliente, nomecliente, valorliquido, dataemissao
FROM geovendas1
WHERE codrepres = '<COD_REP>'
ORDER BY dataemissao DESC
LIMIT 20

-- Verificar representante
SELECT codrepres, nome, situacao, municipio
FROM georepresentante
WHERE codrepres = '<COD_REP>'

-- Verificar de-para de representantes
SELECT *
FROM geointegracaodatasourcerepresdepara
WHERE codrepresentante = '<COD>' OR codrepresentantedepara = '<COD>'

-- Verificar duplicatas de pedidos
SELECT codpedido, COUNT(*) as qtd
FROM geovendas1
WHERE codempresa = '<COD_EMPRESA>'
GROUP BY codpedido
HAVING COUNT(*) > 1
LIMIT 20

-- Buscar cliente por nome
SELECT codcliente, nomecliente, grupoCliente, codIBGE
FROM geovendas1
WHERE nomecliente ILIKE '%<NOME>%'
GROUP BY codcliente, nomecliente, grupoCliente, codIBGE
LIMIT 10
```

---

## Erros Comuns

| Erro | Causa | Solucao |
|------|-------|---------|
| Connection refused | URL errada ou servidor fora | Verificar subdominio, checar se cliente esta ativo |
| 401 / 403 | Problema de auth | Credenciais sao fixas — endpoint pode estar bloqueado |
| SQL syntax error | Query invalida | Checar sintaxe PostgreSQL, nomes de coluna sao camelCase na tabela mas lowercase no SQL |
| Resultado vazio | Sem dados matching | Ampliar filtros, verificar datas |
| Column not found | Nome de coluna errado | Nomes sao camelCase na tabela |
