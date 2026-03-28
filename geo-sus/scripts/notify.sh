#!/bin/bash
# SUS Auto-Resolver Notification Script
# Sends macOS notification + appends to log file
#
# Usage: notify.sh <task-key> <message>
# Example: notify.sh "SUS-6279" "Could not identify repo. Title: Filtro de Itens..."

TASK_KEY="${1:?Usage: notify.sh <task-key> <message>}"
MESSAGE="${2:?Usage: notify.sh <task-key> <message>}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${PLUGIN_DIR}/data/logs"
LOG_FILE="${LOG_DIR}/notifications.log"
PENDING_FILE="${LOG_DIR}/pending.json"

mkdir -p "$LOG_DIR"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# --- macOS notification ---
osascript -e "display notification \"${MESSAGE}\" with title \"SUS Resolver: ${TASK_KEY}\" sound name \"Glass\"" 2>/dev/null

# --- Append to log file ---
echo "[${TIMESTAMP}] ${TASK_KEY}: ${MESSAGE}" >> "$LOG_FILE"

# --- Append to pending.json ---
if [ ! -f "$PENDING_FILE" ] || [ ! -s "$PENDING_FILE" ]; then
    echo "[]" > "$PENDING_FILE"
fi

# Use python3 to safely append JSON (available on macOS by default)
# All variables passed as arguments to avoid shell injection
python3 -c "
import json, sys

pending_file = sys.argv[1]
task_key = sys.argv[2]
timestamp = sys.argv[3]
message = sys.argv[4]

try:
    with open(pending_file, 'r') as f:
        data = json.load(f)
except (json.JSONDecodeError, FileNotFoundError):
    data = []

data.append({
    'key': task_key,
    'timestamp': timestamp,
    'message': message
})

with open(pending_file, 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
" "$PENDING_FILE" "$TASK_KEY" "$TIMESTAMP" "$MESSAGE"

echo "Notified: ${TASK_KEY}"
