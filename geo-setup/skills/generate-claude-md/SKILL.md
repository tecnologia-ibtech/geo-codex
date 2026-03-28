---
name: generate-claude-md
description: "Generates or updates a project's AGENTS.md by auto-detecting stack, conventions, and structure. Use when the user wants to create a AGENTS.md, configure Codex for a project, or says /claude-md."
allowed-tools: Read, Glob, Grep, Write
---

# Generate AGENTS.md

Analyzes a project's structure, stack, and conventions to generate a AGENTS.md file that contains **only what Claude cannot infer** from existing project files.

## Core Principle: No Redundancy

AGENTS.md is a behavioral guide for Claude, not project documentation. Claude can already read `package.json`, `pom.xml`, `README.md`, `Makefile`, config files, and directory listings — so AGENTS.md must never duplicate their contents.

**Before writing any section, ask:** "Can Claude get this by reading an existing file?" If yes, skip the section entirely.

Common redundancies to avoid:
- **Run/Build/Test commands** — already in `package.json` scripts, `Makefile`, `pom.xml`, or `README.md`
- **Dependency lists** — already in the manifest file
- **Tech stack details** — language, package manager, build tool are obvious from project files
- **Standard directory layout** — self-evident from file listings
- **CI/CD configuration** — already in workflow files
- **Linter/formatter rules** — already in `.prettierrc`, `.eslintrc`, `biome.json`, etc.
- **Commit conventions** — already in `.commitlintrc`, `.czrc`, or similar config files

## Step 1: Check for Existing AGENTS.md

Before anything, check if a `AGENTS.md` already exists in the project root.

- If found: read it first. You will **merge and update** — never overwrite blindly.
- If not found: generate from scratch.

## Step 2: Project Analysis

Scan the project to understand its stack and conventions. The goal is not to catalog everything — it's to identify what is **non-obvious or undocumented** so you know what belongs in AGENTS.md.

### Detect Stack

Read the first build file found to identify the ecosystem:

| File | Stack |
|------|-------|
| `package.json` | Node.js / JavaScript / TypeScript |
| `pom.xml` | Java / Maven |
| `build.gradle` or `build.gradle.kts` | Java / Kotlin / Gradle |
| `*.csproj` or `*.sln` | .NET / C# |
| `Cargo.toml` | Rust |
| `pyproject.toml` or `requirements.txt` | Python |
| `go.mod` | Go |
| `Gemfile` | Ruby |
| `composer.json` | PHP |

### Detect Conventions

Scan for formatting/linting config files to understand what is **already enforced by tooling** (and therefore does NOT belong in AGENTS.md):

| File | Convention |
|------|-----------|
| `.editorconfig` | Indentation, charset, line endings |
| `.prettierrc*` or `prettier.config.*` | JS/TS formatting |
| `tsconfig.json` | TypeScript strictness, module system |
| `.eslintrc*` or `eslint.config.*` | Linting rules |
| `biome.json` | Biome formatter/linter |
| `checkstyle.xml` | Java code style |
| `.rubocop.yml` | Ruby code style |
| `.flake8` or `ruff.toml` | Python code style |

Also check for commit convention config (`.commitlintrc*`, `.czrc`, `.cz.json`). If none found, run `git log --oneline -20` to infer patterns.

### Identify Non-Obvious Architecture

List top-level directories and look for patterns that are **not self-evident** from names alone:
- Unusual module boundaries or domain-driven design
- Shared libraries or internal packages with implicit contracts
- Legacy modules with special handling rules
- Non-standard naming patterns

### Check for README.md

Read it to avoid duplicating its content (description, setup instructions, contribution guide, etc.).

## Step 3: Geovendas Detection

Check for IBTech/Geovendas markers. If ANY of the following are detected, present plugin suggestions:

| Marker | Detection Method | Suggested Plugins |
|--------|------------------|-------------------|
| `geovendas-entity`, `geovendas-repository`, `geovendas-service` in dependencies | Read `pom.xml` or `build.gradle` | `geo-ops`, `geo-git` |
| Vaadin 6 or Vaadin 23+ in dependencies | Read `pom.xml` or `build.gradle` | `geo-360`, `geo-git` |
| Vue.js 2 with `inversify` | Read `package.json` | `geo-360`, `geo-git` |
| AngularJS 1.x + CoffeeScript + PouchDB | Read `package.json` or `bower.json` | `geo-pedidos`, `geo-git` |
| Repo name matches `geovendas-*` or `geo-*` | Check directory name or `git remote -v` | `geo-git` |

**Important:** Present suggestions as a list. Do NOT auto-install plugins. Example:

```
Detected Geovendas project markers. Consider installing these geo-codex plugins:
- geo-ops: Jira, PostgreSQL, Firebase integrations
- geo-git: Semantic commits and PR creation
```

## Step 4: Generate AGENTS.md

Using the analysis from Step 2, generate the AGENTS.md. Only include sections that add **non-redundant value** — information Claude cannot get from existing project files.

### Template

```markdown
# <Project Name>

<One-line description — only if not already in README.md>

## Architecture

<Non-obvious architectural patterns, module boundaries, or domain concepts that aren't self-evident from directory names. Skip for simple or well-documented projects.>

## Code Conventions

<Only conventions NOT enforced by linter/formatter configs. If .prettierrc handles quotes/semicolons, don't repeat those. Focus on unwritten rules:>

- <Naming patterns for files, variables, classes — only if not obvious>
- <Import grouping/ordering — only if not enforced by tooling>
- <Other team conventions that tools don't enforce>

## Commit Conventions

<Only if the project uses conventions NOT configured via commitlint/.czrc. Skip if already configured.>

- Format: `type(scope): description`
- Language: <english/portuguese based on git log>

## Response Style

- Analysis responses: 300 words max
- Lists: 8 bullets max
- Conclusions: conclusion + 3 next steps
- Avoid lengthy explanations unless explicitly requested

## Important Rules

- <Security rules: never commit .env, credentials, etc.>
- <Project-specific rules that can't be inferred from configs>
- <Gotchas, workarounds, or traps a new developer would hit>
```

**Adapt the template to the project.** The "Response Style" section is mandatory — always include it. Skip every other section that has no non-redundant data. Add sections not in the template when relevant (e.g., "Database" for projects with migrations, "API Endpoints" for backend projects).

### Decision Reference

| Information | Source of truth | Include in AGENTS.md? |
|-------------|----------------|----------------------|
| How to run/build/test | `package.json`, `Makefile`, `README.md` | No |
| Dependencies/libraries | `package.json`, `pom.xml`, `requirements.txt` | No |
| Language, framework, build tool | Obvious from project files | No |
| Standard directory layout | Self-evident from `ls` | No |
| Linter/formatter rules | `.prettierrc`, `.eslintrc`, `biome.json` | No |
| Commit convention (configured) | `.commitlintrc`, `.czrc` | No |
| Non-obvious architecture | Nowhere else | **Yes** |
| Unwritten team conventions | Nowhere else | **Yes** |
| Security/deployment gotchas | Nowhere else | **Yes** |
| Response style preferences | Nowhere else | **Yes** |

## Step 5: Review

Present the full AGENTS.md draft to the user:

> Here's the generated AGENTS.md for your project. Please review it:
>
> <full content>
>
> Would you like to save it as-is, or would you like to make any changes?

**Wait for explicit approval before saving.** If the user requests changes, apply them and present again.

## Step 6: Save

After approval:

- If no existing AGENTS.md: write to `AGENTS.md` in the project root.
- If existing AGENTS.md: show a diff of changes before saving. Ask for confirmation.

## Rules

- Never overwrite an existing AGENTS.md without showing the user what will change.
- If auto-detection fails to find something, skip the related section rather than guessing.
- **Never duplicate information from project files.** Claude reads those directly — AGENTS.md should only contain what Claude can't infer on its own.
- Keep the generated content concise. AGENTS.md is a behavioral guide, not documentation.
- Use the project's own language for section content when possible (e.g., if README is in Portuguese, generate in Portuguese).
- Always present the draft for review. Never save without approval.
