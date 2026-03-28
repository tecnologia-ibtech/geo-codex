---
name: sus-resolution
description: >-
  Orquestrador principal de tarefas SUS (Sustentacao/Maintenance). Busca a tarefa no Jira,
  identifica o produto/repo, avalia confianca, e delega para a skill de dominio correta
  (resolve-analytics, resolve-fvc, ou outra). Apos o fix, chama finalize-sus para Jira + apontamento.
  Triggers: /resolve-sus SUS-XXXX, /check-sus, 'resolver SUS', 'pegar tarefa SUS', ou qualquer
  mencao a chaves SUS-XXXX.
version: 2.0.0
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - Task
  - mcp__claude_ai_Atlassian__searchJiraIssuesUsingJql
  - mcp__claude_ai_Atlassian__getJiraIssue
  - mcp__claude_ai_Atlassian__transitionJiraIssue
  - mcp__claude_ai_Atlassian__addCommentToJiraIssue
  - mcp__claude_ai_Atlassian__getTransitionsForJiraIssue
  - mcp__claude_ai_Atlassian__editJiraIssue
  - mcp__plugin_playwright_playwright__browser_navigate
  - mcp__plugin_playwright_playwright__browser_click
  - mcp__plugin_playwright_playwright__browser_fill_form
  - mcp__plugin_playwright_playwright__browser_snapshot
  - mcp__plugin_playwright_playwright__browser_evaluate
  - mcp__plugin_playwright_playwright__browser_wait_for
  - mcp__plugin_playwright_playwright__browser_press_key
  - mcp__plugin_playwright_playwright__browser_type
  - mcp__plugin_playwright_playwright__browser_console_messages
  - mcp__plugin_playwright_playwright__browser_network_requests
  - mcp__plugin_playwright_playwright__browser_take_screenshot
  - mcp__plugin_playwright_playwright__browser_close
  - mcp__plugin_playwright_playwright__browser_navigate_back
  - mcp__plugin_playwright_playwright__browser_handle_dialog
  - mcp__plugin_playwright_playwright__browser_hover
  - mcp__plugin_playwright_playwright__browser_select_option
  - mcp__plugin_playwright_playwright__browser_tabs
---

# SUS Task Resolution — Orquestrador

Esta skill eh o ponto de entrada para resolver tarefas SUS. Ela NAO resolve o bug diretamente — ela
busca a tarefa, entende o que eh, e delega para a skill certa.

## Visao Geral do Fluxo

```
/resolve-sus SUS-XXXX
  │
  ├─ Step 0: Marcar hora inicio
  ├─ Step 1: Carregar padroes aprendidos (sus-lessons.md)
  ├─ Step 2: Buscar detalhes da tarefa (Playwright + Jira MCP)
  ├─ Step 3: Identificar produto/repo (repo-mapping + domain-keywords)
  ├─ Step 4: Avaliar confianca (3 dimensoes)
  │
  ├─ DECISAO: mudar para o projeto correto e usar a skill de la
  │   ├─ Analytics/Vaadin6 → cd geovendas-vaadin6 → /resolve-analytics
  │   ├─ Forca de Vendas   → cd pedidos → /resolve-sus
  │   ├─ Integracao .NET   → cd geovendas-dotnet → /resolve-sus
  │   └─ Outros repos      → investigar e resolver direto
  │
  └─ Step 5: Invocar `finalize-sus` para Jira + apontamento
```

**IMPORTANTE:** As skills de dominio agora vivem DENTRO dos projetos:
- `geovendas-vaadin6/.claude/commands/resolve-analytics.md`
- `pedidos/.claude/commands/resolve-sus.md`
- `geovendas-dotnet/.claude/commands/resolve-sus.md`

---

## Step 0: Marcar Hora de Inicio

**PRIMEIRA COISA A FAZER** — antes de qualquer outra acao:

```bash
date "+%Y-%m-%d %H:%M"
```

Guardar internamente:
- `_task_key`: chave SUS do argumento (ex: `SUS-6279`)
- `_date`: parte da data (YYYY-MM-DD)
- `_hora_inicio`: parte da hora (HH:MM)

> Esses valores serao usados no final para o apontamento de horas.

---

## Step 1: Carregar Padroes Aprendidos

Ler `${CLAUDE_PLUGIN_ROOT}/commands/sus-lessons.md`.

**O QUE EH ISSO:** Um arquivo com padroes que ja foram aprendidos em resolucoes anteriores.
Por exemplo: "quando a tarefa menciona 'Analytics', o repo eh geovendas-vaadin6".

Esses padroes TEM PRIORIDADE sobre as heuristicas default. Se um padrao diz que "X eh repo Y",
confiar nele antes de analisar keywords.

---

## Step 2: Buscar Detalhes da Tarefa

Usar **duas fontes** para entender a tarefa completamente:

### 2a. Playwright (fonte primaria — SEMPRE executar)

O Playwright captura o visual real da tarefa (incluindo imagens inline, formatacao, anexos).

1. Navegar ate a issue:
   ```
   browser_navigate(url: "https://geovendas.atlassian.net/browse/<TASK_KEY>")
   ```

2. Aguardar carregamento:
   ```
   browser_wait_for(text: "<TASK_KEY>")
   ```

3. Capturar snapshot de acessibilidade (le o texto da descricao):
   ```
   browser_snapshot()
   ```

4. Capturar screenshot full-page (ve imagens e anexos visuais):
   ```
   browser_take_screenshot(type: "png", fullPage: true)
   ```

5. Se houver imagens/anexos que precisam de detalhe: clicar e capturar outro screenshot.

6. Guardar:
   - `_playwright_description`: texto completo da descricao
   - `_attachment_context`: resumo do que foi visto nas imagens

#### Se o Playwright nao estiver logado no Jira

Se a navegacao redirecionar para login (URL contem "id.atlassian.com" ou texto "Log in"):
1. Informar: "Playwright nao esta autenticado no Jira. Usando apenas o Jira MCP."
2. Sugerir: "Para habilitar, rode `chrome-debug` e faca login no Jira."
3. Continuar com o Jira MCP como unica fonte.

### 2b. Jira MCP (fonte secundaria — dados estruturados)

```
getJiraIssue(cloudId: "geovendas.atlassian.net", issueIdOrKey: "<TASK_KEY>")
```

Usar para:
- **Validar assignee** (nao disponivel via Playwright)
- **Complementar** campos (status, customfields, lista de anexos)
- **Comparar** descricao com o que o Playwright renderizou — se divergir, Playwright prevalece

### Validar Assignee

Primeiro, ler o ID do dev atual:
```bash
echo "$JIRA_ACCOUNT_ID"
```

Se estiver vazio → parar e informar: "Configure `JIRA_ACCOUNT_ID` no seu shell (ver sus-lessons.md para instrucoes)."

**REGRA ABSOLUTA — nao tem excecao:**
- `assignee.accountId == $JIRA_ACCOUNT_ID` (voce) → prosseguir
- `assignee == null` (sem dono) → prosseguir
- **Qualquer outro** → **PARAR IMEDIATAMENTE**. Nao tocar em tarefa de outro dev.

---

## Step 3: Identificar Produto e Repositorio

Analisar titulo + descricao para descobrir qual produto/repo eh afetado.

### Ordem de checagem (mais confiavel primeiro):

1. **Tags explicitas** no titulo: `[DOTNET]`, `[B2B]`, `[FV]`, `[CRM]`, `[ETL]`
2. **Padroes aprendidos** do `sus-lessons.md` (Step 1)
3. **Keywords na descricao** — consultar `${CLAUDE_PLUGIN_ROOT}/skills/sus-resolution/references/domain-keywords.md`
4. **Versoes** — ISF/IFS = FV, IGS = Vaadin, `-enm` suffix = FV ENM
5. **Telas/features** especificas de um produto
6. **Contexto do usuario** — se veio com hint (ex: "/resolve-sus SUS-6279 eh no pedidos")

### Tabela de repos (resumo — ver `references/repo-mapping.md` para detalhes):

| Produto | Repo Principal | GitHub |
|---------|---------------|--------|
| Forca de Vendas | pedidos + geovendas-vaadin6 | tecnologia-ibtech/pedidos |
| FV (ENM) | pedidos-enm + geovendas-vaadin6 | tecnologia-ibtech/pedidos-enm |
| Analytics / Vaadin 6 | geovendas-vaadin6 | tecnologia-ibtech/geovendas-vaadin6 |
| Integracao .NET | geovendas-dotnet | tecnologia-ibtech/geovendas-dotnet |
| StockCentral | geovendas-dotnet/StockCentral | tecnologia-ibtech/geovendas-dotnet |
| B2B | geovendas-b2b | tecnologia-ibtech/geovendas-b2b |
| CRM 360 | geovendas-vue | tecnologia-ibtech/geovendas-vue |
| ETL | geovendas-java8-etl | tecnologia-ibtech/geovendas-java8-etl |
| Vaadin 23 | geovendas-vaadin23 | tecnologia-ibtech/geovendas-vaadin23 |
| FV Malharia | geo-fv-malharia | tecnologia-ibtech/geo-fv-malharia |

**Dual-repo (IMPORTANTE):**
- FV = `pedidos` (mobile) + `geovendas-vaadin6` (web admin) — checar AMBOS
- FV ENM = `pedidos-enm` + `geovendas-vaadin6` — checar AMBOS
- Vaadin 23 = ate 6 sub-repos (services, repository, entity, utils, view-crm, java17-lib)

---

## Step 4: Avaliar Confianca

Avaliar 3 dimensoes antes de tentar resolver:

| Dimensao | HIGH (posso resolver) | LOW (preciso de ajuda) |
|----------|----------------------|------------------------|
| **Repo** | Match claro, repo unico | Ambiguo, multiplos repos possiveis |
| **Bug clarity** | Erro especifico, steps de reproducao, screenshots claros | Vago, "nao funciona", sem detalhes |
| **Actionability** | Fix no codigo, dentro do repo | Infra, DB manual, dependencia externa |

### Decisao:

- **Todos HIGH** → prosseguir para a resolucao
- **Qualquer LOW (modo interativo)** → perguntar ao usuario o que falta
- **Qualquer LOW (modo cron/automatico)** → notificar via `${CLAUDE_PLUGIN_ROOT}/scripts/notify.sh`

### Formato da notificacao para LOW confidence:

```
SUS-6279: "Filtro de Itens Promocionais nao funciona"
Entendi: Bug no filtro de itens promocionais. Cliente usa ISF 2026.8.3881 (Forca de Vendas).
Falta: Pode ser no pedidos (filtro mobile) ou geovendas-vaadin6 (filtro web). Nao da pra saber pela descricao.
Acao: Em qual app o filtro esta quebrado — mobile (pedidos) ou web (vaadin6)?
```

---

## Step 5: Delegacao — Mudar para o Projeto Correto

Baseado no produto identificado no Step 3, **mude para o diretorio do projeto** e use a skill de la:

### Se for Analytics / Vaadin 6 / GEOvendas:

```bash
cd /home/gab/repo/geovendas/geovendas-vaadin6
```
→ Invocar `/resolve-analytics SUS-XXXX`

**Quando:** Tarefa menciona Analytics, Consulta de Vendas, relatorios, dashboards, GeoTempVendas, DataSource, de-para de representantes, filtro de exclusao, integracao de dados no painel administrativo.

### Se for Forca de Vendas (pedidos ou pedidos-enm):

```bash
cd /home/gab/repo/geovendas/pedidos
# ou para ENM:
cd /home/gab/repo/geovendas/pedidos-enm
```
→ Invocar `/resolve-sus SUS-XXXX` (inclui skills `/fv`, `/geo-*`)

**Quando:** Tarefa menciona representante, digitacao de pedido, sincronizacao, app mobile, ISF, carrinho, PouchDB, duplicatas de itens, totais errados.

### Se for Integracao .NET (geovendas-dotnet):

```bash
cd /home/gab/repo/geovendas/geovendas-dotnet
```
→ Invocar `/resolve-sus SUS-XXXX`

**Quando:** Tarefa menciona integracao com ERP, webservice, .NET, DOTNET, importacao de pedido para ERP, erro de integracao.

### Se for qualquer outro produto (B2B, CRM, ETL, Vaadin 23, etc.):
→ Investigar e corrigir o bug diretamente no repo (Grep, Read), criar branch/commit/PR manualmente.

**IMPORTANTE:** Cada projeto tem seu proprio fluxo de git (branch, commit, PR, GeoLens). As skills de dominio ja cuidam disso — voce NAO precisa gerenciar git separadamente.

---

## Step 6: Finalizacao

Apos a skill de dominio ter concluido o fix e criado as PRs:

→ Invocar skill `finalize-sus` passando:
- `_task_key`: chave da tarefa
- `_date`: data de inicio
- `_hora_inicio`: hora de inicio
- URLs das PRs criadas
- Resumo do que foi feito

A skill `finalize-sus` cuida de:
- Comentario no Jira
- Transicao de status
- Salvar padroes aprendidos
- Apontamento de horas (via geo-ops)

---

## Finalization-Only Mode

Se chamado via `/finalizar-tarefa-sus` ou "finalizar tarefa SUS" — o fix JA FOI FEITO.

Nesse caso, pular direto para detectar repos com alteracoes e chamar `resolve-git` + `finalize-sus`.

### Detectar repos com alteracoes:

Para CADA repo da tabela, verificar:

```bash
cd <diretorio> && git status --short && git log origin/$(git symbolic-ref refs/remotes/origin/HEAD --short | sed 's|origin/||')..HEAD --oneline 2>/dev/null
```

Coletar apenas repos que tem: arquivos modificados, commits nao pushados, ou branches com alteracoes.

### Edge cases:
- User ja criou PR manualmente → pular git, so fazer `finalize-sus`
- Nenhuma alteracao em nenhum repo → perguntar ao user se deve so mover a tarefa
- Duvida sobre quais arquivos incluir → confirmar com user antes

---

## Regras (LEIA TUDO — sao inviolaveis)

1. **NUNCA** tocar em tarefa de outro dev — so tarefas assigned a voce ou unassigned
2. **NUNCA** mover para In Progress sem confianca de resolver
3. **NUNCA** commitar arquivos nao intencionais (version.json, auto-gerados)
4. **NUNCA** usar `git add -A` — sempre `git add <arquivos-especificos>`
5. **TODA** PR criada DEVE ser enviada ao GeoLens — sem excecao, independente do repo
6. **TODA** PR DEVE conter o link da tarefa SUS no body
7. **TODO** comentario Jira em tasks com PR DEVE incluir as URLs das PRs
8. **SEMPRE** checar `sus-lessons.md` ANTES de analisar — padroes aprendidos tem prioridade
9. Se FV: checar AMBOS `pedidos` e `geovendas-vaadin6`
10. Se Vaadin 23: pode afetar multiplos sub-repos
11. Se FV com bug de dados (duplicados, totais errados, sync): usar browser testing antes de mexer no codigo
12. Se user forneceu contexto junto com o key: usar direto (ex: "/resolve-sus SUS-6279 eh no pedidos")
