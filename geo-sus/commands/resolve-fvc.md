---
name: resolve-fvc
description: "Resolve a SUS task targeting Forca de Vendas. Redirects to pedidos project."
argument-hint: <SUS-XXXX>
---

A implementacao de `/resolve-fvc` vive dentro do projeto pedidos.

1. Mude para o diretorio do projeto:
```bash
cd /home/gab/repo/geovendas/pedidos
```

2. Invoque `/resolve-sus` de la, passando a chave SUS como argumento.

O projeto pedidos tem um ecossistema completo de skills:
- `/fv` — Skill principal (padroes AngularJS/CoffeeScript)
- `/geo-*` — 12 skills de dominio
- `/pr-sus` — Finalizar trabalho ja feito

Se o problema for no backend, o `/resolve-sus` do pedidos automaticamente redireciona para o vaadin6.
