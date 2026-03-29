#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"
SOURCE_MARKETPLACE="$REPO_ROOT/.agents/plugins/marketplace.json"
HOME_ROOT="${HOME:?HOME is not set}"
PLUGINS_ROOT="$HOME_ROOT/plugins"
TARGET_MARKETPLACE="$HOME_ROOT/.agents/plugins/marketplace.json"

if [[ ! -f "$SOURCE_MARKETPLACE" ]]; then
  echo "Marketplace source not found: $SOURCE_MARKETPLACE" >&2
  exit 1
fi

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "python3 or python is required to install geo-codex plugins." >&2
  exit 1
fi

mkdir -p "$PLUGINS_ROOT" "$(dirname "$TARGET_MARKETPLACE")"

PLUGIN_NAMES="$(
  "$PYTHON_BIN" - "$SOURCE_MARKETPLACE" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as handle:
    payload = json.load(handle)

for plugin in payload.get("plugins", []):
    name = plugin.get("name")
    if name:
        print(name)
PY
)"

printf '%s\n' "$PLUGIN_NAMES" | while IFS= read -r plugin_name; do
  [[ -n "$plugin_name" ]] || continue
  plugin_target="$REPO_ROOT/$plugin_name"
  plugin_link="$PLUGINS_ROOT/$plugin_name"

  if [[ ! -d "$plugin_target" ]]; then
    echo "Plugin directory not found: $plugin_target" >&2
    exit 1
  fi

  if [[ -L "$plugin_link" ]]; then
    rm -f "$plugin_link"
  elif [[ -e "$plugin_link" ]]; then
    existing_real="$(cd "$plugin_link" && pwd -P)"
    target_real="$(cd "$plugin_target" && pwd -P)"
    if [[ "$existing_real" != "$target_real" ]]; then
      echo "Path already exists and is not the expected link: $plugin_link" >&2
      exit 1
    fi
    continue
  fi

  ln -s "$plugin_target" "$plugin_link"
done

REPO_ROOT="$REPO_ROOT" \
SOURCE_MARKETPLACE="$SOURCE_MARKETPLACE" \
TARGET_MARKETPLACE="$TARGET_MARKETPLACE" \
"$PYTHON_BIN" <<'PY'
import json
import os
from pathlib import Path

repo_root = Path(os.environ["REPO_ROOT"]).resolve()
source_path = Path(os.environ["SOURCE_MARKETPLACE"]).resolve()
target_path = Path(os.environ["TARGET_MARKETPLACE"]).expanduser().resolve()

with source_path.open("r", encoding="utf-8") as handle:
    source_payload = json.load(handle)

if target_path.exists():
    with target_path.open("r", encoding="utf-8") as handle:
        target_payload = json.load(handle)
else:
    target_payload = {
        "name": "local-home-marketplace",
        "interface": {
            "displayName": "Local Codex Plugins",
        },
        "plugins": [],
    }

if not isinstance(target_payload, dict):
    raise SystemExit(f"Invalid JSON root in {target_path}")

target_payload.setdefault("name", "local-home-marketplace")
target_payload.setdefault("interface", {"displayName": "Local Codex Plugins"})
if not isinstance(target_payload["interface"], dict):
    raise SystemExit(f"Invalid interface object in {target_path}")
target_payload["interface"].setdefault("displayName", "Local Codex Plugins")

plugins = target_payload.setdefault("plugins", [])
if not isinstance(plugins, list):
    raise SystemExit(f"Invalid plugins array in {target_path}")

entries_by_name = {
    entry.get("name"): index
    for index, entry in enumerate(plugins)
    if isinstance(entry, dict) and entry.get("name")
}

for plugin in source_payload.get("plugins", []):
    name = plugin["name"]
    new_entry = {
        "name": name,
        "source": {
            "source": "local",
            "path": f"./plugins/{name}",
        },
        "policy": {
            "installation": plugin.get("policy", {}).get("installation", "AVAILABLE"),
            "authentication": plugin.get("policy", {}).get("authentication", "ON_INSTALL"),
        },
        "category": plugin.get("category", "Development"),
    }

    if name in entries_by_name:
        plugins[entries_by_name[name]] = new_entry
    else:
        plugins.append(new_entry)

target_path.parent.mkdir(parents=True, exist_ok=True)
with target_path.open("w", encoding="utf-8") as handle:
    json.dump(target_payload, handle, indent=2)
    handle.write("\n")

print(f"Installed {len(source_payload.get('plugins', []))} geo-codex plugins into {target_path}")
print(f"Plugin links point to {repo_root}")
PY

echo "Done. Restart Codex or open a new session to refresh plugins."
