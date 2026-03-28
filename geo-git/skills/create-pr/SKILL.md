---
name: create-pr
description: Creates GitHub pull requests with conventional commit titles for Geovendas repos. Use when creating PRs, submitting changes for review, or when the user says /pr or asks to create a pull request.
allowed-tools: Bash(git:*), Bash(gh:*), Read, Grep, Glob
---

# Create Pull Request

Creates GitHub PRs with titles in Conventional Commits format for Geovendas repositories.

## PR Title Format

```
<type>(<scope>): <summary>
```

### Types (required)

| Type       | Description                                      |
|------------|--------------------------------------------------|
| `feat`     | New feature                                      |
| `fix`      | Bug fix                                          |
| `perf`     | Performance improvement                          |
| `test`     | Adding/correcting tests                          |
| `docs`     | Documentation only                               |
| `refactor` | Code change (no bug fix or feature)              |
| `build`    | Build system or dependencies                     |
| `ci`       | CI configuration                                 |
| `chore`    | Routine tasks, maintenance                       |

### Scopes (optional but recommended)

Use the project/module area affected:

- `vaadin6` - Backend + Backoffice legacy (geovendas-vaadin6)
- `vue` - Frontend CRM 360 (geovendas-vue)
- `vaadin23` - Novo Backoffice (geovendas-vaadin23)
- `pedidos` - Forca de Vendas / App ISF
- `dotnet` - Integracoes .NET (Comm, B2B, Storage)
- `etl` - ETL Java 8
- `b2b` - Portal B2B
- `geochat` - API WhatsApp (geochat-api)
- `entity` - Entidades compartilhadas (geovendas-entity)
- `service` - Services compartilhados (geovendas-service)
- `repo` - Repositories compartilhados (geovendas-repository)
- `lib` - Biblioteca Java 17 (geovendas-java17-lib)
- `api` - REST API endpoints

### Summary Rules

- Use past tense: "added" not "Add" (consistent with commit messages)
- Lowercase first letter
- No period at the end
- Include Jira ticket in the PR body, NOT in the title

## Language

- Always write the PR title summary and body in **Portuguese**.
- The Conventional Commits prefix (e.g., `feat(vue):`) is always in English.
- The language rule applies to: summary in the title, body bullet points, and checklist items.

## Steps

### 1. Check current state

```bash
git status
git log --oneline -10
```

Determine:
- Current branch name
- Commits ahead of base branch
- Any uncommitted changes (warn the user if there are)

### 2. Detect base branch

Do NOT assume `main`. Detect the actual default branch:

```bash
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'
```

If the command fails, fall back to checking for `main` or `master`:

```bash
git branch -r | grep -E 'origin/(main|master)$'
```

### 3. Analyze changes

Review all commits since diverging from base branch:

```bash
git log <base-branch>..HEAD --oneline
git diff <base-branch>..HEAD --stat
```

Determine:
- **Type:** What kind of change is this?
- **Scope:** Which project/area is affected?
- **Summary:** What does the change do?

### 4. Detect Jira ticket

Try to extract the Jira ticket automatically:

1. **From branch name:** Match pattern `GEO-\d+` in the current branch name (e.g., `feature/GEO-1234-add-filter` → `GEO-1234`)
2. **From commit messages:** Search for `GEO-\d+` in commit messages since base branch
3. **If not found:** Ask the user for the Jira ticket number

### 5. Draft title and body

Compose the PR title and body. Present to the user for review:

> Here's the PR I'll create:
>
> **Title:** `fix(vaadin6): fixed N+1 query in prospect listing`
>
> **Base:** `main`
>
> **Body:**
> ```
> ## Summary
>
> - Fixed N+1 query in prospect listing by adding join fetch
> - Added index on prospect.segment_id for faster filtering
>
> ## Jira
>
> [GEO-1234](https://geovendas.atlassian.net/browse/GEO-1234)
>
> ## Checklist
>
> - [x] Titulo da PR segue Conventional Commits
> - [ ] Testes incluidos ou justificativa
> - [ ] Procedure Description preenchida na tarefa Jira
> ```
>
> Create as **regular PR** or **draft**?
>
> Want to adjust anything?

**Wait for approval before proceeding.**

### 6. Push branch

Only after the user approves the PR content, push the branch:

```bash
git push -u origin HEAD
```

If push fails (e.g., no remote, auth error), report the error and stop.

### 7. Create PR

```bash
gh pr create --title "<title>" --base "<base-branch>" --body "$(cat <<'EOF'
## Summary

<bullet points describing the changes>

## Jira

[GEO-XXXX](https://geovendas.atlassian.net/browse/GEO-XXXX)

## Checklist

- [x] Titulo da PR segue Conventional Commits
- [ ] Testes incluidos ou justificativa
- [ ] Procedure Description preenchida na tarefa Jira
EOF
)"
```

If the user chose draft, add `--draft` flag.

### 8. Report

After creation, show:
- PR URL
- Title
- Base branch → head branch
- Draft status if applicable

## PR Body Guidelines

### Summary Section
- Bullet points describing what the PR does
- Explain how to test the changes
- Include screenshots/videos for UI changes

### Jira Section
- Link to Jira task: `https://geovendas.atlassian.net/browse/GEO-XXXX`
- Auto-detected from branch name or commit messages
- If not found, ask the user

### Checklist
- PR title follows Conventional Commits
- Tests included (bugs need regression tests, features need coverage)
- Procedure Description filled in Jira task (via jira-geo skill)

## Examples

### Feature in Vue frontend
```
feat(vue): added prospect filtering by segment
```

### Bug fix in backend
```
fix(vaadin6): resolved N+1 query in prospect listing
```

### Refactor in shared service
```
refactor(service): extracted price calculation to shared util
```

### Breaking change (add exclamation mark before colon)
```
feat(api)!: removed deprecated v1 endpoints
```

### No scope (affects multiple areas)
```
chore: updated dependencies to latest versions
```

### Forca de Vendas change
```
fix(pedidos): handled offline sync conflict in order submission
```

## Rules

- NEVER skip pre-commit hooks (no --no-verify)
- NEVER force push (no --force)
- ALWAYS present title and body for user review before creating
- ALWAYS detect the base branch — never hardcode `main`
- If the user mentions a Jira task (GEO-XXXX), include it in the PR body
- If a Jira ticket is found in the branch name, use it automatically
- Ask the user if they want a regular PR or draft
- ALWAYS write the PR in Portuguese (title summary and body)
