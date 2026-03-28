---
name: jira-geo-task
model: opus
description: "Implementacao completa de tarefas Jira do projeto GEO. Use quando o usuario passar um numero de tarefa (ex: GEO-11244) e pedir para implementar, desenvolver ou trabalhar na task. Faz leitura da tarefa no Jira, leitura dos padroes do AGENTS.md, planejamento detalhado em modo plan com opus, implementacao seguindo as convencoes do projeto, e checklist final de qualidade."
allowed-tools: Read, Glob, Grep, Edit, Write, Bash, Agent
---

# Jira GEO Task — Implementação Completa

Skill para ler, planejar e implementar tarefas do projeto GEO seguindo os padrões do repositório atual.

---

## Fase 0 — Verificação de Branch

**Antes de qualquer leitura ou planejamento**, verificar em qual branch o repositório está:

```bash
git branch --show-current
```

**Se a branch atual for `master` ou `main`:**

Solicitar interativamente o nome da branch ao usuário:

> "Você está na branch `master`. Qual deve ser o nome da nova branch para esta task?"
> Sugestão de formato: `<usuario>/<cliente>/feat/GEO-XXXX`

Após receber o nome:
```bash
git checkout -b <nome-da-branch>
```

Confirmar ao usuário que a branch foi criada e que o trabalho continuará nela.

**Se já estiver em uma branch de feature:** continuar sem interrupção.

---

## Fase 1 — Leitura da Tarefa e Contexto

### 1.1 Buscar tarefa no Jira

```
getJiraIssue(cloudId="geovendas.atlassian.net", issueIdOrKey="GEO-XXXX", expand="names")
```

### 1.2 Extrair informações relevantes

- Título e descrição completa
- Acceptance Criteria / critérios de aceite
- Subtasks (se houver)
- Comentários relevantes (PO, QA)
- Attachments / screenshots de referência

### 1.3 Carregar padrões do projeto

**Leitura obrigatória antes de planejar:**

**1. Ler `AGENTS.md` na raiz do projeto** — contém as regras críticas, arquitetura, convenções gerais e referências para os agentes específicos. Este é o ponto de entrada principal dos padrões do repositório.

**2. Listar e ler os arquivos de agente do projeto conforme a área da task:**

```bash
ls .claude/agents/
```

O próprio `AGENTS.md` descreve quais agentes existem e quando cada um deve ser lido. Ler os que forem relevantes para a área de impacto da task (arquitetura, views, componentes, nomenclatura, domínio de negócio, libs, etc.).

> Não assuma nada sobre os padrões do projeto — leia os arquivos antes de planejar.

---

## Fase 2 — Planejamento (Modo OpusPlan)

Entrar em modo de planejamento com o modelo Opus usando o comando `/opusplan`. **Não escrever nenhum código** antes do plano ser aprovado.

### 2.1 Análise de impacto

Identificar:
- Quais camadas serão afetadas (Entity / Repository / Service / View)
- Quais arquivos existentes serão modificados
- Quais arquivos novos precisarão ser criados
- Dependências entre as mudanças

### 2.2 Estrutura do plano

```
## Contexto da Task
<resumo do que a task pede>

## Arquivos a Modificar
- `caminho/Arquivo.java` — motivo

## Arquivos a Criar
- `caminho/NovoArquivo.java` — propósito

## Decisões de Design
- <decisão 1: qual padrão/abordagem e por quê>

## Sequência de Implementação
1. <passo 1>
2. <passo 2>
...

## Perguntas em Aberto
- <dúvida, se houver>
```

### 2.3 Fluxograma da Funcionalidade

**Antes de apresentar o plano para aprovação**, gerar um fluxograma em ASCII com quadros ilustrando o fluxo da funcionalidade que será desenvolvida.

O fluxograma deve mostrar:
- O fluxo principal do ponto de vista do usuário/sistema (não o plano de implementação)
- As entidades e camadas envolvidas e como se relacionam
- Decisões e ramificações relevantes (ex: validações, condições de negócio)
- Integrações com outros sistemas ou serviços, se houver

Usar quadros ASCII com os caracteres `┌ ─ ┐ │ └ ┘ ▼ ◄ ►` para desenhar o fluxo. Exemplo de formato:

```
┌─────────────────────────┐
│  Usuário acessa a tela  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Preenche formulário    │
└────────────┬────────────┘
             │
             ▼
        ┌─────────┐
        │  Dados  │
        │ válidos?│
        └────┬────┘
    Não ◄────┘────► Sim
     │                │
     ▼                ▼
┌──────────┐   ┌──────────────┐
│  Exibe   │   │   Service    │
│  erro    │   │   processa   │
└──────────┘   └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │  Persiste no │
               │    banco     │
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │  Notificação │
               │   sucesso    │
               └──────────────┘
```

O fluxograma deve ser claro o suficiente para que qualquer membro do time entenda o que será construído antes de aprovar o desenvolvimento.

### 2.4 Esclarecer dúvidas

Se houver ambiguidades:
- Listar **todas as dúvidas** antes de pedir resposta
- Perguntar com opções objetivas quando possível
- **Não iniciar implementação** até todas as dúvidas resolvidas

### 2.5 Aprovação

Apresentar o plano completo (estrutura + fluxograma) e aguardar confirmação explícita antes de continuar.

---

## Fase 3 — Implementação

Executar o plano aprovado respeitando **todos os padrões lidos no `AGENTS.md` e nos arquivos de agente** (`.claude/agents/`).

Durante a implementação:
- Ler cada arquivo antes de modificá-lo
- Seguir os padrões existentes no arquivo (não introduzir estilo diferente)
- Não duplicar lógica já existente no projeto
- Não adicionar comentários onde a lógica é auto-explicativa
- Não criar helpers/abstrações desnecessárias para uso único

Ao concluir, **verificar que o projeto compila sem erros** antes de avançar:

```bash
./mvnw compile -q
```

Se houver erros de compilação, corrigir antes de prosseguir para a próxima fase.

---

## Fase 4 — Testes Unitários

Após o build estar verde, criar testes unitários cobrindo:

- **Todos os novos Services criados** na task
- **Todos os métodos adicionados em Services existentes**

### Padrão de escrita

- Localizar testes existentes no projeto (`src/test/java`) para entender o padrão utilizado (nomenclatura, estrutura, framework — JUnit 5, Mockito, etc.)
- Seguir exatamente o mesmo padrão dos testes existentes
- Cobrir: caminho feliz + casos de borda relevantes (null, lista vazia, exceções esperadas)
- Não testar métodos triviais de getter/setter ou delegações simples sem lógica

### Verificar que os testes passam

```bash
./mvnw test -q
```

Se algum teste falhar, corrigir antes de avançar.

---

## Fase 5 — Auto-Review

Com implementação e testes concluídos, executar uma revisão do próprio código antes de declarar a task pronta.

Invocar `geo-git:review-pr` apontando para o diff da branch atual em relação à base (`master` ou `main`):

```bash
git diff master...HEAD
```

Conduzir a revisão com o mesmo rigor do `geo-git:review-pr`, verificando:

- **Lógica e corretude**: branches não tratadas, possíveis NPEs, casos de borda
- **Convenções do projeto**: padrões lidos no `AGENTS.md` e agentes estão sendo seguidos
- **Segurança**: queries parametrizadas, sem credenciais hardcoded, input validado
- **Cobertura de testes**: novos services e métodos estão cobertos
- **Sem código morto**: imports não usados, variáveis desnecessárias, comentários obsoletos

Classificar cada achado como **Blocker**, **Warning** ou **Suggestion**:

- Se houver **Blockers** → corrigir antes de avançar para o checklist
- **Warnings** → avaliar e corrigir se aplicável
- **Suggestions** → registrar mas não bloquear

---

## Fase 6 — Checklist de Qualidade

Após concluir a implementação, executar cada item com base nos padrões lidos do `AGENTS.md` e dos agentes do projeto.

### Convenções Gerais
- [ ] DI de services segue o padrão do projeto (ex: construtor Spring ou `MainApplicationContext`)
- [ ] Fields injetados em Views/Dialogs declarados `transient` (se aplicável)
- [ ] Logger declarado corretamente (ex: `transient LoggerProxy`)
- [ ] Notificações usando o helper do projeto (nunca componente nativo diretamente)
- [ ] View/formulário estende a classe correta da hierarquia do projeto
- [ ] Views com anotações obrigatórias (`@Route`, `@PageTitle`, `@RolesAllowed` ou equivalente)
- [ ] Confirmação de exclusão via componente de confirmação do projeto

### i18n (se aplicável)
- [ ] Todas as strings visíveis ao usuário usam chaves de tradução
- [ ] Chave adicionada em todos os arquivos de tradução do projeto
- [ ] Componentes de UI usam chave diretamente conforme padrão do projeto

### Testes
- [ ] Testes unitários criados para todos os novos services e métodos adicionados
- [ ] Todos os testes passando (`./mvnw test -q`)

### Critérios de Aceite
- [ ] Todos os critérios de aceite da tarefa Jira estão atendidos

---

## Fase 7 — Fechamento

Após checklist aprovado:

1. Resumir o que foi feito (arquivos criados/modificados, funcionalidades entregues)
2. Perguntar se deve commitar e enviar para revisão
3. Se solicitado, usar `geo-git:commit` para commitar e `geo-ops:jira-geo` para mover para "Ready to Review"
