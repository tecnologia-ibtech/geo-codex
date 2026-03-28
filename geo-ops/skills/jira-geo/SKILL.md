---
name: jira-geo
description: "Movimentacao de tarefas Jira no projeto GEO (Desenvolvimento). Use quando o usuario pedir para mover tarefa no Jira, enviar para revisao, preencher campos de transicao, atualizar procedure description, ou qualquer operacao no board GEO do Jira. Tambem use quando o usuario diz /jira-geo ou pede para atualizar uma tarefa GEO-XXXX."
---

# Jira GEO — Movimentacao de Tarefas

Skill para operar tarefas do projeto **GEO (Desenvolvimento)** no Jira Cloud da Geovendas.

## Conexao

- **Cloud ID**: `geovendas.atlassian.net` (usar como valor do parametro `cloudId` em todas as chamadas)
- **Projeto**: `GEO` (key do projeto)
- **Issue Type principal**: `Task` (id: `10002`)

## Fluxo do Board

```
To Do → In Development → Ready to Review → In Review → Done
                       ↘ Paused ↗
```

### Transicoes Conhecidas (a partir de "In Development")

| Transition ID | Nome               | Destino          |
|---------------|--------------------|------------------|
| 51            | Stop Development   | Paused           |
| 61            | Finish Development | Done             |
| 71            | Send to Revision   | Ready to Review  |

**IMPORTANTE**: Sempre buscar as transicoes disponiveis com `getTransitionsForJiraIssue` antes de transicionar, pois os IDs podem variar conforme o status atual da tarefa.

## Campos Custom Fields Importantes

| Field ID           | Nome                    | Tipo       | Notas                                      |
|--------------------|-------------------------|------------|---------------------------------------------|
| customfield_10066  | Procedure Description   | textarea   | Procedimento de teste/validacao (ADF)       |
| customfield_10165  | Pull requests           | textarea   | Links das PRs relacionadas (ADF)            |
| customfield_10132  | Alteracoes de escopo    | textarea   | Mudancas de escopo vs planejado (ADF)       |
| customfield_10896  | Base de dados           | textfield  | Alteracoes de schema/tabelas (string pura)  |
| customfield_10133  | Necessario atualizar    | checkbox   | Repositorios afetados (allowedValues)       |
| customfield_10065  | Documentation           | checkbox   | Tipos de doc necessarios                    |
| resolution         | Resolution              | resolution | Obrigatorio na transicao para Review/Done   |

### Valores de Resolution

| ID    | Nome             |
|-------|------------------|
| 10000 | Done             |
| 10001 | Won't Do         |
| 10002 | Duplicate        |
| 10003 | Cannot Reproduce |
| 10004 | Declined         |

### Valores de "Necessario atualizar" (repositorios)

| ID    | Valor                                |
|-------|--------------------------------------|
| 10775 | GEOvendas (geovendas-vaadin6)        |
| 10776 | Forca de Vendas (pedidos)            |
| 10777 | B2B (geovendas-b2b)                  |
| 10778 | ETL (geovendas-java8-etl)            |
| 10779 | CRM 360 (geovendas-vue)              |
| 10780 | Integracao .NET (geovendas-dotnet)   |
| 10781 | Kanban (crm-processo-kanban)         |
| 10782 | Stock Central                        |
| 10785 | Vaadin 23 (geovendas-vaadin23)       |
| 10862 | Video com - Live (video-com)         |
| 10863 | Video com server (video-com-server)  |
| 10864 | B2B API (geovendas-dotnet/B2B)       |
| 10866 | Comm Service (geovendas-dotnet/Comm) |
| 10868 | Storage (geovendas-dotnet/Storage)   |
| 10907 | Sintegra (ibtech-sintegra)           |
| 10914 | Traducoes (Termos)                   |
| 10932 | GEOPod.IA (geopod-ia)               |
| 10933 | Malwee (front end)                   |
| 10934 | Backend - MalweeAPI                  |
| 10935 | Backend - MalweeHUB                  |
| 10936 | Backend - MalweeLIB                  |
| 10959 | Forca de Vendas Textil (geovendas-malharia) |
| 13773 | Nenhum                               |
| 14400 | Link de Vendas (front end)           |
| 14401 | Link de Vendas (API)                 |

## Formato ADF (Atlassian Document Format)

A API v3 do Jira exige ADF para campos textarea. Strings puras retornam `Bad Request`.

### Estrutura Basica

```json
{
  "type": "doc",
  "version": 1,
  "content": [
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Texto simples" }
      ]
    }
  ]
}
```

### Elementos ADF Uteis

#### Heading
```json
{ "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Titulo" }] }
```

#### Bullet List
```json
{
  "type": "bulletList",
  "content": [
    { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Item" }] }] }
  ]
}
```

#### Ordered List
```json
{
  "type": "orderedList",
  "content": [
    { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Passo 1" }] }] }
  ]
}
```

#### Bold
```json
{ "type": "text", "text": "negrito", "marks": [{ "type": "strong" }] }
```

#### Link
```json
{ "type": "text", "text": "texto do link", "marks": [{ "type": "link", "attrs": { "href": "https://url" } }] }
```

#### Code Inline
```json
{ "type": "text", "text": "codigo", "marks": [{ "type": "code" }] }
```

**IMPORTANTE**: Campos `textfield` (como `customfield_10896` Base de dados) aceitam string pura, NAO precisam de ADF.

## Procedimentos

### 1. Enviar para Ready to Review (transicao mais comum)

Esta transicao exige campos obrigatorios na tela de transicao:

```
Campos obrigatorios:
- resolution (obrigatorio): usar { "name": "Done" } na maioria dos casos
- customfield_10165 (Pull requests): links das PRs em ADF
- customfield_10132 (Alteracoes de escopo): descrever se houve ou nao mudancas
- customfield_10896 (Base de dados): alteracoes de schema como string
```

#### Exemplo Completo de Transicao

```python
# 1. Buscar transicoes disponiveis
getTransitionsForJiraIssue(cloudId="geovendas.atlassian.net", issueIdOrKey="GEO-XXXX", expand="transitions.fields")

# 2. Preencher Procedure Description ANTES da transicao (via editJiraIssue)
editJiraIssue(
  cloudId="geovendas.atlassian.net",
  issueIdOrKey="GEO-XXXX",
  fields={
    "customfield_10066": {  # Procedure Description - ADF
      "type": "doc", "version": 1,
      "content": [
        { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Procedimento de Teste" }] },
        { "type": "orderedList", "content": [
          { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Passo 1..." }] }] },
          { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Passo 2..." }] }] }
        ]}
      ]
    }
  }
)

# 3. Executar transicao com campos da tela
transitionJiraIssue(
  cloudId="geovendas.atlassian.net",
  issueIdOrKey="GEO-XXXX",
  transition={ "id": "71" },  # Send to Revision
  fields={
    "resolution": { "name": "Done" },
    "customfield_10165": {  # Pull requests - ADF
      "type": "doc", "version": 1,
      "content": [{
        "type": "bulletList",
        "content": [
          { "type": "listItem", "content": [{ "type": "paragraph", "content": [
            { "type": "text", "text": "Backend: " },
            { "type": "text", "text": "#XXXX", "marks": [{ "type": "link", "attrs": { "href": "https://github.com/tecnologia-ibtech/REPO/pull/XXXX" } }] }
          ]}]}
        ]
      }]
    },
    "customfield_10132": {  # Alteracoes de escopo - ADF
      "type": "doc", "version": 1,
      "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Sem alteracoes de escopo." }] }]
    },
    "customfield_10896": "Descricao das alteracoes de banco"  # String pura
  }
)
```

### 2. Atualizar Procedure Description

Sempre usar ADF. Estrutura recomendada para procedure:

1. **Pre-requisitos** — configuracoes necessarias, flags, servicos
2. **Passos numerados por area** — frontend, backend, integracao
3. **Endpoints REST** — listar com metodo, path, parametros
4. **Validacoes** — o que verificar, comportamentos esperados
5. **PRs Relacionadas** — links com referencia cruzada entre repos

### 3. Consultar Tarefa

```python
getJiraIssue(cloudId="geovendas.atlassian.net", issueIdOrKey="GEO-XXXX")
```

Para ver todos os campos (incluindo custom fields):
```python
getJiraIssue(cloudId="geovendas.atlassian.net", issueIdOrKey="GEO-XXXX", expand="names")
```

### 4. Buscar Tarefas com JQL

```python
# Minhas tarefas em desenvolvimento
searchJiraIssuesUsingJql(
  cloudId="geovendas.atlassian.net",
  jql="project = GEO AND assignee = currentUser() AND status = 'In development'"
)

# Tarefas ready to review
searchJiraIssuesUsingJql(
  cloudId="geovendas.atlassian.net",
  jql="project = GEO AND status = 'Ready to Review' ORDER BY updated DESC"
)
```

### 5. Adicionar Comentario

```python
addCommentToJiraIssue(
  cloudId="geovendas.atlassian.net",
  issueIdOrKey="GEO-XXXX",
  commentBody="Texto do comentario em Markdown"
)
```

## Erros Comuns

| Erro | Causa | Solucao |
|------|-------|---------|
| `Bad Request` ao editar textarea | String pura em campo ADF | Usar formato ADF (doc/version/content) |
| `Field X is required` na transicao | Campo obrigatorio na tela de transicao | Preencher no parametro `fields` do transitionJiraIssue |
| `Bad Request` ao transicionar | Campos faltando ou formato errado | Usar `expand="transitions.fields"` para ver campos obrigatorios |
| Transicao nao encontrada | Status atual nao permite aquela transicao | Verificar status atual e transicoes disponiveis |

## Repositorios GitHub da Geovendas

| Repositorio | Descricao |
|-------------|-----------|
| tecnologia-ibtech/geovendas-vaadin6 | Backend + Backoffice (Java/Vaadin 6) |
| tecnologia-ibtech/pedidos | Forca de Vendas / App ISF (AngularJS) |
| tecnologia-ibtech/geovendas-vue | CRM 360 (Vue.js) |
| tecnologia-ibtech/geovendas-vaadin23 | Novo Backoffice (Vaadin 23) |
| tecnologia-ibtech/geo-ai-gateway | Gateway IA (Whisper, Ollama) |
| tecnologia-ibtech/geovendas-dotnet | Integracoes .NET |
| tecnologia-ibtech/geovendas-java8-etl | ETL Java 8 |
| tecnologia-ibtech/geovendas-b2b | Portal B2B |
