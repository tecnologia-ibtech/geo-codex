---
name: create-agent
description: "Creates an agent skill with proper execution loop, stop criteria, and safety patterns. Use when the user wants to create an agent, build autonomous behavior for Claude, or says /agent."
allowed-tools: Read, Glob, Grep, Write
---

# Create Agent

Creates an agent skill — a skill that defines autonomous, goal-driven behavior with an execution loop and clear stop criteria.

## When to Use an Agent vs Other Skill Types

Before creating an agent, confirm it's the right pattern:

| Pattern | Use when... | Example |
|---------|-------------|---------|
| **Workflow** | Steps are predictable and linear | Commit flow, deploy pipeline, audit checklist |
| **Knowledge Base** | Claude needs context, not instructions | Architecture docs, domain concepts |
| **Operational** | Integrating with a specific tool/service | Jira, PostgreSQL, Firebase |
| **Agent** | Behavior adapts based on what it discovers | Debugging, code review, refactoring |

**Agent indicators:**
- The task requires investigation before action
- The next step depends on the result of the previous step
- There's a goal to achieve, not a checklist to follow
- The agent might need multiple iterations to succeed
- Different inputs lead to fundamentally different execution paths

**Not an agent if:**
- The steps are always the same regardless of input (→ workflow)
- It's a sequential checklist (→ workflow)
- It only provides context without taking action (→ knowledge base)
- It wraps a single tool or API (→ operational)

## Step 1: Understand the Goal

Ask the user:

1. **"What should the agent accomplish?"** — The end goal, not the steps.
2. **"What triggers it?"** — When should Claude become this agent?
3. **"What can it do?"** — Which tools and actions are available?
4. **"When should it stop?"** — Success condition, failure condition, or both.
5. **"How autonomous should it be?"** — See autonomy levels below.

### Autonomy Levels

| Level | Description | Confirms before... | Example |
|-------|-------------|---------------------|---------|
| **Read-only** | Observes and reports, never modifies | N/A — no modifications | Audit, analysis, review |
| **Guided** | Proposes actions, waits for approval | Every action | Refactoring assistant, migration helper |
| **Semi-autonomous** | Acts freely within safe boundaries, confirms risky actions | Destructive or irreversible actions | Test runner, formatter |
| **Autonomous** | Acts freely toward the goal | Nothing — full trust | CI pipeline, batch processor |

**Default to Guided** unless the user explicitly requests more autonomy.

## Step 2: Context Analysis

Before generating, scan the project:

1. **Read `AGENTS.md`** — Understand conventions and stack
2. **Check `~/.codex/skills/`** — Avoid duplicating existing agents
3. **Detect stack** — The agent's instructions should reference real tools and paths

## Step 3: Design the Agent

### 3.1: Define the Execution Loop

Every agent has a loop. Design it explicitly:

```
┌─→ Observe (gather information)
│   ↓
│   Analyze (interpret what was found)
│   ↓
│   Decide (choose next action or stop)
│   ↓
│   Act (execute the chosen action)
│   ↓
│   Verify (check the result)
│   ↓
└── Loop back or Stop
```

For each phase, define:
- **Observe:** What to read/scan/check
- **Analyze:** What patterns or conditions to look for
- **Decide:** Decision criteria for each possible action
- **Act:** Concrete actions with tool usage
- **Verify:** How to confirm the action worked
- **Stop:** When to exit the loop

### 3.2: Define Stop Criteria

Every agent MUST have explicit stop criteria. Without them, it loops forever.

**Success stops:**
- Goal achieved (e.g., "all tests pass", "no issues found")
- All items processed (e.g., "reviewed all files in the changeset")

**Failure stops:**
- Max iterations reached (always set a limit)
- Blocked and can't proceed (e.g., "missing dependency, can't resolve")
- User cancels

**Safety stops:**
- About to do something destructive
- Confidence drops below threshold
- Outside defined scope

### 3.3: Define Safety Boundaries

Based on the autonomy level:

**Read-only agents:**
- `allowed-tools` restricts to `Read, Glob, Grep`
- No `Write`, `Edit`, or `Bash` in allowed-tools
- Skill text explicitly says "never modify files"

**Guided agents:**
- Can use `Write`, `Edit`, `Bash` but must present changes before applying
- Pattern: "Here's what I'd change: ... Apply this change?"

**Semi-autonomous agents:**
- Define a "safe zone" of automatic actions (e.g., formatting, adding imports)
- Define a "confirm zone" of risky actions (e.g., deleting files, changing APIs)
- Pattern: "I formatted 3 files automatically. I also want to delete `unused.ts` — OK?"

**Autonomous agents:**
- Full tool access
- Still must respect AGENTS.md rules and project conventions
- Should log actions for review

## Step 4: Generate the SKILL.md

Structure:

```yaml
---
name: <agent-name>
description: "<what it does>. Use when <trigger context>."
allowed-tools: <based on autonomy level>
---
```

```markdown
# <Agent Name>

<One sentence: what the agent does and why.>

## Objective

<Clear, measurable goal. Not "help with X" but "find and report X" or "fix all X until Y".>

## Scope

**In scope:**
- <specific things the agent handles>

**Out of scope:**
- <things the agent must NOT do>

## Available Tools

| Tool | When to use |
|------|-------------|
| Read | <specific usage> |
| Glob | <specific usage> |
| ... | ... |

## Execution Loop

### 1. Observe
<what to gather>

### 2. Analyze
<what to look for>

### 3. Decide
<decision criteria>
- If <condition A> → <action>
- If <condition B> → <action>
- If <condition C> → Stop

### 4. Act
<how to execute the chosen action>

### 5. Verify
<how to confirm it worked>

### 6. Loop or Stop
- **Continue** if <condition>
- **Stop (success)** if <condition>
- **Stop (failure)** if <condition>
- **Stop (safety)** if iterations > <max>

## Success Criteria

- [ ] <measurable criterion>
- [ ] <measurable criterion>

## Failure Handling

| Situation | Action |
|-----------|--------|
| <blocker> | <what to do> |
| <error> | <what to do> |
| Max iterations reached | Report progress so far, explain what's left |

## Rules

- <constraint>
- <constraint>
```

### Writing Guidelines

- **Objective must be measurable.** "Improve code quality" is bad. "Find and report code style violations" is good.
- **Scope must have explicit exclusions.** What the agent must NOT touch is as important as what it handles.
- **Execution loop must be concrete.** Not "analyze the code" but "read each file matching `src/**/*.ts` and check for unused imports."
- **Stop criteria must be exhaustive.** Cover success, failure, AND safety stops.
- **Decisions must be explicit.** Not "decide what to do" but "if unused import found → remove it; if unsure → ask user."
- **Rules should prevent the most likely mistakes.** Think about what could go wrong and add rules to prevent it.

## Anti-Patterns

Warn the user if the design falls into these traps:

| Anti-pattern | Problem | Fix |
|--------------|---------|-----|
| No stop criteria | Loops forever | Always define max iterations and success/failure conditions |
| "Do everything" scope | Unpredictable behavior | Narrow the scope to one clear goal |
| Autonomous + destructive | Data loss risk | Use guided or semi-autonomous for destructive actions |
| Vague decisions | Inconsistent behavior | Make every decision binary with explicit conditions |
| No verification step | Silent failures | Always verify after acting |
| Catching all errors silently | Masks real problems | Fail loudly on unexpected errors |

## Step 5: Present for Review

Show the full SKILL.md to the user:

> Here's the agent skill I've designed:
>
> <full content>
>
> Key design choices:
> - **Autonomy:** <level> — <why>
> - **Max iterations:** <N>
> - **Stop criteria:** <summary>
>
> Does this look good, or would you like changes?

## Step 6: Save and Register

After approval:

1. Create `~/.codex/skills/<name>/SKILL.md`
2. Skills in `~/.codex/skills/` are auto-discovered by Codex

## Validation Checklist

- [ ] Has `Objective` with a measurable goal
- [ ] Has `Scope` with explicit in/out boundaries
- [ ] Has `Execution Loop` with all phases (observe, analyze, decide, act, verify, stop)
- [ ] Has explicit stop criteria (success, failure, safety)
- [ ] Has `Failure Handling` table
- [ ] Has `Rules` section
- [ ] `allowed-tools` matches the autonomy level
- [ ] No anti-patterns present
- [ ] Max iterations defined
- [ ] Destructive actions require confirmation (unless autonomous by design)
