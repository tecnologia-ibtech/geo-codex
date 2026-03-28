---
name: doc
description: >-
  Cria, edita e gerencia documentacao de features no Outline (wiki Geovendas).
  Use quando o usuario diz /doc, pede para "documentar feature", "criar documentacao",
  "atualizar doc", "documentar funcionalidade", ou menciona criar/editar documentacao
  de produto no Outline.
---

# Skill: doc

Gerencia documentacao de features na wiki Geovendas (Outline). Cria documentos padronizados dentro da collection "Documentacoes", organiza por produto e segue template definido.

---

## Template de Documentacao (referencia obrigatoria)

Toda documentacao nova usa exatamente este template. As 5 secoes abaixo sao obrigatorias, nesta ordem, com estes titulos exatos. Nao adicionar, remover ou renomear secoes.

### Principio fundamental: separacao de conteudo

O publico principal da documentacao sao usuarios de negocio, analistas, suporte e gestores — nao desenvolvedores. Por isso:

- **Secoes 1 a 4 (Objetivo, Fluxo, Ativacao, Origem)** devem ser escritas em linguagem acessivel, sem jargao tecnico. O leitor deve entender o que a feature faz e como usa-la sem precisar conhecer o codigo.
- **Secao 5 (Consideracoes Tecnicas)** e o unico lugar para informacoes tecnicas: nomes de componentes, endpoints, tabelas de banco, trechos de codigo, configuracoes de ambiente, detalhes de implementacao, nomes de classes/metodos, etc.

Se durante a escrita de qualquer secao (1 a 4) surgir um detalhe tecnico, mover para "Consideracoes Tecnicas" e, se necessario, referenciar brevemente: _"(ver Consideracoes Tecnicas para detalhes de implementacao)"_.

```markdown
# **Objetivo / Contexto**

## **Problema:**

> Descrever o problema ou necessidade do ponto de vista do usuario/negocio.
> Evitar termos tecnicos — focar no impacto pratico.

## **Solucao:**

> Explicar como a feature resolve o problema, em linguagem acessivel.
> Focar no valor entregue, nao na implementacao.

---

# Fluxo

> Guia pratico e detalhado de como a feature funciona no dia a dia.
> Escrever como se estivesse explicando para um colega de outra area:
> - Onde encontrar a funcionalidade (menus, telas, botoes)
> - O que acontece em cada etapa (com prints/screenshots se disponivel)
> - Exemplos concretos de uso
> - Comportamentos esperados e mensagens que o usuario vera
>
> NAO incluir: nomes de componentes, classes, endpoints, queries SQL,
> ou qualquer detalhe de codigo. Esses vao em "Consideracoes Tecnicas".

---

# **Ativacao**

> Passo a passo de como ativar ou configurar a feature.
> Usar linguagem direta: "Acesse tal menu", "Clique em tal botao", "Selecione a opcao X".
> Se houver configuracoes tecnicas (variaveis de ambiente, flags, crontab),
> mencionar apenas o efeito pratico aqui e detalhar a configuracao em "Consideracoes Tecnicas".

---

# **Origem**

> Link do chamado que originou a funcionalidade.

---

# **Consideracoes Tecnicas**

> Secao destinada a desenvolvedores e equipe tecnica.
> Aqui entram TODAS as informacoes tecnicas da feature:
> - Componentes e modulos envolvidos (nomes de classes, services, controllers)
> - Endpoints e rotas de API
> - Tabelas e campos de banco de dados afetados
> - Configuracoes de ambiente, flags, variaveis
> - Detalhes de crontab, jobs, filas
> - Trechos de codigo relevantes
> - Dependencias entre servicos
> - Qualquer informacao que outro desenvolvedor precise para dar manutencao
```

**Regras do template:**
- O template acima e o padrao obrigatorio para toda documentacao nova. Todas as secoes (Objetivo/Contexto, Fluxo, Ativacao, Origem, Consideracoes Tecnicas) devem estar presentes, na mesma ordem, com os mesmos titulos. Nao inventar secoes extras, nao remover secoes, nao reorganizar.
- Recurso plus [RP]: mencionar na secao "Ativacao" que e premium e como ativar.
- Crontab: documentar a configuracao do crontab na secao "Ativacao".
- Sempre usar markdown.
- Documentacao parcial: criar template completo, preencher apenas secoes solicitadas, demais recebem `> A preencher`.

**Quando desviar do template (e somente nestes casos):**
- **Editando documento existente que ja usa outro formato:** respeitar o formato existente do documento. Nao reformatar para o template padrao a menos que o usuario peca.
- **Usuario pede explicitamente outro formato:** so se o usuario disser claramente que quer uma estrutura diferente (ex: "nao usa o template", "faz num formato livre", "quero so um paragrafo").
- Em qualquer outro caso, usar o template padrao sem excecao.

---

## FASE 0 — Parse + Validacao (silenciosa)

Fase sem interacao com o usuario. Executar dois tracks em paralelo:

**Host:** `https://docs.geovendas.com` (configurado via MCP server `outline` no `.mcp.json`)

### Track A — Extrair info da mensagem inicial

Analisar a mensagem do usuario e extrair o maximo possivel:

- **Feature:** quase sempre presente no texto (ex: "documentar filtro de segmento")
- **Produto:** detectar por keywords usando este mapeamento interno:

| Produto | Keywords | ID (interno — nunca mostrar ao usuario) |
|---|---|---|
| B2B | b2b, catalogo, ecommerce | `ca5e4f10-2f30-4890-8d7e-d04a7dbf5b8f` |
| CRM | crm, crm360, 360, relacionamento | `23cb6761-aff4-47e5-9514-507818f799d2` |
| Servicos | servicos, service, ordem de servico, os | `ed7fa041-c6a4-44ae-8d27-ab8c3f8fb242` |
| Analytics | analytics, relatorios, dashboard, bi | `362f0865-61c2-404c-8730-c62e4ed1d787` |
| Forca de Vendas (Textil) | textil, forca de vendas textil, isf textil | `6df4c797-3a6c-4d5a-a9b2-60b326415629` |
| Forca de Vendas (Confeccao) | confeccao, forca de vendas confeccao, isf confeccao | `91d8b213-6e91-4e8d-9518-6ceb71281958` |

- **Fontes:** detectar automaticamente pelo formato:
  - `#123` ou `PR #123` → Pull Request
  - `GEO-1234` → chamado Jira
- **Flags:** detectar mencoes a "recurso plus", "RP", "parcial"

### Dicionario de configuracoes

Ao encontrar nomes de tabelas de configuracao no codigo ou em fontes (PRs, Jira), substituir pelo nome amigavel na documentacao. Nunca usar o nome tecnico da tabela nas secoes 1 a 4 — usar a descricao abaixo:

| Tabela (nome tecnico) | Usar na documentacao como |
|---|---|
| B2SPCfgGeral | Configuracao geral do Forca de Vendas |
| CRMCfgGeral | Configuracao geral do CRM |
| GeoConfigModulos | Configuracao geral de modulos do GEOvendas |

### Track B — Validar infraestrutura

1. Chamar `list_collections()`.
2. Procurar pela collection com ID `750fc124-e315-4380-baf3-29c929e9fb97`.
3. Se **nao encontrar**: informar o usuario que a collection nao existe e **PARAR**. Nao prosseguir.

---

## FASE 1 — Confirmacao unica (1 round-trip)

Apresentar um **card de confirmacao unico** com base no que foi extraido na FASE 0. Tres cenarios possiveis:

### Cenario A — Feature + produto detectados

Quando a FASE 0 conseguiu extrair feature e produto:

```
Entendi que voce quer documentar:
  Feature:  <nome extraido>
  Produto:  <produto detectado>
  Fontes:   <PRs e/ou Jira detectados, ou "Nenhuma">
  RP / Parcial: Nao

Confirma? Pode ajustar qualquer campo ou adicionar fontes.
```

### Cenario B — Produto nao detectado

Quando a feature foi identificada mas o produto nao:

```
Entendi que voce quer documentar:
  Feature:  <nome extraido>
  Produto:  ?

Qual produto?
  1. B2B  2. CRM  3. Servicos  4. Analytics
  5. Forca de Vendas (Textil)  6. Forca de Vendas (Confeccao)
```

### Cenario C — Sem contexto (ex: `/doc` puro)

Quando a mensagem nao contem informacao suficiente:

```
O que voce quer documentar e em qual produto?
  1. B2B  2. CRM  3. Servicos  4. Analytics
  5. Forca de Vendas (Textil)  6. Forca de Vendas (Confeccao)

Exemplo: "Filtro de segmento no CRM, baseado na PR #456 e GEO-1234"
```

### Re-parse de cada resposta

Se o usuario confirmar e adicionar informacao extra (ex: "ok, e usa o PR #789 tambem"), capturar e incorporar automaticamente.

### Regras da FASE 1

- **Produto nunca e auto-selecionado sem confirmacao.** Mesmo no Cenario A, o usuario precisa confirmar.
- **RP e Parcial** tem default "Nao" — nao perguntar ativamente. Mencionar como opcao no rodape do card apenas se relevante.
- **Nunca mostrar UUIDs** ao usuario. IDs de collections e sub-pastas sao detalhes internos.
- **Aguardar confirmacao explicita** antes de prosseguir.

### Apos confirmacao do usuario

Executar automaticamente, sem interacao adicional:

1. **Buscar docs existentes:**
   - `search_documents(query="<nome da feature>")` — buscar docs similares.
   - `get_collection_structure(collectionId="750fc124-e315-4380-baf3-29c929e9fb97")` — verificar estrutura da sub-pasta escolhida.

2. **Buscar dados de fontes** (se informadas):
   - **PRs via GitHub CLI:**
     ```bash
     gh pr view <numero> --json title,body,files,additions,deletions,mergedAt
     gh pr diff <numero>
     ```
     Extrair: arquivos alterados, features implementadas, endpoints, configuracoes, descricao do PR e comentarios relevantes.
   - **Chamados Jira via MCP Atlassian:**
     ```
     getJiraIssue(issueIdOrKey="GEO-1234", fields=["*all"], expand="names", responseContentFormat="markdown")
     ```
     Extrair: descricao do chamado, criterios de aceite, comentarios relevantes, links para PRs.
     **Importante:** Sempre ler tambem o campo customizado `customfield_10066` ("Descricao do procedimento"). Este campo contem cenarios de teste, instrucoes de validacao e dicas de QA escritas pelo desenvolvedor. Usar esse conteudo como fonte complementar para as secoes "Fluxo" e "Consideracoes Tecnicas".

3. **Se encontrar doc existente**, perguntar: "Ja existe documentacao similar: `<titulo>`. Deseja atualizar a existente ou criar nova?"
   - Se atualizar: usar `read_document()` para ler o conteudo atual.

4. Ir direto para FASE 2 (Preview).

---

## FASE 2 — Preview antes/depois

Antes de publicar no Outline, mostrar ao usuario exatamente o que sera publicado — direto na conversa/terminal. O usuario precisa ver o conteudo e aprovar antes de qualquer escrita no Outline.

### Para documentacao nova

1. Gerar o markdown completo seguindo exatamente o template definido na secao "Template de Documentacao" no inicio desta skill.
2. **Validar antes de mostrar** — conferir que o conteudo gerado contem as 5 secoes obrigatorias, nesta ordem:
   - `# **Objetivo / Contexto**` (com sub-secoes `## **Problema:**` e `## **Solucao:**`)
   - `# Fluxo`
   - `# **Ativacao**`
   - `# **Origem**`
   - `# **Consideracoes Tecnicas**`
   Se alguma secao estiver faltando, renomeada ou fora de ordem, corrigir antes de mostrar ao usuario.
3. Mostrar o conteudo na conversa com o seguinte formato:

```
📄 PREVIEW — Nova documentacao: <Nome da Feature>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<conteudo markdown completo que sera publicado>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

4. Perguntar: "Posso publicar no Outline? Se quiser ajustes, me diga o que mudar."

### Para atualizacao de documentacao existente

1. Ler o documento atual com `read_document()`.
2. Gerar o conteudo atualizado (preservando o que ja existe + aplicando as mudancas).
3. Mostrar os dois lado a lado na conversa:

```
📄 ANTES (conteudo atual no Outline):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<conteudo atual completo>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 DEPOIS (conteudo proposto):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<conteudo novo completo>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

4. Perguntar: "Posso aplicar essas mudancas no Outline? Se quiser ajustes, me diga o que mudar."

### Regras do preview

- Mostrar **sempre** o preview, nao e opcional. O usuario precisa ver o que sera publicado.
- Se o usuario pedir ajustes, aplicar as mudancas e mostrar o preview novamente.
- Repetir ate o usuario aprovar.
- Somente apos aprovacao explicita ("ok", "pode publicar", "aprovado", "sim", etc.) prosseguir para a FASE 3.
- Se o conteudo for muito longo, dividir em secoes e mostrar cada uma, mas sempre mostrar o conteudo completo antes de publicar.

---

## FASE 3 — Criacao / Edicao

### Criar nova documentacao

1. **Criar doc-pai** (funciona como pasta da feature):
```
create_document(
  title="<Nome da Feature>",
  collectionId="750fc124-e315-4380-baf3-29c929e9fb97",
  parentDocumentId="<ID da sub-pasta do produto>",
  text="",
  publish=true
)
```

2. **Criar "Documentacao padrao"** como filho do doc-pai:
```
create_document(
  title="Documentacao padrao",
  collectionId="750fc124-e315-4380-baf3-29c929e9fb97",
  parentDocumentId="<ID do doc-pai criado>",
  text="<template preenchido>",
  publish=true
)
```

3. **Se cliente especifico**: criar doc adicional com apenas as diferencas:
```
create_document(
  title="Documentacao #NOME_CLIENTE",
  collectionId="750fc124-e315-4380-baf3-29c929e9fb97",
  parentDocumentId="<ID do doc-pai criado>",
  text="<apenas diferencas em relacao ao padrao>",
  publish=true
)
```

### Atualizar documentacao existente

1. **Sempre** ler o documento antes: `read_document(id="<doc-id>")`.
2. Editar o conteudo preservando o que ja existe.
3. Atualizar: `update_document(id="<doc-id>", text="<conteudo completo>")`.

> **ATENCAO:** `update_document` substitui o conteudo inteiro. Sempre ler antes de atualizar.

---

## FASE 4 — Resultado

Informar ao usuario o que foi feito:
- Documentos criados/atualizados (titulos e links)
- Estrutura final (doc-pai > filhos)
- Proximos passos sugeridos (ex: preencher secoes pendentes, revisar conteudo)

---

## Regras Gerais

**SEMPRE:**
- Parsear a mensagem inicial para extrair o maximo de informacao antes de perguntar (FASE 0)
- Apresentar card de confirmacao unico e aguardar confirmacao antes de prosseguir (FASE 1)
- Confirmar produto com o usuario — pode sugerir com base em keywords, mas nunca assumir sozinho
- Detectar fontes (PRs, Jira) automaticamente pelo formato (#123, GEO-1234) — nao perguntar separadamente
- Re-parsear cada resposta do usuario para capturar informacao adicional
- Buscar documentacao existente apos confirmacao, antes de gerar conteudo

**NUNCA:**
- Criar documentos fora da collection "Documentacoes" (ID: `750fc124-e315-4380-baf3-29c929e9fb97`)
- Criar documentos na raiz da collection — sempre dentro de uma sub-pasta de produto
- Executar acoes destrutivas sem confirmacao
- Criar documentacao nova fora do template padrao (a nao ser que o usuario peca explicitamente)
- Alterar o formato de um documento existente sem que o usuario solicite
- Escolher a sub-pasta de produto sem confirmacao explicita do usuario
- Mostrar UUIDs de collections ou sub-pastas ao usuario — sao detalhes internos
- Fazer perguntas sequenciais uma por vez — consolidar tudo no card de confirmacao

---

## Erros Comuns

| Erro | Causa | Solucao |
|---|---|---|
| Collection nao encontrada | MCP Outline nao configurado ou collection removida | Verificar configuracao do MCP server e existencia da collection |
| Documento duplicado | Ja existe documentacao para a feature | Perguntar ao usuario se deseja atualizar a existente |
| Sub-pasta nao encontrada | ID da sub-pasta mudou | Usar `get_collection_structure` para buscar ID atualizado |
| Conteudo perdido ao atualizar | `update_document` substitui tudo | Sempre ler o documento antes de atualizar |
