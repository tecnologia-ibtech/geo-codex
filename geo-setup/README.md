# geo-setup

Plugin para configurar o Codex em qualquer projeto. Gera AGENTS.md, cria skills, scaffolda MCP servers e oferece um wizard de setup completo. Core generico com deteccao automatica de projetos Geovendas.

## Skills

| Skill | Descricao |
|-------|-----------|
| generate-claude-md | Analisa o projeto e gera um AGENTS.md com convencoes, padroes e instrucoes |
| create-skill | Cria skills no `~/.codex/skills/` de qualquer projeto |
| create-mcp | Gera MCP server a partir de API/OpenAPI spec |
| setup-project | Wizard completo que configura tudo de uma vez |
| create-agent | Cria agents com execution loop, stop criteria e padroes de seguranca |
| audit-project | Audita a configuracao do Codex e reporta problemas e drift |

## Comandos

| Comando | Skill | Descricao |
|---------|-------|-----------|
| `/claude-md` | generate-claude-md | Gerar ou atualizar AGENTS.md |
| `/skill` | create-skill | Criar uma skill no projeto |
| `/mcp` | create-mcp | Criar um MCP server a partir de uma API |
| `/setup` | setup-project | Wizard completo de setup do Codex |
| `/agent` | create-agent | Criar um agent no projeto |
| `/audit` | audit-project | Auditar configuracao do Codex no projeto |

## Autor

IBTech - Geovendas
