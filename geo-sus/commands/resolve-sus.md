---
name: resolve-sus
description: Resolve a specific SUS task end-to-end. Usage /resolve-sus SUS-6279
argument-hint: <SUS-XXXX> [contexto opcional]
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
  - mcp__claude_ai_Atlassian__editJiraIssue
  - mcp__apontamento__geovendas_criar_apontamento
  - mcp__plugin_playwright_playwright__browser_navigate
  - mcp__plugin_playwright_playwright__browser_click
  - mcp__plugin_playwright_playwright__browser_fill_form
  - mcp__plugin_playwright_playwright__browser_snapshot
  - mcp__plugin_playwright_playwright__browser_evaluate
  - mcp__plugin_playwright_playwright__browser_wait_for
  - mcp__plugin_playwright_playwright__browser_press_key
  - mcp__plugin_playwright_playwright__browser_type
  - mcp__plugin_playwright_playwright__browser_console_messages
  - mcp__plugin_playwright_playwright__browser_network_requests
  - mcp__plugin_playwright_playwright__browser_take_screenshot
  - mcp__plugin_playwright_playwright__browser_close
  - mcp__plugin_playwright_playwright__browser_navigate_back
  - mcp__plugin_playwright_playwright__browser_handle_dialog
  - mcp__plugin_playwright_playwright__browser_hover
  - mcp__plugin_playwright_playwright__browser_select_option
  - mcp__plugin_playwright_playwright__browser_tabs
---

Invoke the `sus-resolution` skill and follow it exactly. The user provided a SUS task key as argument — execute ALL steps from 0 (time tracking) through finalization (apontamento).

If the user provided extra context (e.g., "/resolve-sus SUS-6279 eh no pedidos"), pass that context to step 3 (repo identification) — it helps skip the identification phase.

If the user called this as `/finalizar-tarefa-sus` or asked to "finalizar tarefa SUS" / "enviar para revisao" — the fix is already done. Skip to the Finalization-Only Mode.
