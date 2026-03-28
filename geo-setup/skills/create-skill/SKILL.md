---
name: create-skill
description: "Creates a new skill in any project's ~/.codex/skills/ directory. Use when the user wants to create a skill for their project, add Codex capabilities, or says /skill."
allowed-tools: Read, Glob, Grep, Write
---

# Create Project Skill

Creates a new skill in the current project's `~/.codex/skills/` directory with proper structure, frontmatter, and content adapted to the skill's purpose.

## Step 1: Understand the Objective

Ask the user one question at a time:

1. **"What should this skill do?"** — Open-ended. Understand the goal, not the format.
2. **"What should we call it?"** — Suggest a kebab-case name based on the goal (e.g., `run-tests`, `review-api`, `db-migrations`). Let the user confirm or change.
3. **"When should Claude invoke this skill?"** — This becomes the trigger context in the `description` field. Examples:
   - "When writing tests or fixing test failures"
   - "When creating API endpoints"
   - "When running database migrations"
4. **"What tools does the skill need?"** — Suggest based on the goal:

| Skill type | Suggested `allowed-tools` |
|------------|---------------------------|
| Read-only analysis | `Read, Glob, Grep` |
| File modifications | `Read, Glob, Grep, Write, Edit` |
| Shell commands needed | `Read, Glob, Grep, Bash` |
| Full access | Omit `allowed-tools` entirely |

Let the user confirm or adjust.

## Step 2: Context Analysis

Before generating the skill, scan the project:

1. **Read `AGENTS.md`** (if exists) — Understand conventions, stack, naming patterns.
2. **Check `~/.codex/skills/`** (if exists) — List existing skills. Warn if a similar skill already exists.
3. **Detect stack** — Read build files (`package.json`, `pom.xml`, etc.) to understand the project's technology.

Use this context to make the skill's content relevant to the project.

## Step 3: Determine Skill Structure

Based on the objective, determine which structure best fits. Do NOT force a category — adapt the structure to what the skill needs to accomplish.

### Workflow Skills

Best for skills that define a process or procedure (e.g., TDD, deployment, code review).

```markdown
## Overview
<one-line summary>

## Steps
1. <step>
2. <step>
...

## Rules
- <constraint>
- <constraint>

## Validation Checklist
- [ ] <check>
- [ ] <check>
```

### Knowledge Base Skills

Best for skills that provide architectural context or documentation (e.g., system overview, API patterns).

```markdown
## System Overview
<what the system does>

## Architecture
<components, layers, data flow>

## Patterns & Conventions
<how code is organized, naming, structure>

## Troubleshooting
| Problem | Cause | Solution |
|---------|-------|----------|
```

### Operational Skills

Best for skills that integrate with external tools or services (e.g., deploy, database, API calls).

```markdown
## Configuration
<setup, prerequisites, credentials>

## Usage
<how to use, with examples>

## Reference
<API endpoints, commands, field mappings>

## Common Errors
| Error | Cause | Fix |
|-------|-------|-----|
```

### Agent Skills

Best for skills that define autonomous behavior (e.g., code review bot, test runner, linter).

```markdown
## Objective
<what the agent accomplishes>

## Scope
<boundaries — what to do and what NOT to do>

## Available Tools
<which tools to use and when>

## Execution Loop
1. <check/analyze>
2. <decide>
3. <act>
4. <verify>
5. <stop when...>

## Success Criteria
- <criterion>

## Failure Handling
- <what to do when blocked>
```

### Custom Structure

If none of the above fit well, create a structure tailored to the objective. The key principles:

- Start with a clear overview
- Organize content by how Claude will use it (step-by-step for processes, reference for lookups)
- Include concrete examples where helpful
- End with rules or constraints

## Step 4: Generate the SKILL.md

Create the file with:

1. **YAML frontmatter** — `name`, `description` (with trigger context), and optionally `allowed-tools`
2. **Title** — `# <Skill Name>` (human-readable, not kebab-case)
3. **Content** — Following the determined structure, populated with project-specific details

**Writing guidelines:**

- Be specific to the project's stack and conventions
- Use imperative voice for instructions ("Run tests", not "You should run tests")
- Include real paths, commands, and patterns from the project
- Keep instructions actionable — Claude should know exactly what to do at each step
- Avoid vague phrases like "as needed" or "if applicable" — be explicit

## Step 5: Present for Review

Show the full SKILL.md content to the user:

> Here's the skill I've generated:
>
> <full content>
>
> Does this look good, or would you like changes?

Apply any requested changes before saving.

## Step 6: Save and Register

After approval:

1. **Create the file:** `~/.codex/skills/<name>/SKILL.md`
2. **Inform the user:** Skills in `~/.codex/skills/` with proper SKILL.md frontmatter are auto-discovered by Codex. No manual registration is needed.
3. **Note:** If auto-discovery doesn't work, the user can add to `.claude/settings.json`:
   ```json
   {
     "skills": {
       "<name>": {
         "path": "~/.codex/skills/<name>/SKILL.md"
       }
     }
   }
   ```

## Validation Checklist

Before finishing, verify:

- [ ] SKILL.md has valid YAML frontmatter (`name`, `description`)
- [ ] `name` is kebab-case and matches the directory name
- [ ] `description` includes trigger context (when to invoke)
- [ ] Directory created at `~/.codex/skills/<name>/`
- [ ] No duplicate skill name exists in the project
- [ ] Content sections match the skill's purpose
- [ ] Instructions are specific to the project (not generic boilerplate)
