---
name: fix-pr
description: "Handles a rejected PR (changes requested): reads review comments, fixes the code, commits, pushes, and re-requests review. Use when a PR was rejected, has changes requested, review feedback needs to be addressed, or the user says /fix-pr."
allowed-tools: Bash(gh:*), Bash(git:*), Read, Edit, Grep, Glob
---

# Fix PR

Receives a rejected or "changes requested" PR, understands the review feedback, fixes the code accordingly, and re-requests review from the original reviewers.

## Steps

### 1. Identify the PR

Determine which PR to fix:
- If user provides a PR number or URL: use it
- If not: check if current branch has an open PR via `gh pr view`
- If no PR found: ask the user

Fetch PR state and confirm it has review feedback:

```bash
gh pr view <number> --json number,title,state,headRefName,baseRefName,reviewRequests,reviews,url
```

If the PR is already merged or closed, inform the user and stop.

### 2. Checkout the PR branch

Ensure we're on the correct branch:

```bash
git fetch origin
git checkout <headRefName>
git pull origin <headRefName>
```

If there are uncommitted local changes, warn the user and ask how to proceed (stash, commit, or abort).

### 3. Gather all review feedback

Fetch every piece of feedback — inline comments, review summaries, and conversation threads:

```bash
# Review summaries (CHANGES_REQUESTED, COMMENTED, etc.)
gh api repos/{owner}/{repo}/pulls/<number>/reviews --jq '.[] | select(.state == "CHANGES_REQUESTED" or .state == "COMMENTED") | {author: .user.login, state: .state, body: .body}'

# Inline review comments (file, line, body)
gh pr view <number> --json reviewThreads --jq '.reviewThreads[] | select(.isResolved == false) | {path: .comments[0].path, line: .comments[0].line, comments: [.comments[] | {author: .author.login, body: .body}]}'
```

Also check for general PR comments (not inline):

```bash
gh api repos/{owner}/{repo}/issues/<number>/comments --jq '.[] | {author: .user.login, body: .body}'
```

### 4. Analyze and plan fixes

For each unresolved feedback item, classify it:

| Category | Example | Action |
|----------|---------|--------|
| **Code change** | "This should use `Optional` instead of null check" | Edit the file |
| **Missing logic** | "Handle the case where list is empty" | Add code |
| **Remove code** | "This is dead code, remove it" | Delete code |
| **Test needed** | "Add a test for this edge case" | Create/modify test |
| **Question** | "Why did you choose this approach?" | Respond as PR comment (ask user) |
| **Style/naming** | "Rename this to follow convention" | Edit the file |
| **Architecture** | "This should be in a separate service" | May require significant refactor — flag to user |

Present the plan to the user:

```
## Fix Plan for PR #<number>

### Feedback from @reviewer1:
1. [file.java:42] "Use Optional instead of null check" → **Will fix**: wrap return in Optional
2. [file.java:78] "Add test for empty list" → **Will fix**: add test case

### Feedback from @reviewer2:
3. [Service.java:15] "This should be extracted to a util" → **Needs discussion**: significant refactor, want to proceed?

### Questions (will not auto-fix):
4. [file.java:90] "Why this approach?" → **Need your input** to respond

Proceed with fixes 1-2? (y/n)
```

**Wait for user approval before making changes.**

### 5. Apply fixes

For each approved fix:

1. **Read** the full file for context (not just the diff line)
2. **Understand** the surrounding code — imports, class structure, related methods
3. **Edit** the file with the minimal change needed
4. **Verify** the edit makes sense in context (re-read if needed)

Rules for applying fixes:
- Fix ONLY what the reviewer asked for — no drive-by refactoring
- If a fix requires changes in multiple files (e.g., interface + implementation), fix all of them
- If a fix conflicts with another fix, flag it to the user
- Preserve the existing code style (indentation, naming conventions, import order)

### 6. Verify changes

After all fixes are applied:

```bash
# Check what changed
git diff --stat
git diff

# Make sure no files were accidentally modified
git status
```

Present the summary of changes to the user. If the project has a build/test command, suggest running it.

### 7. Commit and push

Stage and commit the fixes with a clear message referencing the PR:

```bash
git add <specific-files>
git commit -m "$(cat <<'EOF'
fix: addressed PR review feedback (#<number>)

- <description of fix 1>
- <description of fix 2>
- <description of fix N>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"

git push origin HEAD
```

Use the geo-git commit conventions:
- Type is usually `fix:` or `refactor:` depending on the nature of changes
- Include scope if the PR has one
- List each fix as a bullet point in the body

### 8. Re-request review

Identify the original reviewers and re-request their review:

```bash
# Get reviewers who requested changes
gh api repos/{owner}/{repo}/pulls/<number>/reviews --jq '[.[] | select(.state == "CHANGES_REQUESTED") | .user.login] | unique | .[]'

# Re-request review
gh pr edit <number> --add-reviewer <reviewer1>,<reviewer2>
```

### 9. Report

Present the final status:

```markdown
## PR #<number> — Fixes Applied

**Branch:** <branch-name>
**PR:** <url>

### Changes made:
- [file.java:42] Wrapped return in Optional (feedback from @reviewer1)
- [file.java:78] Added test for empty list (feedback from @reviewer1)

### Skipped (needs discussion):
- [Service.java:15] Extract to util — flagged for discussion

### Review re-requested from:
- @reviewer1
- @reviewer2
```

## Handling Edge Cases

| Situation | Action |
|-----------|--------|
| PR has no review feedback | Inform user — nothing to fix |
| All conversations already resolved | Inform user — PR may be ready to merge |
| Reviewer asked for something unclear | Flag as "Needs discussion" — don't guess |
| Fix requires a large refactor | Present scope to user, ask before proceeding |
| Reviewer comments conflict with each other | Flag the conflict, let user decide |
| Branch has merge conflicts with base | Warn user, suggest rebasing first |
| `gh` auth fails | Ask user to run `gh auth login` |
| PR is from a fork | Adjust git remote commands accordingly |

## Rules

- **NEVER auto-fix without showing the plan first.** Always present the fix plan and wait for approval.
- **NEVER modify code beyond what the reviewer asked.** No drive-by cleanups.
- **NEVER skip pre-commit hooks** (no --no-verify).
- **NEVER force push** (no --force). If history needs fixing, discuss with user.
- **Classify questions separately.** Don't invent answers to reviewer questions — ask the user.
- **Preserve commit history.** Create a new commit for the fixes, don't amend or squash.
- **Handle partial approval.** User may approve some fixes and skip others — respect that.
- **Be transparent about uncertainty.** If you're not sure what the reviewer meant, say so.
