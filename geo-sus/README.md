# geo-sus

SUS (Sustentacao/Maintenance) task resolution for GEOvendas. Orquestra o ciclo completo de tarefas de manutencao: busca no Jira, identifica o produto, delega para o projeto correto, e finaliza com apontamento.

## Pattern

As skills de dominio vivem **dentro dos projetos** que resolvem. O geo-sus eh o orquestrador que identifica o produto e redireciona para o projeto correto.

```
geo-sus (orquestrador)
  ├─ Analytics/Vaadin6  → geovendas-vaadin6/.claude/commands/resolve-analytics.md
  ├─ Forca de Vendas    → pedidos/.claude/commands/resolve-sus.md
  ├─ Integracoes .NET   → geovendas-dotnet/.claude/commands/resolve-sus.md
  └─ Finalizacao        → finalize-sus (Jira + apontamento via geo-ops)
```

## Skills

| Skill | Descricao |
|-------|-----------|
| `sus-resolution` | Orquestrador — busca tarefa, identifica repo, delega para projeto correto |
| `resolve-analytics` | **Atalho** → vive em geovendas-vaadin6 |
| `resolve-fvc` | **Atalho** → vive em pedidos |
| `finalize-sus` | Finalizacao — comentario Jira, transicao status, apontamento (via geo-ops) |
| `fix-sus-pr` | Responde a revisoes do GeoLens — corrige ou contesta |
| `execute-sql-customer` | Executa SQL no banco do cliente via REST API |

## Commands

| Comando | Uso |
|---------|-----|
| `/resolve-sus SUS-XXXX` | Resolve uma tarefa SUS end-to-end (identifica e delega) |
| `/resolve-analytics SUS-XXXX` | Redireciona para geovendas-vaadin6 |
| `/resolve-fvc SUS-XXXX` | Redireciona para pedidos |
| `/check-sus` | Busca tarefas To Do no Jira e resolve automaticamente |
| `/fix-sus-pr <PR_URL>` | Processa feedback do GeoLens em uma PR |

## Skills de dominio nos projetos

| Projeto | Skills disponiveis |
|---------|-------------------|
| `pedidos` | `/resolve-sus`, `/pr-sus`, `/fv`, 12 skills `/geo-*` |
| `geovendas-vaadin6` | `/resolve-analytics` |
| `geovendas-dotnet` | `/resolve-sus`, `/pr-sus` |

## Dependencias

- **geo-ops**: Apontamento de horas (MCP `geovendas_criar_apontamento`)
- **Jira MCP (Atlassian)**: Buscar tarefas, transicionar status, comentarios
- **Playwright MCP**: Browser testing (FV) e screenshots do Jira
- **GeoLens API**: Code review automatizado de PRs

---

**Version:** 1.0.0
**Author:** IBTech - Geovendas
