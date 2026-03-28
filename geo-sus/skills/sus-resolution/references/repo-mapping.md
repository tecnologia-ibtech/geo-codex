# Product-to-Repository Mapping

## Primary Repos

| Product | Aliases/Keywords | Local Directory | GitHub Repo | Necessario Atualizar ID | App URL |
|---------|-----------------|-----------------|-------------|------------------------|---------|
| Forca de Vendas | FV, pedido, representante, sincronizacao, ISF | `/home/gab/repo/geovendas/pedidos` | tecnologia-ibtech/pedidos | 10776 | Ask user |
| Forca de Vendas (ENM) | FV, pedido, Icone, Link, GrupoENM, enm | `/home/gab/repo/geovendas/pedidos-enm` | tecnologia-ibtech/pedidos-enm | 10776 | `https://link.geovendas.app/PedidosIcone` |
| GEOvendas (Vaadin 6) | vaadin6, GEO, catalogo, tabela de preco | `/home/gab/repo/geovendas/geovendas-vaadin6` | tecnologia-ibtech/geovendas-vaadin6 | 10775 | N/A |
| Integracao .NET | DOTNET, .NET, integracao, ERP, webservice | `/home/gab/repo/geovendas/geovendas-dotnet` | tecnologia-ibtech/geovendas-dotnet | 10780 | N/A |
| StockCentral | StockCentral, estoque central, SC | `/home/gab/repo/geovendas/geovendas-dotnet/StockCentral` | tecnologia-ibtech/geovendas-dotnet (subdir) | 10780 | N/A |
| B2B / e-commerce | B2B, e-commerce, loja, loja online, portal | `/home/gab/repo/geovendas/geovendas-b2b` | tecnologia-ibtech/geovendas-b2b | 10777 | N/A |
| CRM 360 | CRM, 360, pipeline, funil, oportunidade | `/home/gab/repo/geovendas/geovendas-vue` | tecnologia-ibtech/geovendas-vue | 10779 | N/A |
| ETL | ETL, carga, importacao, exportacao, dados | `/home/gab/repo/geovendas/geovendas-java8-etl` | tecnologia-ibtech/geovendas-java8-etl | 10778 | N/A |
| Vaadin 23 | V23, vaadin 23, tela nova, novo sistema | `/home/gab/repo/geovendas/geovendas-vaadin23` | tecnologia-ibtech/geovendas-vaadin23 | 10785 | N/A |
| FV Malharia | FVT, FVM, malharia, malha, confeccao | `/home/gab/repo/geovendas/geo-fv-malharia` | tecnologia-ibtech/geo-fv-malharia | N/A | N/A |

## Vaadin 23 Sub-Repos

Tasks targeting Vaadin 23 may require changes across multiple repos:

| Repo | Purpose | Local Directory |
|------|---------|-----------------|
| geovendas-services | Service layer / business logic | `/home/gab/repo/geovendas/geovendas-service` |
| geovendas-repository | Data access / persistence | `/home/gab/repo/geovendas/geovendas-repository` |
| geovendas-entity | Domain entities / models | `/home/gab/repo/geovendas/geovendas-entity` |
| geovendas-utils | Shared utilities | `/home/gab/repo/geovendas/geovendas-utils` |
| geovendas-view-crm | CRM views (Vaadin 23) | `/home/gab/repo/geovendas/geovendas-view-crm` |
| geovendas-java17-lib | Java 17 shared libraries | `/home/gab/repo/geovendas/geovendas-java17-lib` |

## Dual-Repo Products

Some products span multiple repos. When identified, check ALL repos:

- **Forca de Vendas**: `pedidos` (mobile/sync) + `geovendas-vaadin6` (web/admin)
- **Forca de Vendas (ENM)**: `pedidos-enm` (mobile/sync, ENM-specific customizations) + `geovendas-vaadin6` (web/admin). App URL: `https://link.geovendas.app/PedidosIcone`
- **Vaadin 23 ecosystem**: `geovendas-vaadin23` + up to 6 sub-repos depending on the layer affected
- **DOTNET + StockCentral**: Same GitHub repo, different subdirectories

## Jira Custom Fields

### customfield_10095 — Feature (cascading select)

Used during finalization (transition to Ready to Review). Infer from the task context:

| Categoria (parent) | Subcategorias comuns (child) |
|---------------------|------------------------------|
| Forca de Vendas | Integracao com o ERP, Sincronizacao do pedido, Cadastro de clientes, Estoque - Pedido |
| B2B | Integracao com o ERP, Fechamento de Pedido, Cadastro de clientes |
| Analytics | Integracoes com o ERP, Consulta de Vendas |
| CRM | Integracao com o ERP |

If unsure of the exact value, fetch the transition's `expand=transitions.fields` to see `allowedValues`.

### customfield_10133 — Necessario atualizar (multi-select checkboxes)

Select ALL repos that were changed. Map repo → checkbox value:

| Checkbox Label | Repo | ID |
|---------------|------|-----|
| B2B (geovendas-b2b) | geovendas-b2b | 10777 |
| CRM 360 (geovendas-vue) | geovendas-vue | 10779 |
| ETL (geovendas-java8-etl) | geovendas-java8-etl | 10778 |
| Forca de Vendas (pedidos) | pedidos | 10776 |
| GEOvendas (geovendas-vaadin6) | geovendas-vaadin6 | 10775 |
| Integracao .NET (geovendas-dotnet) | geovendas-dotnet | 10780 |
| Vaadin 23 (geovendas-vaadin23) | geovendas-vaadin23 | 10785 |
| Nenhum | (nenhum sistema precisa atualizar) | TBD |

**IMPORTANTE:** Para IDs marcados como TBD, buscar via `getTransitionsForJiraIssue(expand: "transitions.fields")` e cachear os `allowedValues` do `customfield_10133`.

**Regra:** Selecionar TODOS os sistemas que tiveram codigo alterado na PR. Se alterou `pedidos` + `geovendas-vaadin6`, marcar ambos.

## Version Identification Hints

Version strings in task descriptions help identify the product:

| Version Prefix | Product |
|---------------|---------|
| ISF / IFS | Forca de Vendas (mobile) |
| IGS | GEOvendas (Vaadin 6 or Vaadin 23) |
| Geo | GEOvendas general |
| FV | Forca de Vendas |
| PS | Pedidos (sync) |
| *-enm (suffix) | Forca de Vendas (ENM) — repo pedidos-enm |
