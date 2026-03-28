---
name: setup-project
description: "Full Codex project setup wizard. Generates AGENTS.md, suggests and creates skills, sets up MCP servers, and configures settings. Use when the user wants to set up Codex in a project from scratch, or says /setup."
allowed-tools: Read, Glob, Grep, Write, Bash(npm:*), Bash(npx:*), Bash(pip:*), WebFetch
---

# Setup Project Wizard

Configures Codex for a project from scratch with AGENTS.md, skills, and MCP servers.

## Step 1: Project Analysis

Run the same detection as the `generate-claude-md` skill:

### Scan for stack
- Build files: `package.json`, `pom.xml`, `build.gradle`, `*.csproj`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `Gemfile`, `requirements.txt`, `composer.json`
- Config files: `.editorconfig`, `.prettierrc*`, `tsconfig.json`, `.eslintrc*`, `biome.json`, `checkstyle.xml`
- Directory patterns: `src/`, `test*/`, `lib/`, `app/`, `pages/`, `components/`, `api/`, `cmd/`
- CI/CD: `.github/workflows/`, `Jenkinsfile`, `Dockerfile`, `.gitlab-ci.yml`

### Check existing Codex config
- `AGENTS.md` — already has project instructions?
- `.claude/` directory — already has skills or settings?
- `.claude/settings.json` — already has MCP servers?

If existing config is found, note it. The wizard will update rather than overwrite.

### Detect Geovendas markers
- `geovendas-entity`, `geovendas-repository`, `geovendas-service` in dependencies
- Vaadin 6/23 patterns
- Vue.js 2 with `inversify`
- AngularJS 1.x + CoffeeScript + PouchDB
- Repo name matches `geovendas-*` or `geo-*`

## Step 2: Present Setup Plan

Based on the analysis, present a setup plan. Example:

```
## Setup Plan for <project-name>

Stack detected: Java 17 / Spring Boot 3 / Maven / PostgreSQL

I'll configure the following:

### 1. AGENTS.md (always)
Generate project instructions with conventions, commands, and structure.

### 2. Suggested Skills
Based on your project, these skills would be useful:
- [ ] testing — TDD workflow for JUnit 5 + integration tests
- [ ] api-debug — Debug Spring REST endpoints

### 3. MCP Servers
No external API specs detected. Skipping.

### 4. Geovendas Plugins
Detected Geovendas project markers. Recommended plugins:
- geo-ops: Jira integration, PostgreSQL queries
- geo-git: Semantic commits and PR creation

Would you like to proceed with this plan? You can:
- Approve as-is
- Remove items (e.g., "skip testing skill")
- Add items (e.g., "also create a deployment skill")
```

**Wait for approval before executing anything.**

### Skill Suggestions by Project Type

| Project has... | Suggest skill for... |
|----------------|----------------------|
| Test directory or test runner | TDD / testing workflow |
| API endpoints (controllers, routes) | API debugging / testing |
| Database (migrations, ORM config) | Database query / migration patterns |
| Frontend components | Component development patterns |
| CI/CD pipeline | Deployment workflow |
| Complex domain logic | Domain knowledge base |

Only suggest skills that make sense. A CLI tool doesn't need a "component development" skill.

## Step 3: Execute

With approval, execute sequentially. Confirm each major action individually.

### 3.1: Generate AGENTS.md

Invoke the `generate-claude-md` skill logic:

1. Run auto-detection (already done in Step 1 — reuse data)
2. Generate AGENTS.md draft
3. Present for review
4. Save after approval

### 3.2: Create Skills

For each approved skill:

1. Invoke the `create-skill` skill logic
2. The skill will ask clarifying questions about the specific skill
3. Generate and present for review
4. Save after approval
5. Move to the next skill

### 3.3: Create MCP Servers

For each approved MCP server:

1. Invoke the `create-mcp` skill logic
2. Follow its interactive flow (input, analysis, tool selection, generation)
3. Present for review
4. Save after approval

### 3.4: Configure settings.json

If MCP servers were created:

1. Read existing `.claude/settings.json` (if any)
2. Merge new `mcpServers` entries
3. Present the updated file for review
4. Save after approval

### 3.5: Suggest Geo-Claude Plugins

If Geovendas markers were detected:

1. List recommended plugins with descriptions
2. Show the installation command for each
3. Do NOT auto-install — the user runs these manually

Example output:
```
Recommended geo-codex plugins for this project:

- geo-git: Git workflow (semantic commits, PR creation)
  Install: /plugin install geo-git

- geo-ops: Operational tools (Jira, PostgreSQL, Firebase)
  Install: /plugin install geo-ops
```

## Step 4: Final Summary

After all steps complete, present a summary:

```
## Setup Complete

### Created
- ✓ AGENTS.md (project root)
- ✓ ~/.codex/skills/testing/SKILL.md
- ✓ ~/.codex/skills/api-debug/SKILL.md

### Configured
- ✓ .claude/settings.json (MCP servers)

### Suggested Plugins (install manually)
- geo-git: /plugin install geo-git
- geo-ops: /plugin install geo-ops

### Skipped
- MCP servers (no external API specs detected)
```

## Rules

- **Never overwrite existing files without asking.** If `AGENTS.md` exists, show what will change.
- **Present the full plan before executing.** No surprises.
- **Confirm each major action individually.** Don't batch-create 3 skills without per-skill review.
- **Partial work is valid.** If the wizard is interrupted, everything created so far should work independently.
- **Skip what doesn't apply.** No external APIs → skip MCP section entirely. No Geovendas markers → skip plugin suggestions.
- **Don't duplicate.** If a skill already exists in `~/.codex/skills/`, note it and skip.
- **Respect existing config.** Merge into existing `settings.json`, don't replace it.
