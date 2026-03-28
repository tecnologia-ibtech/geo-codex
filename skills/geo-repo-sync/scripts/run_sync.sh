#!/bin/bash
set -euo pipefail

DEFAULT_DIRECTION="claude-to-codex"
DEFAULT_CLAUDE="/Users/gab/repo/geo-claude"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CODEX_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SYNC_SCRIPT="$CODEX_ROOT/scripts/repo_sync.py"

CLAUDE_ROOT="${GEO_CLAUDE_PATH:-$DEFAULT_CLAUDE}"
CODEX_ROOT_OVERRIDE="${GEO_CODEX_PATH:-$CODEX_ROOT}"

has_direction=0
args=()
while [[ $# -gt 0 ]]; do
  if [[ "$1" == "--direction" ]]; then
    has_direction=1
    if [[ $# -lt 2 ]]; then
      echo "missing value for --direction" >&2
      exit 1
    fi
    if [[ "$2" != "$DEFAULT_DIRECTION" ]]; then
      echo "this wrapper only supports --direction $DEFAULT_DIRECTION" >&2
      exit 1
    fi
    args+=("$1" "$2")
    shift 2
    continue
  fi
  args+=("$1")
  shift
done

if [[ ! -f "$SYNC_SCRIPT" ]]; then
  echo "sync script not found: $SYNC_SCRIPT" >&2
  exit 1
fi

if [[ $has_direction -eq 0 ]]; then
  args=(--direction "$DEFAULT_DIRECTION" "${args[@]}")
fi

python3 "$SYNC_SCRIPT" \
  --claude-root "$CLAUDE_ROOT" \
  --codex-root "$CODEX_ROOT_OVERRIDE" \
  "${args[@]}"
