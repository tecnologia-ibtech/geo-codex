#!/bin/bash
# SUS Auto-Resolver Polling Script
# Invoked by cron every 10 minutes.
# Checks for To Do SUS tasks via Claude + MCP Atlassian and resolves them.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${PLUGIN_DIR}/data/logs"
LOCK_FILE="/tmp/sus-auto-resolver.lock"
LOG_FILE="${LOG_DIR}/poll.log"
MAX_LOG_SIZE=5242880  # 5MB

mkdir -p "$LOG_DIR"

# --- Log rotation ---
if [ -f "$LOG_FILE" ] && [ "$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)" -gt "$MAX_LOG_SIZE" ]; then
    mv "$LOG_FILE" "${LOG_FILE}.old"
fi

log() {
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*" >> "$LOG_FILE"
}

# --- Lock file (prevent overlapping runs) ---
if [ -f "$LOCK_FILE" ]; then
    LOCK_PID=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
    if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
        log "SKIP: Previous run still active (PID ${LOCK_PID})"
        exit 0
    else
        log "WARN: Stale lock file found, removing"
        rm -f "$LOCK_FILE"
    fi
fi

echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

log "START: Polling for SUS tasks"

# --- Ensure claude is available ---
CLAUDE_BIN=$(command -v claude 2>/dev/null || echo "")
if [ -z "$CLAUDE_BIN" ]; then
    # Try common paths
    for path in /usr/local/bin/claude "$HOME/.claude/bin/claude" "$HOME/.local/bin/claude"; do
        if [ -x "$path" ]; then
            CLAUDE_BIN="$path"
            break
        fi
    done
fi

if [ -z "$CLAUDE_BIN" ]; then
    log "ERROR: claude CLI not found in PATH"
    bash "$SCRIPT_DIR/notify.sh" "SYSTEM" "claude CLI not found. Check PATH in cron environment."
    exit 1
fi

# --- Run Claude to check and resolve tasks ---
PROMPT='You are the SUS Auto-Resolver running in autonomous mode (cron).

Follow the sus-resolution skill workflow:
1. Query Jira for To Do SUS tasks (assigned to $JIRA_ACCOUNT_ID or unassigned)
2. For each task: analyze, evaluate confidence, resolve or notify
3. For HIGH confidence tasks: move to In Progress, fix the bug, create PR, finalize to Ready to Review
4. For LOW confidence tasks: run the notify script at '"${PLUGIN_DIR}"'/scripts/notify.sh with the task key and a clear explanation of what is unclear
5. After resolving, save any new patterns learned to '"${PLUGIN_DIR}"'/commands/sus-lessons.md

IMPORTANT: You are running non-interactively. Do NOT ask questions. Either resolve with high confidence or notify and skip.
Output a brief JSON summary at the end: {"resolved": [...], "skipped": [...], "errors": [...]}'

RESULT=$("$CLAUDE_BIN" -p "$PROMPT" \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --model opus \
    2>&1) || true

log "RESULT: $(echo "$RESULT" | tail -20)"
log "END: Polling complete"
