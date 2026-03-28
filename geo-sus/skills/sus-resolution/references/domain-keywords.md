# Domain Keywords → Product Mapping

## Keyword Matching Rules

1. Check title FIRST for explicit tags like `[DOTNET]`
2. Then scan description for domain keywords
3. Match against this table, scoring by specificity
4. If multiple products match with similar scores → LOW confidence

## Keywords by Product

### Forca de Vendas (pedidos + geovendas-vaadin6)
**Strong indicators**: representante, rep (login prefix), sincronizacao de pedido, digitacao de pedido, comissao, rota, visita, agenda do representante, meta de vendas, carrinho
**Moderate indicators**: pedido, cliente, venda, catalogo, tabela de preco, promocao
**Version strings**: ISF, IFS, FV

**Disambiguation (pedidos vs vaadin6)**:
- `pedidos` (mobile app): sincronizacao, offline, mobile, app, digitacao, carrinho, pendentes
- `geovendas-vaadin6` (web admin): tela de, relatorio, gestao, painel, dashboard, backoffice, cadastro (admin)

### Integracao .NET (geovendas-dotnet)
**Strong indicators**: integracao com ERP, webservice, .NET, DOTNET, C#, API de integracao, importacao de pedido para ERP
**Moderate indicators**: integracao, ERP, sincronizacao com ERP, exportacao
**Note**: "integracao" alone is ambiguous — many products integrate with ERPs

### StockCentral (geovendas-dotnet/StockCentral)
**Strong indicators**: StockCentral, estoque central, controle de estoque central, deposito central
**Note**: Part of geovendas-dotnet repo but separate subdirectory

### B2B / e-commerce (geovendas-b2b)
**Strong indicators**: B2B, e-commerce, loja online, portal do cliente, carrinho online, checkout online, loja virtual
**Moderate indicators**: portal, loja, ecommerce

### CRM 360 (geovendas-vue)
**Strong indicators**: CRM, CRM 360, pipeline, funil de vendas, oportunidade, lead, atividade CRM
**Moderate indicators**: funil, oportunidade, prospeccao

### ETL (geovendas-java8-etl)
**Strong indicators**: ETL, carga de dados, importacao massiva, job de importacao, processamento batch
**Moderate indicators**: importacao, exportacao, carga
**Note**: Not the same as "integracao" — ETL is batch data processing

### Vaadin 23 (geovendas-vaadin23 + sub-repos)
**Strong indicators**: V23, vaadin 23, novo sistema, nova tela, sistema novo, interface nova
**Moderate indicators**: tela nova, modulo novo, migracao
**Note**: If the task mentions a feature that exists in both old (vaadin6) and new (vaadin23) systems, check which version the client is using

### FV Malharia (geo-fv-malharia)
**Strong indicators**: FVT, FVM, malharia, confeccao, malha, grade de tamanho, ficha tecnica
**Moderate indicators**: malharia in client name
**Note**: Completely separate product from Forca de Vendas — different repo and codebase

## Ambiguous Keywords (require further analysis)

| Keyword | Possible Products | How to Disambiguate |
|---------|------------------|---------------------|
| pedido | FV, B2B, DOTNET | Check context: mobile → FV, online → B2B, ERP → DOTNET |
| integracao | DOTNET, ETL, FV | Check with what: ERP → DOTNET, batch → ETL, sync → FV |
| cadastro | FV, vaadin6, vaadin23, B2B | Check which entity and which interface |
| relatorio | vaadin6, vaadin23, CRM | Check which report type and system version |
| filtro | FV, vaadin6, vaadin23, B2B | Check which screen/module |
| erro | ALL | Not useful alone — need technical details |
| lentidao | ALL | Need to identify which system/screen |
