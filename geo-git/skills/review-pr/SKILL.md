---
name: review-pr
description: "Reviews a GitHub pull request for code quality, conventions, and potential issues. Use when the user wants to review a PR, analyze a pull request, check PR quality, or says /review-pr."
allowed-tools: Bash(gh:*), Bash(git:*), Read, Glob, Grep
---

# Review PR

Agent that analyzes a GitHub pull request and produces a structured review with findings, suggestions, and inline comments posted directly on GitHub.

## Objective

Review a PR thoroughly and produce actionable feedback. Catch real issues — not nitpicks. Focus on what matters: correctness, conventions, missing tests, and potential bugs.

## Rules

- **All output in Portuguese.** Every message, comment, and text produced by this skill — general body, inline comments, messages to the user — must be in Brazilian Portuguese. The instructions here are in English (for Claude), but everything Claude produces as output must be in Portuguese.
- **Inline comments on exact lines only.** Every finding must be placed directly on the line of code where the fix needs to happen. Generic file-level comments are not acceptable — if there is no specific line, there is no inline comment.
- **General comment is mandatory.** Always post a `body` in the review with the analysis summary, strengths, and weaknesses — even if the PR is approved without reservations.
- **Be specific.** "This might cause issues" is useless. "Line 42: `user.name` can be null when account is deactivated, causing TypeError" is useful.
- **Don't nitpick.** Skip formatting issues that a linter would catch. Focus on logic, correctness, and architecture.
- **Acknowledge good work.** Every review must include a "Pontos fortes" section.
- **Respect context.** If the PR is a hotfix, don't request a full test suite. If it's a refactor, don't request new features.
- **Max 3 iterations** of the execution loop to prevent over-analysis.

## Scope

**In scope:**
- PR metadata (title, body, labels, Jira ticket)
- Code changes (diff analysis, logic errors, patterns)
- Convention compliance (Conventional Commits, project standards)
- Test coverage (are changes tested?)
- Risk assessment (size, complexity, breaking changes)

**Out of scope:**
- Approving or merging the PR (report only — user decides)
- Running tests or builds (agent is read-only)
- Reviewing code outside the PR diff

## Available Tools

| Tool | When to use |
|------|-------------|
| `gh pr view` | Fetch PR metadata (title, body, state, base branch) |
| `gh pr diff` | Fetch the full diff |
| `gh api` | Fetch PR comments, reviews, commit list; post the review |
| `git log` | Understand commit history in the PR |
| `Read` | Read full files when diff context isn't enough |
| `Grep` | Search codebase for related patterns, usages of changed functions |
| `Glob` | Find test files, related modules |

## Execution Loop

### 1. Observe — Gather PR Data

Identify the PR to review:
- If user provides a PR number or URL: use it
- If not: check if current branch has an open PR via `gh pr view`

Fetch all relevant data:

```bash
# PR metadata
gh pr view <number> --json title,body,baseRefName,headRefName,state,labels,additions,deletions,changedFiles,commits

# Full diff
gh pr diff <number>

# Commit list
gh pr view <number> --json commits --jq '.commits[].messageHeadline'
```

### 2. Analyze — Evaluate Each Aspect

Run through these analysis passes. The order matters — earlier passes inform later ones.

#### Pass A: PR Metadata

Check the PR itself:

| Check | PASS | WARN | FAIL |
|-------|------|------|------|
| Title follows Conventional Commits | `fix(vue): fixed...` | Missing scope | No type prefix |
| Body has Summary section | Present and descriptive | Present but empty | Missing |
| Jira ticket linked | `GEO-XXXX` in body | In commits but not body | Nowhere |
| Checklist present | Filled in | Present but unchecked | Missing |
| PR size | < 300 lines changed | 300-800 lines | > 800 lines |

#### Pass B: Commit Quality

Review the commit history:

- Are commits atomic (one logical change per commit)?
- Do commit messages follow Conventional Commits?
- Are there "fix typo" or "WIP" commits that should have been squashed?

#### Pass C: Code Changes

For each changed file, analyze:

**Logic & correctness:**
- New conditionals — are all branches handled?
- Null/undefined checks — can new code NPE?
- Error handling — are errors caught and handled properly?
- Edge cases — empty lists, zero values, negative numbers

**Patterns & conventions:**
- Read `AGENTS.md` if available to understand project conventions
- Do changes follow existing patterns in the codebase?
- Are new functions/methods consistent with naming conventions?
- Import organization — follows project style?

**Security (if applicable):**
- SQL queries — parameterized or vulnerable to injection?
- User input — sanitized before use?
- Credentials — any hardcoded secrets?
- New dependencies — are they trusted?

#### Pass D: Test Coverage

Check if changes are tested:

- Find test files related to changed files (search by name pattern, imports, or directory)
- Are there new test files in the PR?
- For bug fixes: is there a regression test?
- For new features: is there coverage for the happy path + edge cases?

#### Pass E: Risk Assessment

Evaluate overall risk:

| Factor | Low | Medium | High |
|--------|-----|--------|------|
| Lines changed | < 100 | 100-500 | > 500 |
| Files changed | 1-3 | 4-10 | > 10 |
| Areas affected | Single module | 2-3 modules | Cross-cutting |
| Breaking changes | None | Internal APIs | Public APIs |
| Data migrations | None | Additive | Destructive |
| Dependencies | None changed | Updated | Added new |

### 3. Decide — Prioritize Findings

Categorize each finding:

| Severity | Priority | Meaning | Action |
|----------|----------|---------|--------|
| **Blocker** | 🔴 Alto | Must fix before merge — bug, security issue, data loss risk | Request changes |
| **Warning** | 🟡 Médio | Should fix — convention violation, missing test, code smell | Comment |
| **Suggestion** | 🔵 Baixo | Nice to have — refactoring opportunity, better naming | Comment |
| **Note** | 🔵 Baixo | Informational — context for reviewer, question for author | Comment |

**Decision rules:**
- If any Blocker found → overall verdict is "Mudanças necessárias"
- If only Warnings → overall verdict is "Aprovado com comentários"
- If only Suggestions/Notes → overall verdict is "Aprovado"

**Line mapping:** Every finding must reference the exact line in the diff where the problem occurs. Use `gh pr diff <number>` to identify the correct line numbers. Findings without a specific line must be discarded or moved to the general review body.

### 4. Act — Compose the Review (in Portuguese)

**General body template** (required, always present):

```
## Análise Geral

**O que foi analisado:** <scope, files reviewed, context>

**Pontos fortes:**
- <what is good about the changes>

**Pontos a melhorar:**
- <summary of issues found — details go in the inline comments>

**Veredicto:** <Aprovado / Aprovado com comentários / Mudanças necessárias>
```

**Inline comment template** (one per line that needs a fix):

```
<🔴 Alto | 🟡 Médio | 🔵 Baixo> — <description of the problem on this line>

**Sugestão:** <what to change and why>
```

Always lead with the priority indicator matching the finding's severity: 🔴 for Blockers, 🟡 for Warnings, 🔵 for Suggestions and Notes. This lets reviewers triage at a glance.

### 5. Post Review — Publish to GitHub

#### Get the head commit SHA

```bash
gh pr view <number> --json headRefOid --jq '.headRefOid'
```

#### Post review with general body + all inline comments

```bash
gh api repos/{owner}/{repo}/pulls/<number>/reviews \
  --method POST \
  --field body="<required general comment in Portuguese>" \
  --field event="<COMMENT|REQUEST_CHANGES|APPROVE>" \
  --field 'comments[][path]'="<file>" \
  --field 'comments[][line]'=<line-number> \
  --field 'comments[][body]'="<inline comment in Portuguese>" \
  --field commit_id="<head-sha>"
```

Repeat the `comments[]` fields for each finding that has a specific line.

**Notes on `line`:**
- Use the line number in the final file (right side of the diff, `side: RIGHT` is the default)
- The line must exist in the PR diff — commenting on lines outside the diff causes a 422 error
- If a problem is in unchanged code (outside the diff), describe it in the general `body` only, not as an inline comment

### 6. Verify — Sanity Check

Before finishing:
- Does every finding reference a real line in the diff (not a line outside the PR)?
- Was the general comment posted with analysis, strengths, and weaknesses?
- Was every finding that requires a change posted as an inline comment on the exact line?
- Does every inline comment start with the correct priority indicator (🔴/🟡/🔵)?
- Are suggestions actionable (not vague like "improve this")?
- Is the verdict consistent with the findings?

### 7. Loop or Stop

- **Stop (success):** Review is complete with all passes done and posted to GitHub
- **Loop back to Analyze:** If reading a full file revealed new context that changes a finding, re-evaluate
- **Stop (safety):** Max 3 loop iterations — if still finding new issues, present what you have

## Success Criteria

- [ ] All 5 analysis passes completed (metadata, commits, code, tests, risk)
- [ ] Every inline comment starts with the correct priority indicator (🔴 Alto / 🟡 Médio / 🔵 Baixo)
- [ ] Every finding references a specific file and line number
- [ ] General comment posted in Portuguese with analysis, strengths, and weaknesses
- [ ] Every finding that requires a change posted as an inline comment on the exact line via `gh api`
- [ ] All output (body, inline comments) is written in Brazilian Portuguese
- [ ] Verdict is consistent with findings
- [ ] Review includes positive feedback, not just criticism

## Failure Handling

| Situation | Action |
|-----------|--------|
| PR not found | Ask user for correct PR number or URL |
| No diff available (empty PR) | Report that PR has no changes |
| Can't determine project conventions | Skip convention checks, note in review |
| PR is too large (> 2000 lines) | Review in chunks, warn about PR size as first finding |
| `gh` auth fails | Ask user to run `gh auth login` |
