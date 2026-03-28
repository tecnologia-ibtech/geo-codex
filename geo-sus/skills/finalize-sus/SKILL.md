---
name: finalize-sus
description: >-
  Finaliza uma tarefa SUS apos o fix: adiciona comentario no Jira, transiciona status
  (Ready to Review ou Done), salva padroes aprendidos, e lanca apontamento de horas
  usando o apontamento interno do geo-ops. Triggers: /finalizar-tarefa-sus SUS-XXXX,
  'finalizar tarefa SUS', 'enviar para revisao', 'fechar SUS'.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - mcp__claude_ai_Atlassian__getJiraIssue
  - mcp__claude_ai_Atlassian__transitionJiraIssue
  - mcp__claude_ai_Atlassian__addCommentToJiraIssue
  - mcp__claude_ai_Atlassian__getTransitionsForJiraIssue
  - mcp__apontamento__geovendas_criar_apontamento
---

# Finalize SUS — Jira + Apontamento

Essa skill cuida de TUDO que acontece DEPOIS do fix estar pronto:
comentar no Jira, mover a tarefa, salvar padroes aprendidos, e apontar horas.

---

## O que voce precisa saber ANTES de usar essa skill

Esta skill espera receber (do orquestrador ou da skill de dominio):
- `_task_key`: chave da tarefa (ex: SUS-6279)
- `_date`: data de inicio (YYYY-MM-DD)
- `_hora_inicio`: hora que comecou a trabalhar (HH:MM)
- `_pr_urls`: lista de URLs das PRs criadas (pode ser vazia se foi analise-only)
- `_resumo`: resumo do que foi feito (problema + solucao)
- `_repos_alterados`: quais repos tiveram codigo alterado

---

## Workflow Passo a Passo

### Step 1: Comentario no Jira

Adicionar um comentario detalhado na tarefa:

```
addCommentToJiraIssue(
  cloudId: "geovendas.atlassian.net",
  issueIdOrKey: "<_task_key>",
  contentFormat: "markdown",
  commentBody: "<ver formato abaixo>"
)
```

#### Formato do comentario — COM PR (codigo alterado):

```markdown
## Analise e Correcao

### Problema identificado
<resumo claro do que estava errado — em linguagem que um atendente entende>

### Correcao
<o que foi feito para resolver — incluir caminhos em tela se aplicavel>

### PRs
- **<repo>**: [PR #NNN](<url>)
- **<repo>**: [PR #NNN](<url>)
```

#### Formato do comentario — SEM PR (analise-only / configuracao):

```markdown
## Analise

### Problema identificado
<resumo claro>

### Solucao
<passos que o atendente precisa seguir para resolver — com caminhos em tela, nome dos campos, valores>

### Observacoes
<informacoes adicionais se necessario>
```

#### Regras do comentario:

- SEMPRE incluir caminhos em tela (ex: "Analytics → Configuracoes → campo Filtro de Exclusao")
- SEMPRE usar nomes legiveis, NUNCA IDs numericos ou enums brutos
- Se houve PRs, OBRIGATORIO incluir as URLs
- O atendente precisa conseguir executar a solucao sem abrir banco de dados

### Step 2: Transicionar Status no Jira

**Existem 2 caminhos possiveis:**

#### Caminho A: Houve PR (codigo alterado) → Ready to Review

0. **Verificar que TODAS as PRs foram enviadas ao GeoLens.** Se alguma nao foi, enviar agora:

```bash
curl -X POST https://192.168.37.206/api/pr-reviews \
  -H "Content-Type: application/json" -k \
  -d '{"url": "<PR_URL>", "submitted_by": "'"$GEOLENS_USER"'"}'
```

Executar para CADA PR. Se o endpoint nao responder → logar o erro e continuar.

1. Buscar transicoes disponiveis:
   ```
   getTransitionsForJiraIssue(
     cloudId: "geovendas.atlassian.net",
     issueIdOrKey: "<_task_key>",
     expand: "transitions.fields"
   )
   ```

2. Encontrar "Send to Revision" (geralmente ID 21)

3. Transicionar com os campos obrigatorios:

```json
{
  "transition": { "id": "21" },
  "fields": {
    "customfield_10095": {
      "value": "<Feature categoria>",
      "child": { "value": "<subcategoria>" }
    },
    "customfield_10133": [
      { "id": "<Necessario Atualizar ID do repo>" }
    ]
  }
}
```

**customfield_10095 (Feature)** — escolher baseado no contexto:

| Categoria | Subcategorias comuns |
|-----------|---------------------|
| Forca de Vendas | Integracao com o ERP, Sincronizacao do pedido, Cadastro de clientes, Estoque - Pedido |
| B2B | Integracao com o ERP, Fechamento de Pedido |
| Analytics | Integracoes com o ERP, Consulta de Vendas |
| CRM | Integracao com o ERP |
| Suporte | (para tarefas SUS genericas) |

Se nao souber a subcategoria exata: buscar `allowedValues` na transicao expandida.

**customfield_10133 (Necessario Atualizar)** — marcar TODOS os repos alterados:

| Repo | ID |
|------|-----|
| pedidos | 10776 |
| geovendas-vaadin6 | 10775 |
| geovendas-b2b | 10777 |
| geovendas-java8-etl | 10778 |
| geovendas-vue | 10779 |
| geovendas-dotnet | 10780 |
| geovendas-vaadin23 | 10785 |

**IMPORTANTE:**
- O campo "Resolution" NAO eh aceito nesta transicao (retorna erro)
- Selecionar TODOS os repos que tiveram codigo alterado
- Se alterou `pedidos` + `geovendas-vaadin6`, marcar AMBOS

#### Caminho B: NAO houve PR (analise-only) → Done

1. Transicionar direto para Done: "Finish Attendance" (ID 131) com `resolution: {"name": "Done"}`

2. Se "Finish Attendance" nao estiver disponivel diretamente:
   - Primeiro: "Send to Revision" (ID 21) com `customfield_10095: {"value": "Suporte"}` e `customfield_10133: [{"value": "Nenhum"}]`
   - Depois: "Finish Attendance" (ID 131) com `resolution: {"name": "Done"}`

### Step 3: Salvar Padroes Aprendidos

Se durante a resolucao o user corrigiu ou esclareceu algo, salvar em `${CLAUDE_PLUGIN_ROOT}/commands/sus-lessons.md`.

Categorias para salvar:
- **Repo identification patterns** — "keyword X na verdade eh repo Y"
- **Atendente quirks** — como agentes especificos descrevem issues
- **Common false positives** — coisas que parecem X mas sao Y
- **Resolution patterns** — bugs recorrentes e seus fixes
- **Decision rules** — quando usar configuracao vs codigo

### Step 4: Apontamento de Horas (via geo-ops)

**O apontamento eh AUTOMATICO — lancar direto, sem pedir confirmacao.**

#### 4a. Capturar hora fim:

```bash
date "+%H:%M"
```

#### 4b. Ler credenciais:

```bash
echo "$APONTAMENTO_USER"
echo "$APONTAMENTO_PASSWORD"
```

Se credenciais estiverem vazias → pular apontamento e informar o user.

#### 4c. Lancar apontamento:

**IMPORTANTE:** Usar o MCP tool nativo `mcp__apontamento__geovendas_criar_apontamento`.
**NUNCA usar curl** para chamar o endpoint REST diretamente — sempre usar o MCP tool do Codex.
O MCP server `apontamento` esta em `http://192.168.37.206:8100/mcp` (URL fixa, interna).

Chamar `mcp__apontamento__geovendas_criar_apontamento` com:

```json
{
  "usuario": "<APONTAMENTO_USER>",
  "data": "<_date>",
  "hora_inicio": "<_hora_inicio>",
  "hora_fim": "<hora_fim_atual>",
  "task_key": "<_task_key>",
  "observacao": "<resumo curto do que foi feito>",
  "tipo": 9999,
  "situacao": 9999,
  "auth_user": "<APONTAMENTO_USER>",
  "auth_password": "<APONTAMENTO_PASSWORD>"
}
```

#### 4d. Informar resultado:

**Sucesso:**
```
Apontamento lancado!
  ID: <idSaved>
  Task: <_task_key>
  Horario: <_hora_inicio> - <hora_fim> (~Xh XXmin)
```

**Erro:** Mostrar mensagem de erro e sugerir `/apontamento-interno` manual (skill do geo-ops).

---

## Resumo Final

Ao terminar TUDO, apresentar para o user:

```
SUS-XXXX finalizada:

  PRs:
  - <repo>: PR #NNN (url)
  - <repo>: PR #NNN (url)

  Jira: Ready to Review (ou Done)
  Comentario: adicionado
  Apontamento: <hora_inicio> - <hora_fim> (ID: <idSaved>)
```

---

## Regras

1. **NUNCA** pedir confirmacao para o apontamento — lancar direto
2. **SEMPRE** incluir URLs das PRs no comentario Jira
3. **SEMPRE** incluir caminhos em tela no comentario
4. Se analise-only (sem PR): ir direto para Done, NAO para Ready to Review
6. NUNCA armazenar ou logar a senha do apontamento
