#!/bin/bash
# SUS Auto-Resolver Cron Setup
# Installs crontab entries for:
#   1. Polling Jira every 10 minutes
#   2. Daily backup at 3am

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== SUS Auto-Resolver Cron Setup ==="
echo "Plugin directory: ${PLUGIN_DIR}"
echo ""

# Ensure scripts are executable
chmod +x "$SCRIPT_DIR/poll-and-resolve.sh"
chmod +x "$SCRIPT_DIR/notify.sh"
chmod +x "$SCRIPT_DIR/backup.sh"

# --- Validate prerequisites ---
echo "Checking prerequisites..."

if ! command -v claude &>/dev/null; then
    echo "ERROR: claude CLI not found in PATH"
    exit 1
fi
echo "  claude CLI: OK"

if ! command -v gh &>/dev/null; then
    echo "ERROR: gh (GitHub CLI) not found"
    exit 1
fi
echo "  gh CLI: OK"

if ! command -v pigz &>/dev/null; then
    echo "WARNING: pigz not found. Install with: brew install pigz"
    echo "  Backup will fail without pigz."
fi
echo "  pigz: $(command -v pigz &>/dev/null && echo "OK" || echo "MISSING")"

if [ -n "${BACKUP_REMOTE_DEST:-}" ]; then
    REMOTE_HOST=$(echo "$BACKUP_REMOTE_DEST" | cut -d: -f1)
    if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$REMOTE_HOST" true 2>/dev/null; then
        echo "WARNING: Cannot connect to ${REMOTE_HOST} via SSH"
        echo "  Backup requires SSH key auth."
    fi
    echo "  Remote backup: $(ssh -o BatchMode=yes -o ConnectTimeout=5 "$REMOTE_HOST" true 2>/dev/null && echo "OK" || echo "UNREACHABLE")"
else
    echo "  Remote backup: SKIPPED (BACKUP_REMOTE_DEST not set)"
fi

echo ""

# --- Define cron entries ---
POLL_ENTRY="*/10 * * * * ${SCRIPT_DIR}/poll-and-resolve.sh >> ${PLUGIN_DIR}/data/logs/cron.log 2>&1"
BACKUP_ENTRY="0 3 * * * ${SCRIPT_DIR}/backup.sh >> ${PLUGIN_DIR}/data/logs/cron.log 2>&1"

# --- Show what will be added ---
echo "The following cron entries will be added:"
echo ""
echo "  # SUS Auto-Resolver: Poll Jira every 10 minutes"
echo "  ${POLL_ENTRY}"
echo ""
echo "  # SUS Auto-Resolver: Daily backup at 3am"
echo "  ${BACKUP_ENTRY}"
echo ""

read -p "Install cron entries? [y/N] " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted. You can add them manually to crontab -e"
    exit 0
fi

# --- Install to crontab (preserving existing entries) ---
EXISTING=$(crontab -l 2>/dev/null || echo "")

# Remove old SUS resolver entries if present
CLEANED=$(echo "$EXISTING" | grep -v "sus-auto-resolver" || true)

NEW_CRONTAB=$(cat <<EOF
${CLEANED}

# --- SUS Auto-Resolver ---
# Poll Jira every 10 minutes
${POLL_ENTRY}
# Daily backup at 3am
${BACKUP_ENTRY}
EOF
)

echo "$NEW_CRONTAB" | crontab -

echo ""
echo "Cron entries installed successfully!"
echo ""
echo "Verify with: crontab -l"
echo "Logs at: ${PLUGIN_DIR}/data/logs/"
echo ""
echo "To remove later: crontab -e and delete the SUS Auto-Resolver section"
