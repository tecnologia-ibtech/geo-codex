---
name: check-sus
description: Check for To Do SUS tasks in Jira and resolve them automatically
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - Task
  - mcp__claude_ai_Atlassian__searchJiraIssuesUsingJql
  - mcp__claude_ai_Atlassian__getJiraIssue
  - mcp__claude_ai_Atlassian__transitionJiraIssue
  - mcp__claude_ai_Atlassian__addCommentToJiraIssue
  - mcp__claude_ai_Atlassian__getTransitionsForJiraIssue
---

# Check and Resolve SUS Tasks

Follow the `sus-resolution` skill workflow strictly.

## Steps

1. **Load learned patterns**: Read `${CLAUDE_PLUGIN_ROOT}/commands/sus-lessons.md`. These patterns override default heuristics.

2. **Read the dev's Jira account ID**:
   ```bash
   echo "$JIRA_ACCOUNT_ID"
   ```
   Se estiver vazio → parar e informar: "Configure `JIRA_ACCOUNT_ID` no seu shell (ver sus-lessons.md para instrucoes)."

3. **Query Jira** for To Do SUS tasks:
   ```
   project = SUS AND status = "To Do" AND (assignee = "<JIRA_ACCOUNT_ID>" OR assignee IS EMPTY) ORDER BY priority DESC
   ```

4. **If no tasks found**: Report "No pending SUS tasks" and exit.

5. **For each task found**:
   a. Fetch full task details via `getJiraIssue`
   b. Analyze title + description to identify product and repo
   c. Evaluate confidence across 3 dimensions (repo, bug clarity, actionability)
   d. **High confidence**: Resolve the task using the appropriate domain skill
   e. **Low confidence**: Notify via `${CLAUDE_PLUGIN_ROOT}/scripts/notify.sh` and log to pending

6. **Present summary** to the user:
   ```
   SUS Auto-Resolver Results:
   - Resolved: SUS-XXXX (geovendas-dotnet) — PR #NNN
   - Skipped (low confidence): SUS-YYYY — reason
   - Errors: none
   ```

## Interactive Mode

When running interactively (not via cron), ask the user before resolving if there are ambiguities. In this mode, low-confidence tasks can be resolved with user guidance instead of being skipped.

After any user clarification, update `${CLAUDE_PLUGIN_ROOT}/commands/sus-lessons.md` with the learned pattern.
