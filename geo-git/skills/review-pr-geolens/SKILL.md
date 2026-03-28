---
name: review-pr-geolens
description: "Submete uma pull request do GitHub para revisão automatizada via API interna do GeoLens. Use quando o usuario quer submeter uma PR para o GeoLens revisar, ou diz /review-pr-geolens."
allowed-tools: Bash(curl:*), Bash(gh:*)
---

# Review PR GeoLens

Submete uma pull request do GitHub para a API interna do GeoLens para análise automatizada de código.

## Configuration

A API está disponível em `https://192.168.37.206/api/pr-reviews` (rede interna, certificado auto-assinado).

## Usage

### 1. Identificar a PR

Determinar qual PR submeter:
- Se o usuário fornecer uma URL completa: usar diretamente
- Se fornecer número da PR: buscar a URL via `gh pr view <number> --json url --jq '.url'`
- Se não informar: verificar a branch atual via `gh pr view --json url --jq '.url'`

Se não for possível identificar a PR, pedir ao usuário a URL ou número.

### 2. Submeter para revisão

```bash
curl -X POST https://192.168.37.206/api/pr-reviews \
  -H "Content-Type: application/json" \
  -k \
  -d '{"url": "<pr-url>", "submitted_by": "gabdevbr"}'
```

### 3. Reportar resultado

Apresentar a resposta da API ao usuário. Se a resposta contiver um ID de revisão, URL ou status, exibir em destaque.

## Common Errors

| Erro | Causa | Solução |
|------|-------|---------|
| `Connection refused` | Serviço GeoLens indisponível | Informar o usuário que o serviço pode estar fora do ar |
| `curl: (60) SSL certificate` | Certificado auto-assinado | Garantir que o flag `-k` está sendo usado |
| HTTP 4xx | URL da PR inválida ou campo faltando | Exibir o body da resposta de erro |
| `gh` auth fails | Não autenticado no GitHub CLI | Pedir para rodar `gh auth login` |

## Rules

- Sempre usar o flag `-k` (certificado auto-assinado na rede interna)
- `submitted_by` padrão é `gabdevbr` — ajustar se o usuário especificar outro login
