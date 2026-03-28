# SUS Task Resolution Lessons

Learned patterns from resolving SUS tasks. Updated automatically after user corrections.
Referenced by the sus-resolution skill before analyzing any task.

## Setup do Dev (variaveis de ambiente)

Cada dev precisa configurar no seu `~/.zshrc` (macOS) ou `~/.bashrc` (Linux):

```bash
export JIRA_ACCOUNT_ID="seu-account-id-do-jira"     # Obrigatorio: seu ID no Atlassian
export APONTAMENTO_USER="seu_usuario"                 # Obrigatorio: login do apontamento
export APONTAMENTO_PASSWORD="sua_senha"               # Obrigatorio: senha do apontamento
export GEOLENS_USER="seu_usuario_geolens"             # Obrigatorio: user para submeter PRs ao GeoLens
export BACKUP_REMOTE_DEST="user@server:/path/backup"   # Opcional: destino do backup remoto
```

Para encontrar seu `JIRA_ACCOUNT_ID`: abra qualquer task no Jira, clique no seu avatar, e veja a URL — o ID esta la.

## Identity

- NUNCA pegar tasks de outros usuarios. So tasks assigned a voce (via `$JIRA_ACCOUNT_ID`) OU unassigned.

## Repo Identification Patterns

- "Analytics", "Consulta de Vendas", "Consulta de Vendas por Estado" → geovendas-vaadin6 (GeoTempVendas1, GeoTempVendas2, Vendas6Query)
- "integracao de vendas" → pode ser a tela Vendas6Query OU a fonte de dados do ERP (verificar contexto)

## Jira Transition: SUS Tasks

### Send to Revision (Ready to Review) — Transition ID 21
- Campo "Feature" = customfield_10095, usar {"value": "Suporte"} para tarefas SUS
- Campo "Necessario atualizar" = customfield_10133, usar [{"value": "Nenhum"}] se nao houve alteracao
- Campo "Resolution" NAO eh aceito nesta tela de transicao (retorna erro)

### Finish Attendance (Done) — Transition ID 131
- Campo "Resolution" = obrigatorio, usar {"name": "Done"}
- Disponivel a partir de Ready to Review

### Regra: Analise sem PR → Done (nao Ready to Review)
- Se a tarefa eh de analise e NAO gerou PR/alteracao de codigo, ir direto para Done
- Ready to Review so faz sentido quando ha codigo para revisar

## Atendente Quirks

<!-- How specific support agents describe issues -->
<!-- Format: Agent name → pattern/tendency -->

## Common False Positives

<!-- Things that looked like product X but were actually product Y -->

## Resolution Patterns

- "Dados de vendas nao aparecem no Analytics" → verificar tabela `geointegracaodatasourcerepresdepara` (de-para de representantes). O de-para pode estar invertido, mapeando rep ativo → rep inativo. Verificar: 1) geovendas1 tem dados para o codrepres? 2) georepresentante tem o rep com situacao=1 e municipio? 3) existe de-para mapeando para outro CNPJ?
- Caminho UI do de-para: Analytics - Mapas → Configuracoes → Representante De-Para
- `GeoTempVendas.preCarregarRepres()` pula reps sem municipio (getMunicipio()==null) — dados de venda ficam orfaos silenciosamente
- "Divergencia de valor ERP x Analytics/Consulta de Vendas" → verificar duplicatas em `geovendas1` para os pedidos mencionados. Causa comum: `filtroExclusaoVendas1` (campo de exclusao) usa campo diferente da SQL de importacao (ex: `dataEmissao` vs `dataReferencia`), causando acumulo de registros. **Resolucao eh via configuracao (corrigir o filtro), NAO via codigo.**

## Decision Rules

- Se o problema pode ser resolvido via configuracao no front/painel de admin/SQL de integracao, resolver la — NAO criar PR com alteracao de codigo
- Analise sem PR → Jira direto para Done (transition 131), nao Ready to Review

## Jira Comment Rules

- Nos comentarios da tarefa, SEMPRE dar o **caminho em tela** quando existir (ex: "Analytics → Configuracoes → campo Filtro de Exclusao Vendas1")
- Informar **nome dos campos** na tela que precisam ser alterados
- SQL direto somente quando NAO existir tela/admin para configurar
- O atendente precisa conseguir resolver sem abrir banco de dados

## PR Rules

- SEMPRE incluir o link da tarefa Jira no body da PR. Formato: `**Jira:** https://geovendas.atlassian.net/browse/<TASK_KEY>`

## Apontamento Interno — Regras Criticas

- O MCP tool se chama `mcp__apontamento__geovendas_criar_apontamento` (SEM `_jira` no final). O nome `geovendas_criar_apontamento_jira` NAO existe e retorna "Unknown tool".
- **NUNCA usar curl** para chamar o endpoint REST de apontamento. SEMPRE usar o MCP tool nativo do Codex.
- O MCP server `apontamento` esta em `http://192.168.37.206:8100/mcp` — URL fixa, interna, nao eh a URL publica do geovendas.com.
- Se as variaveis `APONTAMENTO_USER`/`APONTAMENTO_PASSWORD` nao estiverem visiveis, rodar `source ~/.bashrc` (Linux) ou `source ~/.zshrc` (macOS) antes.
- Parametros obrigatorios: `usuario`, `data`, `hora_inicio`, `hora_fim`, `task_key`, `auth_user`, `auth_password`. Campos `tipo` e `situacao` default 9999.

## Meta

- TODA instrucao/correcao do usuario deve ser salva neste arquivo (sus-lessons.md) E commitada no repo do plugin
