#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"
SOURCE_MARKETPLACE="$REPO_ROOT/.agents/plugins/marketplace.json"
HOME_ROOT="${HOME:?HOME is not set}"
CODEX_HOME="${CODEX_HOME:-$HOME_ROOT/.codex}"
SKILL_INSTALL_DIR="${SKILL_INSTALL_DIR:-$CODEX_HOME/skills}"
PLUGIN_INSTALL_DIR="${PLUGIN_INSTALL_DIR:-$HOME_ROOT/plugins}"
TARGET_MARKETPLACE="${MARKETPLACE_PATH:-$HOME_ROOT/.agents/plugins/marketplace.json}"
INSTALL_MODE="${INSTALL_MODE:-symlink}"

if [[ ! -f "$SOURCE_MARKETPLACE" ]]; then
  echo "Marketplace source not found: $SOURCE_MARKETPLACE" >&2
  exit 1
fi

if ! command -v codex >/dev/null 2>&1; then
  echo "codex CLI not found in PATH." >&2
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

mkdir -p "$CODEX_HOME" "$SKILL_INSTALL_DIR" "$PLUGIN_INSTALL_DIR" "$(dirname "$TARGET_MARKETPLACE")"

backup_path() {
  local path="$1"
  if [[ -e "$path" || -L "$path" ]]; then
    local backup="${path}.bak.$(date +%Y%m%d%H%M%S)"
    mv "$path" "$backup"
    echo "  BACKUP $path -> $backup"
  fi
}

install_path() {
  local src="$1"
  local dest="$2"
  local label="${3:-$(basename "$dest")}"
  local is_skill_conflict=0
  if [[ "$label" == skill:* ]]; then
    is_skill_conflict=1
  fi

  case "$INSTALL_MODE" in
    symlink)
      if [[ -L "$dest" && "$(readlink "$dest")" == "$src" ]]; then
        echo "  SKIP $label (symlink already OK)"
        return
      fi

      if [[ -e "$dest" || -L "$dest" ]]; then
        if [[ "$is_skill_conflict" -eq 1 ]]; then
          echo "  WARN $label already exists at $dest; skipping to avoid overwriting another installed skill"
          return
        fi
        backup_path "$dest"
      fi

      ln -s "$src" "$dest"
      echo "  LINK $label -> $src"
      ;;
    copy)
      if [[ -L "$dest" ]]; then
        if [[ "$is_skill_conflict" -eq 1 ]]; then
          echo "  WARN $label already exists at $dest; skipping to avoid overwriting another installed skill"
          return
        fi
        rm -f "$dest"
      elif [[ -e "$dest" ]]; then
        if [[ "$is_skill_conflict" -eq 1 ]]; then
          echo "  WARN $label already exists at $dest; skipping to avoid overwriting another installed skill"
          return
        fi
        rm -rf "$dest"
      fi

      mkdir -p "$dest"
      rsync -a --delete --exclude '.DS_Store' "$src/" "$dest/"
      echo "  COPY $label -> $dest"
      ;;
    *)
      echo "Invalid INSTALL_MODE: $INSTALL_MODE" >&2
      exit 1
      ;;
  esac
}

echo "=== geo-codex installer ==="
echo "Repo: $REPO_ROOT"
echo "Codex home: $CODEX_HOME"
echo "Skill dir: $SKILL_INSTALL_DIR"
echo "Plugin dir: $PLUGIN_INSTALL_DIR"
echo "Marketplace: $TARGET_MARKETPLACE"
echo "Install mode: $INSTALL_MODE"
echo ""

while IFS=$'\t' read -r plugin_name plugin_path; do
  install_path "$plugin_path" "$PLUGIN_INSTALL_DIR/$plugin_name" "plugin:$plugin_name"
done < <(
  "$PYTHON_BIN" - "$SOURCE_MARKETPLACE" "$REPO_ROOT" <<'PY'
import json
import pathlib
import sys

marketplace = json.loads(pathlib.Path(sys.argv[1]).read_text())
repo_root = pathlib.Path(sys.argv[2]).resolve()

for plugin in marketplace.get("plugins", []):
    name = plugin["name"]
    rel = plugin["source"]["path"]
    plugin_path = (repo_root / rel.replace("./", "", 1)).resolve()
    print(f"{name}\t{plugin_path}")
PY
)

echo ""

while IFS=$'\t' read -r skill_name skill_path; do
  install_path "$skill_path" "$SKILL_INSTALL_DIR/$skill_name" "skill:$skill_name"
done < <(
  "$PYTHON_BIN" - "$SOURCE_MARKETPLACE" "$REPO_ROOT" <<'PY'
import json
import pathlib
import sys

marketplace = json.loads(pathlib.Path(sys.argv[1]).read_text())
repo_root = pathlib.Path(sys.argv[2]).resolve()
seen = {}

def register(skill_dir: pathlib.Path) -> None:
    if not skill_dir.is_dir():
        return
    if not (skill_dir / "SKILL.md").is_file():
        return

    skill_name = skill_dir.name
    resolved = skill_dir.resolve()
    if skill_name in seen and seen[skill_name] != resolved:
        raise SystemExit(
            f"ERROR: duplicate skill '{skill_name}' in {seen[skill_name]} and {resolved}"
        )
    seen[skill_name] = resolved

for skill_dir in sorted((repo_root / "skills").glob("*")):
    register(skill_dir)

for plugin in marketplace.get("plugins", []):
    rel = plugin["source"]["path"]
    plugin_root = (repo_root / rel.replace("./", "", 1)).resolve()
    for skill_dir in sorted((plugin_root / "skills").glob("*")):
        register(skill_dir)

for skill_name, skill_path in seen.items():
    print(f"{skill_name}\t{skill_path}")
PY
)

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
        "name": source_payload.get("name", "local-home-marketplace"),
        "interface": source_payload.get("interface", {"displayName": "Local Codex Plugins"}),
        "plugins": [],
    }

if not isinstance(target_payload, dict):
    raise SystemExit(f"Invalid JSON root in {target_path}")

if not target_payload.get("name") or str(target_payload.get("name", "")).startswith("[TODO:"):
    target_payload["name"] = source_payload.get("name", "local-home-marketplace")

interface = target_payload.setdefault("interface", {})
if not isinstance(interface, dict):
    raise SystemExit(f"Invalid interface object in {target_path}")

source_interface = source_payload.get("interface", {})
if (not interface.get("displayName")) or str(interface.get("displayName", "")).startswith("[TODO:"):
    interface["displayName"] = source_interface.get("displayName", "Local Codex Plugins")

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

while IFS=$'\t' read -r kind name payload; do
  if CODEX_HOME="$CODEX_HOME" codex mcp get "$name" >/dev/null 2>&1; then
    echo "  SKIP MCP $name (already configured)"
    continue
  fi

  if [[ "$kind" == "url" ]]; then
    CODEX_HOME="$CODEX_HOME" codex mcp add "$name" --url "$payload" >/dev/null
    echo "  ADD MCP $name -> $payload"
    continue
  fi

  env_args=()
  while IFS= read -r env_kv; do
    [[ -n "$env_kv" ]] || continue
    env_args+=(--env "$env_kv")
  done < <(
    "$PYTHON_BIN" - "$payload" <<'PY'
import json
import sys

payload = json.loads(sys.argv[1])
for key, value in payload.get("env", {}).items():
    print(f"{key}={value}")
PY
  )

  cmd_parts=()
  while IFS= read -r cmd_part; do
    [[ -n "$cmd_part" ]] || continue
    cmd_parts+=("$cmd_part")
  done < <(
    "$PYTHON_BIN" - "$payload" <<'PY'
import json
import sys

payload = json.loads(sys.argv[1])
command = payload["command"]
if isinstance(command, str):
    print(command)
else:
    for part in command:
        print(part)

args = payload.get("args", [])
if isinstance(args, str):
    print(args)
else:
    for part in args:
        print(part)
PY
  )

  CODEX_HOME="$CODEX_HOME" codex mcp add "$name" "${env_args[@]}" -- "${cmd_parts[@]}" >/dev/null
  echo "  ADD MCP $name -> stdio"
done < <(
  "$PYTHON_BIN" - "$REPO_ROOT" "$SOURCE_MARKETPLACE" <<'PY'
import json
import pathlib
import sys

repo_root = pathlib.Path(sys.argv[1]).resolve()
marketplace = json.loads(pathlib.Path(sys.argv[2]).read_text())
mcp_files = []

root_mcp = repo_root / ".mcp.json"
if root_mcp.is_file():
    mcp_files.append(root_mcp)

for plugin in marketplace.get("plugins", []):
    rel = plugin["source"]["path"]
    plugin_root = (repo_root / rel.replace("./", "", 1)).resolve()
    plugin_mcp = plugin_root / ".mcp.json"
    if plugin_mcp.is_file():
        mcp_files.append(plugin_mcp)

for mcp_file in mcp_files:
    data = json.loads(mcp_file.read_text())
    for name, cfg in data.get("mcpServers", {}).items():
        url = cfg.get("url")
        if url:
            print(f"url\t{name}\t{url}")
        elif cfg.get("type") == "http" and cfg.get("url"):
            print(f"url\t{name}\t{cfg['url']}")
        else:
            print(f"stdio\t{name}\t{json.dumps(cfg)}")
PY
)

echo ""
echo "Installation complete."
echo "  Skills are available in new sessions via ~/.codex/skills."
echo "  Plugins and slash commands require a full Codex app restart to refresh the UI."
