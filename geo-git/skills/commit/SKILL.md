---
name: commit
description: Stages changes, creates semantic commits, and pushes to the remote. Use when the user says /commit or asks to commit and push changes.
allowed-tools: Bash(git:*), Bash(gh:*), Bash(cp:*), Bash(mkdir:*), Bash(rm:*), Read, Grep, Glob
---

# Git Add, Commit & Push

Analyzes the current diff, stages changes, creates one or more semantic commits following Conventional Commits, and pushes.

## Steps

1. **Inspect state** — run ALL of these in parallel:
   ```bash
   git status --porcelain
   git diff --stat
   git diff --staged --stat
   git log --oneline -5
   ```

2. **Check for `.claude/` changes** — look at the output of `git status --porcelain` for any file path starting with `.claude/` (excluding `.claude/settings.local.json`, which is always ignored). If `.claude/` files are found, ask the user before proceeding:

   > Existem alterações em `.claude/` (skills, configs, etc). Quer enviar esses arquivos direto para a main numa PR separada antes de continuar o commit?
   >
   > Arquivos em `.claude/`:
   > - `~/.codex/skills/...`
   >
   > Responda **sim** para abrir a PR separada, ou **não** para commitar tudo junto.

   If the user says **no**, continue normally with all files (skip to Step 3).

   If the user says **yes**, execute the **Split PR sub-workflow** below, then return to Step 3 to commit the remaining (non-`.claude/`) changes.

   ### Split PR sub-workflow

   This workflow uses `git worktree` to create an isolated copy of the repo, commits the `.claude/` files there against the default branch, and opens a PR — without touching the current working tree.

   #### 2a. Detect default branch

   ```bash
   gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'
   ```

   Fallback if `gh` fails:

   ```bash
   git branch -r | grep -E 'origin/(main|master)$'
   ```

   #### 2b. Generate branch name and commit message

   **Branch:** `split/claude-config` (if already exists on remote, add suffix: `split/claude-config-2`).

   **Commit message:** Conventional Commits format based on the diff of the selected `.claude/` files. Example: `chore(claude): updated skill definitions`.

   **PR title:** Same as the commit message.

   #### 2c. Create worktree, commit, and push

   ```bash
   git fetch origin <default-branch>

   WORKTREE_PATH="$(mktemp -d)"
   git worktree add "$WORKTREE_PATH" -b <branch-name> origin/<default-branch>
   ```

   If `git worktree add` fails because the branch already exists:

   ```bash
   git branch -D <branch-name>
   git worktree add "$WORKTREE_PATH" -b <branch-name> origin/<default-branch>
   ```

   Copy each selected `.claude/` file into the worktree:

   **Modified or New:**
   ```bash
   mkdir -p "$WORKTREE_PATH/$(dirname <file>)"
   cp "<file>" "$WORKTREE_PATH/<file>"
   ```

   **Deleted:**
   ```bash
   git -C "$WORKTREE_PATH" rm "<file>"
   ```

   Commit and push:
   ```bash
   git -C "$WORKTREE_PATH" add .
   git -C "$WORKTREE_PATH" commit -m "<commit-message>"
   git -C "$WORKTREE_PATH" push -u origin <branch-name>
   ```

   #### 2d. Open PR

   Detect Jira ticket — look for `GEO-\d+` in the current branch name and recent commits (`git log --oneline -5`).

   ```bash
   gh pr create \
     --head <branch-name> \
     --base <default-branch> \
     --title "<pr-title>" \
     --body "$(cat <<'EOF'
   ## Summary

   <bullets describing the .claude/ changes — in Portuguese>

   <if Jira ticket found:>
   ## Jira

   [GEO-XXXX](https://geovendas.atlassian.net/browse/GEO-XXXX)

   ## Checklist

   - [x] Titulo da PR segue Conventional Commits
   - [ ] Testes incluidos ou justificativa
   - [ ] Procedure Description preenchida na tarefa Jira

   ---
   *PR criada via split-pr (commit workflow)*
   EOF
   )"
   ```

   Capture the PR URL.

   #### 2e. Cherry-pick to current branch

   Bring the `.claude/` changes into the current branch via cherry-pick so they are available immediately:

   ```bash
   git cherry-pick <branch-name>
   ```

   This cherry-picks the tip commit of the split branch (which is the `.claude/` commit just pushed). The changes land on the current branch right away, and the PR remains open for review against the default branch.

   #### 2f. Cleanup and report

   ```bash
   git worktree remove "$WORKTREE_PATH" --force
   ```

   Show the result:
   ```
   PR criada: <pr-url>
     Branch:   <branch-name>
     Base:     <default-branch>
     Arquivos: <file list>
   ```

   Then continue to Step 3 with the remaining non-`.claude/` changes.

3. **Analyze the diff** — identify affected scopes (directories/modules) and classify each change group by type. If multiple unrelated areas were changed, split into separate commits.

4. **Stage and commit** — for each commit:
   ```bash
   git add <relevant-paths>
   git commit -m "<type>(<scope>): <description>"
   ```
   Do NOT use `git add -A` when splitting into multiple commits — stage only the files relevant to each commit.

5. **Push** to the remote:
   - No upstream: `git push -u origin HEAD`
   - Otherwise: `git push`

6. **Confirm** — run `git status` and show the result.

## Multi-Repository Workflows

When working in a multi-repo project (e.g., monorepo with sibling directories), changes may span multiple Git repositories.

### Detection

If the working directory structure includes multiple repos (check for `.git/` in sibling dirs or workspace config), inspect ALL of them in parallel:

```bash
# Run in parallel — one Bash call per repo
git -C /path/to/repo-a status --porcelain
git -C /path/to/repo-b status --porcelain
git -C /path/to/repo-c status --porcelain
```

### Commit Order

Commit in **dependency order** (upstream modules first). For example:
```
entity → repository → service → main-app
```

Each repo gets its own commit with its own message based on the changes in that repo.

### Push

Push all repos **in parallel** (they are independent):
```bash
# Run in parallel
git -C /path/to/repo-a push
git -C /path/to/repo-b push
git -C /path/to/repo-c push
```

### Confirm

Run `git status` on all affected repos in parallel to verify everything is clean.

## Commit Message Format

```
<type>(<scope>): <description>
```

- **type** — one of the types below
- **scope** — affected area (omit if unclear). Examples: config, api, auth, ui, db
- **description** — past tense, lowercase, no period, <72 characters

### Types

| Type | Use | Example |
|------|-----|---------|
| `feat` | New feature | `feat(auth): added OAuth2 login flow` |
| `fix` | Bug fix | `fix(api): corrected null check on response` |
| `refactor` | Restructuring without behavior change | `refactor(db): simplified query builder` |
| `docs` | Documentation | `docs(readme): updated setup instructions` |
| `test` | Tests | `test(auth): added unit tests for token refresh` |
| `chore` | Maintenance, deps, CI | `chore(deps): updated spring-boot to 3.2` |
| `style` | Formatting, no logic change | `style(ui): applied consistent indentation` |
| `perf` | Performance improvement | `perf(api): cached frequently accessed queries` |

### Style Rules

- English, past tense (`added`, `fixed`, `removed` — NOT `add`, `fixing`, `removes`)
- Lowercase description (no capital letter at start)
- No period at end
- Under 72 characters total
- When multiple modules are affected, prefer separate commits over a single large one

## Rules

- NEVER commit `.claude/settings.local.json` — always exclude it from staging. If it appears in `git status`, ignore it silently.
- NEVER skip pre-commit hooks (no --no-verify)
- NEVER force push (no --force)
- NEVER push to remote without explicit user request or /commit invocation
- If commit fails due to hooks, fix the issue and retry
- Do NOT ask the user for confirmation or message approval — analyze the diff and commit directly
- ALWAYS maximize parallelism — run independent git commands (status, diff, push) in parallel across repos
- Split PR sub-workflow: NEVER alter the working tree during worktree creation — total isolation
- Split PR sub-workflow: if worktree fails, cleanup (`git worktree remove --force`) before aborting
- Split PR sub-workflow: if `mktemp -d` fails, use fallback path based on timestamp
- Split PR sub-workflow: PR title/summary/body in Portuguese, Conventional Commits prefix in English
