---
name: resolve-fvc
description: >-
  Atalho para a skill de resolucao de tarefas SUS de Forca de Vendas (FV/FVC).
  A implementacao completa vive dentro do repo pedidos.
  Triggers: /resolve-fvc SUS-XXXX, 'resolver fv', 'SUS de pedidos'.
---

# Resolve FVC — Atalho

A implementacao desta skill vive dentro do projeto **pedidos**:

```
/home/gab/repo/geovendas/pedidos/.claude/commands/resolve-sus.md
```

O projeto pedidos tem um ecossistema completo de skills de dominio:
- `/fv` — Skill principal (padroes AngularJS/CoffeeScript)
- `/geo-*` — 12 skills de dominio (arquitetura, config, offline, etc.)
- `/pr-sus` — Finalizar trabalho ja feito (commit + PR + Jira)

## Como usar

1. Mudar para o diretorio do projeto:
   ```bash
   cd /home/gab/repo/geovendas/pedidos
   ```

2. Invocar `/resolve-sus SUS-XXXX` de dentro do projeto

## Quando eh FV?

- Task menciona: representante, digitacao de pedido, sincronizacao, app mobile, ISF
- Task menciona: carrinho, PouchDB, duplicatas de itens, totais errados
- Repos: `pedidos` ou `pedidos-enm` (+ `geovendas-vaadin6` para o backend)

## FV eh dual-repo

Muitas funcionalidades passam por AMBOS:
- `pedidos` (frontend mobile AngularJS)
- `geovendas-vaadin6` (backend Java)

Se o problema for no backend, o `/resolve-sus` do pedidos automaticamente redireciona para o vaadin6.
