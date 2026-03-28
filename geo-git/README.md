# geo-git

Plugin de fluxo de trabalho Git com commits semânticos e criação de PRs para repositórios Geovendas.

## Descrição

O geo-git fornece um conjunto de habilidades e comandos para padronizar o fluxo de trabalho Git, garantindo commits semânticos e PRs bem formatados de acordo com as convenções do projeto.

## Habilidades Incluídas

- **commit**: Realiza staging, cria commits semânticos e faz push para o repositório remoto. Detecta alterações em `.claude/` e oferece abrir uma PR separada direto para a main (split-pr integrado).
- **create-pr**: Cria pull requests com título no formato convencional
- **review-pr**: Analisa PRs e gera review estruturado com findings e sugestões
- **fix-pr**: Recebe PR rejeitada, entende o feedback dos revisores, corrige o código e re-solicita revisão
- **review-pr-geolens**: Submete uma PR para revisão automatizada via API interna do GeoLens

## Comandos Disponíveis

- `/commit`: Executar workflow de commit semântico
- `/pr`: Criar pull request com formatação convencional
- `/review-pr`: Analisar um pull request aberto
- `/fix-pr`: Corrigir PR rejeitada e re-solicitar revisão
- `/review-pr-geolens`: Submeter PR para revisão via API GeoLens

## Versão

1.0.0

## Autor

IBTech - Geovendas

## Licença

MIT
