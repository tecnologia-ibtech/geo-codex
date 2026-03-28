#!/bin/bash
# SUS Auto-Resolver Daily Backup
# Compresses plugin data + lessons with pigz -9 and sends to gabserver

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${PLUGIN_DIR}/data/logs"
BACKUP_DIR="/tmp/sus-resolver-backup"
REMOTE_DEST="${BACKUP_REMOTE_DEST:-}"
LESSONS_FILE="${PLUGIN_DIR}/commands/sus-lessons.md"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_NAME="sus-resolver-${TIMESTAMP}.tar.gz"

mkdir -p "$LOG_DIR"

log() {
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] BACKUP: $*" >> "${LOG_DIR}/backup.log"
}

log "Starting backup"

# --- Prepare backup staging area ---
rm -rf "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/data"
mkdir -p "$BACKUP_DIR/memory"
mkdir -p "$BACKUP_DIR/config"

# Copy plugin data
if [ -d "${PLUGIN_DIR}/data" ]; then
    cp -r "${PLUGIN_DIR}/data/"* "$BACKUP_DIR/data/" 2>/dev/null || true
fi

# Copy lessons file
if [ -f "$LESSONS_FILE" ]; then
    cp "$LESSONS_FILE" "$BACKUP_DIR/memory/"
fi

# Copy plugin config
cp "${PLUGIN_DIR}/.codex-plugin/plugin.json" "$BACKUP_DIR/config/"

# Copy skill references (they may contain customizations)
if [ -d "${PLUGIN_DIR}/skills" ]; then
    cp -r "${PLUGIN_DIR}/skills/"*/references "$BACKUP_DIR/config/" 2>/dev/null || true
fi

# --- Compress with pigz -9 ---
if ! command -v pigz &>/dev/null; then
    log "ERROR: pigz not found. Install with: brew install pigz"
    exit 1
fi

cd /tmp
tar cf - -C "$BACKUP_DIR" . | pigz -9 > "$ARCHIVE_NAME"

ARCHIVE_SIZE=$(stat -f%z "$ARCHIVE_NAME" 2>/dev/null || stat -c%s "$ARCHIVE_NAME" 2>/dev/null || echo "unknown")
log "Archive created: ${ARCHIVE_NAME} (${ARCHIVE_SIZE} bytes)"

# --- Send to remote (optional) ---
if [ -z "$REMOTE_DEST" ]; then
    log "SKIP: BACKUP_REMOTE_DEST not set. Backup saved locally at /tmp/${ARCHIVE_NAME}"
    exit 0
fi

REMOTE_HOST=$(echo "$REMOTE_DEST" | cut -d: -f1)
REMOTE_PATH=$(echo "$REMOTE_DEST" | cut -d: -f2)
ssh "$REMOTE_HOST" "mkdir -p $REMOTE_PATH" 2>/dev/null || true

if scp -q "/tmp/${ARCHIVE_NAME}" "${REMOTE_DEST}/${ARCHIVE_NAME}"; then
    log "Backup sent to ${REMOTE_DEST}/${ARCHIVE_NAME}"
else
    log "ERROR: Failed to send backup to gabserver"
    rm -f "/tmp/${ARCHIVE_NAME}"
    rm -rf "$BACKUP_DIR"
    exit 1
fi

# --- Cleanup remote: keep last 30 backups ---
ssh "$REMOTE_HOST" "cd $REMOTE_PATH && ls -t sus-resolver-*.tar.gz | tail -n +31 | xargs rm -f 2>/dev/null" || true

# --- Cleanup local ---
rm -f "/tmp/${ARCHIVE_NAME}"
rm -rf "$BACKUP_DIR"

log "Backup complete"
