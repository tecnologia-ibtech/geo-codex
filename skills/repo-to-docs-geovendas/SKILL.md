---
name: repo-to-docs-geovendas
description: >-
  This skill should be used when the user asks to "documentar repo", "gerar docs",
  "criar documentação", "doc repo", "documentar projeto", "generate docs",
  "repo to docs", "atualizar documentação", or mentions creating/updating
  documentation for a repository in Outline. It analyzes a repository and creates
  a documentation tree in the Outline wiki (docs.geovendas.com) under the "Projetos" collection.
version: 1.0.0
---

# Repo to Docs Geovendas

Analyze a repository and generate a documentation tree in Outline (docs.geovendas.com) under the **Projetos** collection. Creates three documents: Visão Geral (for non-technical staff), Getting Started (setup guide), and Visão Técnica (detailed architecture).

## Prerequisites

The Outline API is accessed via curl. Use the following for ALL API calls:

```
API_URL="https://docs.geovendas.com/api"
API_KEY="ol_api_Nyf83LAelda0QpOfbgAd2rJXNDMtRsCyQynGax"
```

## Workflow

### 1. Determine Repository

If the user specified a repo path, use it. Otherwise, use the current working directory.

Validate it's a git repo:
```bash
git -C <repo_path> rev-parse --show-toplevel
```

Extract the repo name from the directory name.

### 2. Analyze Repository with Subagents

Launch **3 parallel subagents** (using the Agent tool with subagent_type "Explore") to analyze the repository. Each subagent focuses on one document:

#### Subagent 1: Visão Geral
Research prompt: "Analyze this repository to write a non-technical overview for customer support staff. Find: what the product does, who uses it, main features, how it fits in the ecosystem. Check README, AGENTS.md, package.json, main entry points, UI components. Repository: <repo_path>"

#### Subagent 2: Getting Started
Research prompt: "Analyze this repository to write a Getting Started guide. Find: prerequisites, how to clone, install dependencies, environment variables needed, how to run locally, how to run tests, how to deploy. Check README, AGENTS.md, package.json/build.gradle/pom.xml, Dockerfile, docker-compose, .env.example, Makefile. Repository: <repo_path>"

#### Subagent 3: Visão Técnica
Research prompt: "Analyze this repository for detailed technical documentation. Find: tech stack, architecture patterns, folder structure, main modules/services, data flow, API endpoints, database schema, external integrations, CI/CD. Check all config files, source structure, AGENTS.md, docs/. Repository: <repo_path>"

### 3. Generate Documents

Using the research from each subagent, write three markdown documents. Follow these guidelines:

#### Visão Geral
- Language: Portuguese (pt-BR)
- Audience: atendentes, suporte, não-técnicos
- Tone: claro, simples, sem jargão técnico
- Content: O que é o produto, quem usa, principais funcionalidades, fluxos principais
- Max ~500 words

#### Getting Started
- Language: Portuguese (pt-BR)
- Audience: desenvolvedores novos no projeto
- Tone: direto, prático, passo a passo
- Content: Pré-requisitos, clone, instalação, configuração, como rodar, como testar
- Use code blocks for commands
- Max ~800 words

#### Visão Técnica
- Language: Portuguese (pt-BR)
- Audience: desenvolvedores experientes
- Tone: técnico, detalhado, preciso
- Content: Stack, arquitetura, estrutura de pastas, módulos, fluxos de dados, APIs, integrações, banco de dados
- Use diagrams in mermaid if helpful
- Max ~1500 words

### 4. Find or Create Parent Structure in Outline

#### 4a. Find "Projetos" collection
```bash
curl -s -X POST "$API_URL/collections.list" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```
Find the collection with name "Projetos". If it doesn't exist, create it:
```bash
curl -s -X POST "$API_URL/collections.create" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Projetos", "permission": "read_write"}'
```

Save the `collectionId`.

#### 4b. Archive existing versions
Search for existing documents for this repo:
```bash
curl -s -X POST "$API_URL/documents.search" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "<repo_name>", "collectionId": "<collectionId>"}'
```

For each document found that belongs to this repo's tree (match by title containing the repo name as parent, or children of that parent), archive it:
```bash
curl -s -X POST "$API_URL/documents.archive" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id": "<documentId>"}'
```

### 5. Create Documents in Outline

#### 5a. Create parent document
```bash
curl -s -X POST "$API_URL/documents.create" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "<repo_name> (YYYY-MM-DD)",
    "text": "Documentação do repositório <repo_name>, gerada automaticamente em YYYY-MM-DD.",
    "collectionId": "<collectionId>",
    "publish": true
  }'
```
Save the parent `documentId`.

#### 5b. Create child documents (in order)

Create each document as a child of the parent, **in this order**:

1. **Visão Geral**
2. **Getting Started**
3. **Visão Técnica**

```bash
curl -s -X POST "$API_URL/documents.create" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "<document_title>",
    "text": "<document_content>",
    "collectionId": "<collectionId>",
    "parentDocumentId": "<parentDocumentId>",
    "publish": true
  }'
```

### 6. Present Results

Show the user:
- Links to all created documents: `https://docs.geovendas.com<url_from_response>`
- How many old versions were archived
- Summary of what was documented

Format:
```
Documentação criada para **<repo_name>**:

📄 <repo_name> (YYYY-MM-DD) — <link>
  ├── Visão Geral — <link>
  ├── Getting Started — <link>
  └── Visão Técnica — <link>

<N> versão(ões) anterior(es) arquivada(s).
```
