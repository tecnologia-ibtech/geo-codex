---
name: apontamento-interno
description: >-
  Lanca apontamento de horas interno no sistema GEOvendas via MCP.
  Use quando o usuario diz /apontamento-interno, pede para "apontar horas",
  "lancar apontamento", "registrar horas", "apontar no jira", ou menciona
  lancar horas trabalhadas em uma task.
---

# Apontamento Interno

Lanca apontamento de horas no InterSystems Cache da GEOvendas usando o MCP server de apontamento.

## Pre-requisitos

O usuario deve ter as variaveis de ambiente configuradas:

- **macOS**: em `~/.zshrc`
- **Linux**: em `~/.bashrc`
- **Windows**: nas variaveis de ambiente do sistema

```bash
export APONTAMENTO_USER="seu_usuario"
export APONTAMENTO_PASSWORD="sua_senha"
```

O MCP server `apontamento` deve estar configurado (url: `http://192.168.37.206:8100/mcp`).

## Parametros

| Parametro | Obrigatorio | Descricao | Exemplo |
|-----------|-------------|-----------|---------|
| task_key | Sim | Chave da task no Jira | `SUS-1190`, `GEO-452` |
| data | Sim | Data do apontamento (YYYY-MM-DD) | `2026-03-09` |
| hora_inicio | Sim | Hora inicio (HH:MM) | `08:00` |
| hora_fim | Sim | Hora fim (HH:MM) | `10:00` |
| usuario | Nao | Login do usuario no GEOvendas (default: APONTAMENTO_USER) | `agente01` |
| observacao | Nao | Texto livre | `Correcao de bug no relatorio` |
| tipo | Nao | Tipo do apontamento (default: 9999) | `9999` |
| situacao | Nao | Situacao do apontamento (default: 9999) | `9999` |

## Workflow

### 1. Ler credenciais de autenticacao

Leia as variaveis de ambiente `APONTAMENTO_USER` e `APONTAMENTO_PASSWORD`:

```bash
echo "$APONTAMENTO_USER"
echo "$APONTAMENTO_PASSWORD"
```

Se alguma estiver vazia, informar o usuario que precisa configurar:

```
Variaveis APONTAMENTO_USER e APONTAMENTO_PASSWORD nao encontradas.

Configure no seu shell:
  # macOS (~/.zshrc)
  export APONTAMENTO_USER="seu_usuario"
  export APONTAMENTO_PASSWORD="sua_senha"

  # Linux (~/.bashrc)
  export APONTAMENTO_USER="seu_usuario"
  export APONTAMENTO_PASSWORD="sua_senha"

  # Windows (PowerShell como admin)
  [System.Environment]::SetEnvironmentVariable("APONTAMENTO_USER", "seu_usuario", "User")
  [System.Environment]::SetEnvironmentVariable("APONTAMENTO_PASSWORD", "sua_senha", "User")

Depois reinicie o terminal e tente novamente.
```

Parar a execucao se as credenciais nao existirem.

### 2. Coletar parametros

Se o usuario ja passou todos os parametros no comando, usa-los diretamente.

**Default do usuario**: Se o parametro `usuario` nao foi informado, usar o valor da variavel de ambiente `APONTAMENTO_USER` como default. Nao perguntar ao usuario se o default existir.

Se faltam parametros obrigatorios, perguntar ao usuario **apenas os que faltam**. Exemplo:

```
Para lancar o apontamento, preciso de:
- task_key: (chave Jira, ex: SUS-1190)
- data: (YYYY-MM-DD)
- hora_inicio: (HH:MM)
- hora_fim: (HH:MM)
```

Aceitar formatos flexiveis e normalizar:
- Data: `09/03/2026` ou `9/3/2026` → `2026-03-09`
- Hora: `8:00` → `08:00`

### 3. Chamar o MCP tool

**IMPORTANTE:** O tool se chama `geovendas_criar_apontamento` (SEM `_jira` no final).
O nome completo no Codex eh `mcp__apontamento__geovendas_criar_apontamento`.

**NUNCA usar curl para chamar o endpoint REST diretamente.** Sempre usar o MCP tool nativo do Codex.
O MCP server `apontamento` esta configurado em `http://192.168.37.206:8100/mcp` — essa URL eh fixa e interna.

Chamar o tool `mcp__apontamento__geovendas_criar_apontamento` com os parametros:

```json
{
  "usuario": "<usuario>",
  "data": "<YYYY-MM-DD>",
  "hora_inicio": "<HH:MM>",
  "hora_fim": "<HH:MM>",
  "task_key": "<TASK-KEY>",
  "observacao": "<texto ou vazio>",
  "tipo": 9999,
  "situacao": 9999,
  "auth_user": "<APONTAMENTO_USER>",
  "auth_password": "<APONTAMENTO_PASSWORD>"
}
```

### 4. Apresentar resultado

#### Sucesso:
```
Apontamento criado com sucesso!

  ID: <idSaved>
  Task: <taskKey>
  Data: <data>
  Horario: <horaInicio> - <horaFim>
  Usuario: <usuario>
```

#### Erro:
Mostrar a mensagem de erro retornada e sugerir acoes:
- Se erro de autenticacao: verificar APONTAMENTO_USER/APONTAMENTO_PASSWORD
- Se erro de conexao: verificar se o MCP server esta no ar
- Se erro de validacao: mostrar qual campo esta invalido

## Exemplos de uso

```
/apontamento-interno SUS-1190 2026-03-09 08:00 10:00 agente01
/apontamento-interno SUS-1190 2026-03-09 08:00 10:00 agente01 "Correcao de bug"
/apontamento-interno (sem parametros — a skill pergunta interativamente)
```

## Regras

- NUNCA armazenar ou logar a senha (APONTAMENTO_PASSWORD) — usar apenas para passar ao MCP
- Se o MCP server nao estiver acessivel, informar o usuario com instrucoes claras
- Validar formato de data e hora antes de enviar ao MCP
- Aceitar multiplos apontamentos em sequencia se o usuario pedir
