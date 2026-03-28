---
name: fix-sus-pr
description: >-
  Recebe uma PR do GeoLens com comentarios de rejeicao e age sobre ela: se o
  comentario eh valido, implementa o fix e faz push; se nao procede, comenta
  no PR explicando o motivo. Em ambos os casos, reenvia a PR ao GeoLens para
  nova revisao. Triggers: /fix-sus-pr <PR_URL>, 'corrigir PR rejeitada',
  'responder revisao GeoLens', 'fix PR review'.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Fix SUS PR — Resposta a Revisao GeoLens

Quando o GeoLens (code review automatizado) rejeita uma PR, essa skill processa
TODOS os comentarios e responde adequadamente: corrige o que for valido, contesta
o que nao procede, e SEMPRE reenvia para nova revisao.

---

## Entrada

```
/fix-sus-pr <PR_URL>
```

Exemplo: `/fix-sus-pr https://github.com/tecnologia-ibtech/geovendas-entity/pull/194`

---

## Workflow Passo a Passo

### Step 1: Inspecionar o PR

```bash
gh pr view "<PR_URL>" --json title,body,comments,reviews,headRefName,baseRefName,url,files
```

Coletar:
- `_pr_url`: URL completa
- `_branch`: headRefName (branch do PR)
- `_repo`: repositorio (extrair da URL, formato: `owner/repo`)
- `_pr_number`: numero do PR

### Step 2: Buscar Comentarios de Revisao

```bash
gh api repos/<OWNER>/<REPO>/pulls/<PR_NUMBER>/comments
gh api repos/<OWNER>/<REPO>/pulls/<PR_NUMBER>/reviews
```

Montar lista de rejeicoes — cada item com: id, autor, arquivo, linha, texto.

Se NAO houver comentarios de rejeicao → pular direto para Step 5 (retry GeoLens).

### Step 3: Classificar Cada Comentario

Para cada comentario, decidir: **VALIDO** ou **NAO PROCEDE**.

#### Criterios de VALIDO (precisa corrigir):
- Aponta bug real, logica incorreta, ou violacao de padrao do projeto
- Identifica codigo que quebra comportamento esperado
- Detecta problema de seguranca, performance, ou convencao documentada

#### Criterios de NAO PROCEDE (pode contestar):
- O comportamento apontado eh intencional e correto para o contexto
- O comentario se baseia em premissa incorreta sobre o dominio
- O padrao sugerido nao se aplica ao tipo de mudanca feita
- A issue ja foi resolvida de outra forma no mesmo PR

**Na duvida?** Tratar como VALIDO e implementar a correcao mais conservadora.

### Step 4: Agir sobre Cada Comentario

#### Para comentarios VALIDOS:

1. Fazer checkout do branch:
```bash
cd <REPO_DIR>
git checkout <BRANCH>
git pull origin <BRANCH>
```

2. Ler o arquivo, entender o contexto, implementar o fix

3. Commit e push:
```bash
git add <arquivos-alterados>
git commit -m "fix: <descricao do problema corrigido per review GeoLens>"
git push origin <BRANCH>
```

4. Responder ao comentario no PR:
```bash
gh api repos/<OWNER>/<REPO>/pulls/<PR_NUMBER>/reviews \
  -X POST \
  -f body="Corrigido. <breve descricao do que foi alterado>" \
  -f event="COMMENT"
```

#### Para comentarios NAO PROCEDE:

Responder diretamente com justificativa clara:

```bash
gh api repos/<OWNER>/<REPO>/pulls/comments/<COMMENT_ID>/replies \
  -X POST \
  -f body="Esse comportamento eh intencional porque: <razao tecnica ou de dominio>."
```

### Step 5: Reenviar ao GeoLens (OBRIGATORIO — SEMPRE)

Independente do que foi feito (fix, contestacao, ou nenhum comentario):

```bash
curl -X POST http://192.168.37.206:8001/api/pr-reviews \
  -H "Content-Type: application/json" \
  -d '{"url": "<PR_URL>", "submitted_by": "fix-sus-pr"}'
```

Se o endpoint nao responder → logar o erro e reportar ao user. Nao bloquear.

---

## Resumo Final

```
PR: <url>

Comentarios processados: N
  - Corrigidos: X  (commits: ...)
  - Contestados: Y  (explicacao inline no PR)

GeoLens retry: OK | FALHOU (<motivo>)
```

---

## Regras

1. Processar TODOS os comentarios — nao pular nenhum
2. Na duvida, tratar como VALIDO e corrigir
3. **NUNCA** force push — apenas push normal
4. O retry no GeoLens eh **OBRIGATORIO** em qualquer cenario
5. Usar `gh pr view` e `gh api` — NAO abrir browser para inspecionar PR
