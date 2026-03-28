---
name: audit-project
description: "Audits the current project's Codex configuration for health, completeness, and drift. Use when the user wants to check if AGENTS.md is up to date, validate skills, verify MCP servers, or says /audit."
allowed-tools: Read, Glob, Grep, Bash(git:*)
---

# Audit Project

Agent that analyzes the current project's Codex configuration and reports issues, drift, and improvement opportunities.

## Objective

Detect configuration problems before they cause confusion. Report findings clearly with actionable fixes.

## Scope

**In scope:**
- AGENTS.md accuracy vs actual project state
- Skill files validity and consistency
- MCP server configuration health
- Missing configurations that should exist

**Out of scope:**
- Fixing issues automatically (report only — the user decides)
- Auditing application code quality
- Security scanning

## Execution

### 1. Gather Project State

Collect facts before checking anything:

**Stack detection:**
- Read build files (`package.json`, `pom.xml`, `build.gradle`, `*.csproj`, `Cargo.toml`, `pyproject.toml`, `go.mod`)
- List top-level directories
- Read linter/formatter configs (`.editorconfig`, `.prettierrc*`, `.eslintrc*`, `biome.json`, `tsconfig.json`)
- Check `git log --oneline -10` for recent activity

**Codex config:**
- Read `AGENTS.md` (if exists)
- List `~/.codex/skills/*/SKILL.md` (if any)
- Read `.claude/settings.json` (if exists)

### 2. Run Checks

Execute each check independently. A check produces one of:

| Status | Meaning |
|--------|---------|
| PASS | No issues found |
| WARN | Not critical but should be addressed |
| FAIL | Broken or significantly outdated |
| SKIP | Check not applicable (e.g., no MCP servers configured) |

#### Check 1: AGENTS.md Exists

- **FAIL** if no `AGENTS.md` in project root
- **Fix:** Run `/claude-md` to generate one

#### Check 2: AGENTS.md — Tech Stack Accuracy

Compare the tech stack section in AGENTS.md against actual build files:

- **FAIL** if AGENTS.md mentions a framework/language not in dependencies
- **FAIL** if a major framework in dependencies is not mentioned
- **WARN** if dependency versions in AGENTS.md are outdated (e.g., says "React 17" but `package.json` has "React 18")
- **PASS** if stack section matches reality

#### Check 3: AGENTS.md — Directory Structure Accuracy

Compare the directory structure section against actual directories:

- **WARN** if AGENTS.md lists directories that don't exist
- **WARN** if significant directories exist but aren't listed
- **PASS** if structure matches

#### Check 4: AGENTS.md — Commands Accuracy

Compare run/build/test commands in AGENTS.md against actual scripts:

- **FAIL** if commands reference scripts that don't exist (e.g., `npm run dev` but no `dev` script in `package.json`)
- **WARN** if new scripts exist that aren't documented
- **PASS** if commands match

#### Check 5: AGENTS.md — Code Conventions Accuracy

Compare conventions section against linter/formatter configs:

- **WARN** if AGENTS.md says "2 spaces" but `.editorconfig` says `indent_size = 4`
- **WARN** if a linter/formatter config exists but AGENTS.md doesn't mention conventions
- **PASS** if conventions match or no configs to compare against

#### Check 6: Skills — Frontmatter Validity

For each `~/.codex/skills/*/SKILL.md`:

- **FAIL** if missing YAML frontmatter
- **FAIL** if missing `name` field
- **FAIL** if missing `description` field
- **WARN** if `name` doesn't match directory name
- **WARN** if `description` lacks trigger context (no "Use when" or similar)
- **PASS** if all fields valid

#### Check 7: Skills — No Duplicates

- **WARN** if two skills have the same or very similar `name`
- **PASS** if all names unique

#### Check 8: MCP Servers — Configuration Health

For each server in `.claude/settings.json` → `mcpServers`:

- **FAIL** if `cwd` path doesn't exist
- **FAIL** if `command` is not found (check with `which`)
- **WARN** if `env` references variables that aren't set (check with `printenv`)
- **SKIP** if no `mcpServers` configured
- **PASS** if all servers look healthy

#### Check 9: Missing Configs

Detect things that should probably be configured:

- **WARN** if project has tests but AGENTS.md has no "How to Test" section
- **WARN** if project has linter config but no conventions in AGENTS.md
- **WARN** if project has CI/CD but AGENTS.md doesn't mention it
- **PASS** if nothing obviously missing

#### Check 10: Staleness

Check if the configuration might be outdated:

- **WARN** if `AGENTS.md` last modified > 30 days ago and there have been commits since
- **WARN** if `package.json` / `pom.xml` modified more recently than `AGENTS.md`
- **PASS** if config is recent or no signs of drift

### 3. Generate Report

Present findings as a structured report:

```
## Audit Report — <project-name>

Date: <today>

### Summary

| Status | Count |
|--------|-------|
| PASS   | 7     |
| WARN   | 2     |
| FAIL   | 1     |
| SKIP   | 0     |

### Issues

#### FAIL: AGENTS.md commands reference missing scripts
`npm run dev` is documented but `package.json` has no `dev` script.
The actual dev command is `npm run serve`.
**Fix:** Update AGENTS.md "How to Run" section.

#### WARN: Directory structure outdated
AGENTS.md lists `lib/` but this directory no longer exists.
New directory `utils/` exists but is not documented.
**Fix:** Update AGENTS.md "Directory Structure" section.

#### WARN: AGENTS.md may be stale
Last modified 45 days ago. 23 commits since then.
**Fix:** Review and update AGENTS.md, or run `/claude-md` to regenerate.

### All Checks

| # | Check | Status |
|---|-------|--------|
| 1 | AGENTS.md exists | PASS |
| 2 | Tech stack accuracy | PASS |
| 3 | Directory structure | WARN |
| 4 | Commands accuracy | FAIL |
| 5 | Code conventions | PASS |
| 6 | Skills frontmatter | PASS |
| 7 | Skills duplicates | PASS |
| 8 | MCP servers health | SKIP |
| 9 | Missing configs | PASS |
| 10 | Staleness | WARN |
```

### 4. Suggest Actions

After the report, suggest next steps based on findings:

- FAIL items: suggest specific fixes or commands to run
- WARN items: suggest reviewing when convenient
- If many issues: suggest running `/setup` to reconfigure from scratch

**Do not fix anything automatically.** The audit is read-only. The user decides what to act on.

## Rules

- Read-only. Never modify files during an audit.
- Report all findings, even if everything passes (the user wants to know it was checked).
- Be specific in findings — include actual values vs expected values.
- Keep the report scannable — summary table first, details after.
- If a check can't run (missing files, no config), mark as SKIP, not FAIL.
- Run all checks even if early ones fail — the full picture is more useful than stopping early.
