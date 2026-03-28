#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
from pathlib import Path
from typing import Any

DEFAULT_RULES: dict[str, Any] = {
    "version": 1,
    "exclude_exact": [
        ".DS_Store",
    ],
    "exclude_prefixes": [
        ".git/",
        "node_modules/",
        "__pycache__/",
        ".sync/",
    ],
    "claude_only_prefixes": [
        ".claude/",
    ],
    "codex_only_prefixes": [
        ".agents/",
        ".sync/",
        "skills/geo-repo-sync/",
    ],
    "codex_only_exact": [
        "sync-rules.json",
        "scripts/repo_sync.py",
    ],
    "root_mappings": {
        "CLAUDE.md": "AGENTS.md",
        ".claude-plugin/marketplace.json": ".agents/plugins/marketplace.json",
    },
    "plugin_manifest_suffixes": {
        "claude": "/.claude-plugin/plugin.json",
        "codex": "/.codex-plugin/plugin.json",
    },
    "text_replacements": {
        "claude_to_codex": [
            ["geo-claude", "geo-codex"],
            [".claude-plugin/marketplace.json", ".agents/plugins/marketplace.json"],
            [".claude-plugin/plugin.json", ".codex-plugin/plugin.json"],
            [".claude-plugin", ".codex-plugin"],
            [
                "Este repositorio contem plugins que dao ao Claude contexto sobre o codebase",
                "Este repositorio contem plugins que dao ao Codex contexto sobre o codebase",
            ],
            [
                "└── .claude/skills/           # Skills internas do projeto (nao sao plugins)\n"
                "    ├── create-plugin/        #   Scaffold de plugin novo\n"
                "    ├── create-skill/         #   Nova skill em plugin existente\n"
                "    ├── update-skill/         #   Editar skill existente\n"
                "    └── geo-repo-sync/        #   Sync de geo-codex -> geo-codex",
                "├── skills/                   # Skills locais do repositorio\n"
                "│   ├── geo-repo-sync/        #   Sync de geo-claude -> geo-codex\n"
                "│   └── repo-to-docs-geovendas/\n"
                "└── scripts/repo_sync.py      # Motor de sync compartilhado",
            ],
            [".claude/skills/geo-repo-sync/", "skills/geo-repo-sync/"],
            [
                "Use `skills/geo-repo-sync/scripts/run_sync.sh --dry-run` para revisar sync de `geo-codex` para `geo-codex`",
                "Use `skills/geo-repo-sync/scripts/run_sync.sh --dry-run` para revisar sync de `geo-claude` para `geo-codex`",
            ],
            ["CLAUDE.md", "AGENTS.md"],
            ["Claude Code", "Codex"],
        ],
        "codex_to_claude": [
            ["geo-codex", "geo-claude"],
            [".agents/plugins/marketplace.json", ".claude-plugin/marketplace.json"],
            [".codex-plugin/plugin.json", ".claude-plugin/plugin.json"],
            [".codex-plugin", ".claude-plugin"],
            [
                "Este repositorio contem plugins que dao ao Codex contexto sobre o codebase",
                "Este repositorio contem plugins que dao ao Claude contexto sobre o codebase",
            ],
            [
                "├── skills/                   # Skills locais do repositorio\n"
                "│   ├── geo-repo-sync/        #   Sync de geo-claude -> geo-claude\n"
                "│   └── repo-to-docs-geovendas/\n"
                "└── scripts/repo_sync.py      # Motor de sync compartilhado",
                "└── .claude/skills/           # Skills internas do projeto (nao sao plugins)\n"
                "    ├── create-plugin/        #   Scaffold de plugin novo\n"
                "    ├── create-skill/         #   Nova skill em plugin existente\n"
                "    ├── update-skill/         #   Editar skill existente\n"
                "    └── geo-repo-sync/        #   Sync de geo-codex -> geo-claude",
            ],
            ["skills/geo-repo-sync/", ".claude/skills/geo-repo-sync/"],
            [
                "Use `.claude/skills/geo-repo-sync/scripts/run_sync.sh --dry-run` para revisar sync de `geo-claude` para `geo-claude`",
                "Use `.claude/skills/geo-repo-sync/scripts/run_sync.sh --dry-run` para revisar sync de `geo-codex` para `geo-claude`",
            ],
            ["AGENTS.md", "CLAUDE.md"],
            ["Codex", "Claude Code"],
        ],
    },
}

CAPABILITIES = ["Interactive", "Read", "Write"]


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def pretty_json(data: Any) -> bytes:
    return (json.dumps(data, indent=2, ensure_ascii=True) + "\n").encode("utf-8")


def default_claude_root() -> Path:
    return Path(os.environ.get("GEO_CLAUDE_PATH", "/Users/gab/repo/geo-claude")).resolve()


def default_codex_root(script_path: Path) -> Path:
    if script_path.name == "repo_sync.py" and script_path.parent.name == "scripts":
        return script_path.parent.parent.resolve()
    return Path(os.environ.get("GEO_CODEX_PATH", "/Users/gab/repo/geo-codex")).resolve()


def load_rules(codex_root: Path) -> dict[str, Any]:
    rules_path = codex_root / "sync-rules.json"
    if not rules_path.exists():
        return DEFAULT_RULES
    with rules_path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    merged = json.loads(json.dumps(DEFAULT_RULES))
    merged.update({k: v for k, v in data.items() if k not in merged or not isinstance(v, dict)})
    for key, value in data.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key].update(value)
    return merged


def save_rules(codex_root: Path) -> None:
    rules_path = codex_root / "sync-rules.json"
    rules_path.parent.mkdir(parents=True, exist_ok=True)
    rules_path.write_bytes(pretty_json(DEFAULT_RULES))


def load_state(codex_root: Path) -> dict[str, Any]:
    state_path = codex_root / ".sync" / "state.json"
    if not state_path.exists():
        return {"version": 1, "pairs": {}}
    with state_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_state(codex_root: Path, state: dict[str, Any]) -> None:
    state_path = codex_root / ".sync" / "state.json"
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_bytes(pretty_json(state))


def is_text_file(data: bytes) -> bool:
    if not data:
        return True
    if b"\x00" in data:
        return False
    try:
        data.decode("utf-8")
        return True
    except UnicodeDecodeError:
        return False


def title_case(name: str) -> str:
    return " ".join(part.capitalize() for part in name.replace("_", "-").split("-") if part)


def short_description(text: str, limit: int = 120) -> str:
    single = " ".join(text.split())
    if len(single) <= limit:
        return single
    return single[: limit - 3].rstrip() + "..."


def category_name(value: str | None) -> str:
    if not value:
        return "Development"
    return value.replace("-", " ").title()


def should_skip(rel: str, source_kind: str, rules: dict[str, Any]) -> bool:
    if rel in rules["exclude_exact"]:
        return True
    if any(rel.startswith(prefix) for prefix in rules["exclude_prefixes"]):
        return True
    if source_kind == "claude":
        if any(rel.startswith(prefix) for prefix in rules["claude_only_prefixes"]):
            return True
        if rel.startswith(".claude-plugin/") and rel != ".claude-plugin/marketplace.json":
            return True
        if "/.claude-plugin/" in rel and not rel.endswith(rules["plugin_manifest_suffixes"]["claude"]):
            return True
    else:
        if rel in rules["codex_only_exact"]:
            return True
        if any(rel.startswith(prefix) for prefix in rules["codex_only_prefixes"]):
            return rel != ".agents/plugins/marketplace.json"
        if rel.startswith(".codex-plugin/"):
            return True
        if "/.codex-plugin/" in rel and not rel.endswith(rules["plugin_manifest_suffixes"]["codex"]):
            return True
    return False


def map_relpath(rel: str, source_kind: str, rules: dict[str, Any]) -> str | None:
    if should_skip(rel, source_kind, rules):
        return None
    root_mappings = rules["root_mappings"]
    if source_kind == "claude":
        if rel in root_mappings:
            return root_mappings[rel]
        suffix = rules["plugin_manifest_suffixes"]["claude"]
        if rel.endswith(suffix):
            return rel[: -len(suffix)] + rules["plugin_manifest_suffixes"]["codex"]
        return rel
    for claude_rel, codex_rel in root_mappings.items():
        if rel == codex_rel:
            return claude_rel
    suffix = rules["plugin_manifest_suffixes"]["codex"]
    if rel.endswith(suffix):
        return rel[: -len(suffix)] + rules["plugin_manifest_suffixes"]["claude"]
    return rel


def canonical_key(rel: str, source_kind: str, rules: dict[str, Any]) -> str:
    if source_kind == "claude":
        return rel
    mapped = map_relpath(rel, "codex", rules)
    return mapped or rel


def transform_text(content: str, source_kind: str, target_kind: str, rules: dict[str, Any]) -> str:
    if source_kind == target_kind:
        return content
    direction_key = "claude_to_codex" if source_kind == "claude" else "codex_to_claude"
    output = content
    for old, new in rules["text_replacements"][direction_key]:
        output = output.replace(old, new)
    return output


def convert_marketplace(data: bytes, source_kind: str, rules: dict[str, Any]) -> bytes:
    source = json.loads(data.decode("utf-8"))
    if source_kind == "claude":
        display_name = title_case(source.get("name", "geo-codex").replace("claude", "codex"))
        plugins = []
        for plugin in source.get("plugins", []):
            plugins.append(
                {
                    "name": plugin["name"],
                    "source": {
                        "source": "local",
                        "path": plugin.get("source", f"./{plugin['name']}"),
                    },
                    "policy": {
                        "installation": "AVAILABLE",
                        "authentication": "ON_INSTALL",
                    },
                    "category": category_name(plugin.get("category")),
                }
            )
        result = {
            "name": source.get("name", "ibtech-claude-marketplace").replace("claude", "codex"),
            "interface": {
                "displayName": display_name,
            },
            "plugins": plugins,
        }
        return pretty_json(result)

    plugins = []
    for plugin in source.get("plugins", []):
        plugin_source = plugin.get("source", {})
        path_value = plugin_source.get("path", f"./{plugin['name']}")
        plugins.append(
            {
                "name": plugin["name"],
                "description": plugin["name"],
                "category": (plugin.get("category") or "development").lower().replace(" ", "-"),
                "source": path_value,
            }
        )
    result = {
        "name": source.get("name", "ibtech-codex-marketplace").replace("codex", "claude"),
        "description": "Claude Code plugins for the Geovendas ecosystem by IBTech",
        "owner": {
            "name": "IBTech - Geovendas",
            "email": "dev@ibtech.inf.br",
        },
        "plugins": plugins,
    }
    return pretty_json(result)


def convert_plugin_manifest(data: bytes, rel: str, source_kind: str, rules: dict[str, Any]) -> bytes:
    source = json.loads(data.decode("utf-8"))
    plugin_name = source["name"]
    description = source.get("description", plugin_name)

    if source_kind == "claude":
        author = source.get("author", {})
        transformed_description = transform_text(description, "claude", "codex", rules)
        repo = transform_text(source.get("repository", ""), "claude", "codex", rules)
        result = {
            "name": plugin_name,
            "version": source.get("version", "1.0.0"),
            "description": transformed_description,
            "author": {
                "name": author.get("name", "IBTech - Geovendas"),
                "email": author.get("email", "dev@ibtech.inf.br"),
            },
            "homepage": repo or "https://github.com/tecnologia-ibtech/geo-codex",
            "repository": repo or "https://github.com/tecnologia-ibtech/geo-codex",
            "license": source.get("license", "MIT"),
            "keywords": source.get("keywords", []),
            "skills": "./skills/",
            "interface": {
                "displayName": title_case(plugin_name),
                "shortDescription": short_description(transformed_description),
                "longDescription": transformed_description,
                "developerName": author.get("name", "IBTech - Geovendas"),
                "category": "Coding",
                "capabilities": CAPABILITIES,
                "defaultPrompt": f"Use {title_case(plugin_name)} to work on {plugin_name}.",
            },
        }
        return pretty_json(result)

    transformed_description = transform_text(description, "codex", "claude", rules)
    author = source.get("author", {})
    result = {
        "name": plugin_name,
        "description": transformed_description,
        "version": source.get("version", "1.0.0"),
        "author": {
            "name": author.get("name", source.get("interface", {}).get("developerName", "IBTech - Geovendas")),
            "email": author.get("email", "dev@ibtech.inf.br"),
        },
        "repository": transform_text(source.get("repository", ""), "codex", "claude", rules)
        or "https://github.com/tecnologia-ibtech/geo-claude",
        "license": source.get("license", "MIT"),
        "keywords": source.get("keywords", []),
    }
    return pretty_json(result)


def transform_bytes(data: bytes, rel: str, source_kind: str, rules: dict[str, Any]) -> bytes:
    if source_kind == "claude" and rel == ".claude-plugin/marketplace.json":
        return convert_marketplace(data, "claude", rules)
    if source_kind == "codex" and rel == ".agents/plugins/marketplace.json":
        return convert_marketplace(data, "codex", rules)
    if source_kind == "claude" and rel.endswith(rules["plugin_manifest_suffixes"]["claude"]):
        return convert_plugin_manifest(data, rel, "claude", rules)
    if source_kind == "codex" and rel.endswith(rules["plugin_manifest_suffixes"]["codex"]):
        return convert_plugin_manifest(data, rel, "codex", rules)
    if is_text_file(data):
        return transform_text(data.decode("utf-8"), source_kind, "codex" if source_kind == "claude" else "claude", rules).encode("utf-8")
    return data


def read_bytes(path: Path) -> bytes:
    return path.read_bytes() if path.exists() else b""


def same_effective_content(source_bytes: bytes, target_bytes: bytes, rel: str, source_kind: str, rules: dict[str, Any]) -> bool:
    return transform_bytes(source_bytes, rel, source_kind, rules) == target_bytes


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def sync(
    source_root: Path,
    target_root: Path,
    source_kind: str,
    rules: dict[str, Any],
    apply: bool,
    state: dict[str, Any],
    filter_path: str | None,
) -> tuple[list[str], list[str], int]:
    changed: list[str] = []
    conflicts: list[str] = []
    scanned = 0
    pairs = state.setdefault("pairs", {})
    pending_writes: list[tuple[Path, Path, str, str, bytes, bytes]] = []
    pending_state_updates: list[tuple[str, dict[str, Any]]] = []

    for path in sorted(source_root.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(source_root).as_posix()
        target_rel = map_relpath(rel, source_kind, rules)
        if target_rel is None:
            continue
        if filter_path and not (rel == filter_path or rel.startswith(filter_path.rstrip("/") + "/") or target_rel == filter_path or target_rel.startswith(filter_path.rstrip("/") + "/")):
            continue

        scanned += 1
        key = canonical_key(rel, source_kind, rules)
        target_path = target_root / target_rel
        source_bytes = read_bytes(path)
        target_exists = target_path.exists()
        target_bytes = read_bytes(target_path) if target_exists else b""
        target_kind = "codex" if source_kind == "claude" else "claude"

        entry = pairs.get(
            key,
            {
                "claude_path": key if source_kind == "claude" else target_rel,
                "codex_path": target_rel if source_kind == "claude" else rel,
                "claude_hash": None,
                "codex_hash": None,
            },
        )
        entry["claude_path"] = key if source_kind == "claude" else target_rel
        entry["codex_path"] = target_rel if source_kind == "claude" else rel

        source_hash = sha256_bytes(source_bytes)
        target_hash = sha256_bytes(target_bytes) if target_exists else None
        last_source_hash = entry["claude_hash"] if source_kind == "claude" else entry["codex_hash"]
        last_target_hash = entry["codex_hash"] if source_kind == "claude" else entry["claude_hash"]

        source_changed = source_hash != last_source_hash
        target_changed = target_hash != last_target_hash
        effective_same = target_exists and same_effective_content(source_bytes, target_bytes, rel, source_kind, rules)

        if source_changed and target_changed and not effective_same:
            conflicts.append(f"{rel} -> {target_rel}")
            continue

        needs_sync = not target_exists or (
            not effective_same
            and (source_changed or target_changed or last_source_hash is None or last_target_hash is None)
        )

        if needs_sync:
            changed.append(f"{rel} -> {target_rel}")
            transformed = transform_bytes(source_bytes, rel, source_kind, rules)
            pending_writes.append((path, target_path, rel, target_rel, source_bytes, transformed))

        if apply:
            if needs_sync:
                transformed_hash = sha256_bytes(transform_bytes(source_bytes, rel, source_kind, rules))
                if source_kind == "claude":
                    entry["claude_hash"] = source_hash
                    entry["codex_hash"] = transformed_hash
                else:
                    entry["claude_hash"] = transformed_hash
                    entry["codex_hash"] = source_hash
            elif target_exists:
                if source_kind == "claude":
                    entry["claude_hash"] = source_hash
                    entry["codex_hash"] = target_hash
                else:
                    entry["claude_hash"] = target_hash
                    entry["codex_hash"] = source_hash
            pending_state_updates.append((key, dict(entry)))

    if apply and conflicts:
        return changed, conflicts, scanned

    if apply:
        for source_path, target_path, rel, _target_rel, _source_bytes, transformed in pending_writes:
            ensure_parent(target_path)
            target_path.write_bytes(transformed)
            shutil.copymode(source_path, target_path)

        for key, entry in pending_state_updates:
            pairs[key] = entry

    return changed, conflicts, scanned


def install_self(script_path: Path, codex_root: Path) -> None:
    destination = codex_root / "scripts" / "repo_sync.py"
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(script_path, destination)
    destination.chmod(0o755)


def bootstrap(script_path: Path, claude_root: Path, codex_root: Path) -> int:
    codex_root.mkdir(parents=True, exist_ok=True)
    save_rules(codex_root)
    state = {"version": 1, "pairs": {}}
    rules = load_rules(codex_root)
    changed, conflicts, scanned = sync(
        source_root=claude_root,
        target_root=codex_root,
        source_kind="claude",
        rules=rules,
        apply=True,
        state=state,
        filter_path=None,
    )
    install_self(script_path, codex_root)
    save_state(codex_root, state)
    print(f"Bootstrapped {codex_root}")
    print(f"Scanned: {scanned}")
    print(f"Created/updated: {len(changed)}")
    print(f"Conflicts: {len(conflicts)}")
    if conflicts:
        for item in conflicts[:50]:
            print(f"CONFLICT {item}")
    return 0 if not conflicts else 2


def parse_args(script_path: Path) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync geo-claude and geo-codex by rules.")
    parser.add_argument("--bootstrap", action="store_true", help="Create or refresh geo-codex from geo-claude.")
    parser.add_argument(
        "--direction",
        choices=["claude-to-codex", "codex-to-claude"],
        help="Sync direction for normal operation.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Show pending changes without writing files.")
    parser.add_argument("--apply", action="store_true", help="Write pending changes.")
    parser.add_argument("--path", help="Limit sync to one relative path or subtree.")
    parser.add_argument("--claude-root", default=str(default_claude_root()))
    parser.add_argument("--codex-root", default=str(default_codex_root(script_path)))
    return parser.parse_args()


def main() -> int:
    script_path = Path(__file__).resolve()
    args = parse_args(script_path)
    claude_root = Path(args.claude_root).resolve()
    codex_root = Path(args.codex_root).resolve()

    if args.bootstrap:
        return bootstrap(script_path, claude_root, codex_root)

    if not args.direction:
        print("error: --direction is required unless --bootstrap is used", file=sys.stderr)
        return 1
    if args.apply and args.dry_run:
        print("error: use either --dry-run or --apply", file=sys.stderr)
        return 1
    apply = args.apply or not args.dry_run

    rules = load_rules(codex_root)
    state = load_state(codex_root)

    if args.direction == "claude-to-codex":
        source_root = claude_root
        target_root = codex_root
        source_kind = "claude"
    else:
        source_root = codex_root
        target_root = claude_root
        source_kind = "codex"

    changed, conflicts, scanned = sync(
        source_root=source_root,
        target_root=target_root,
        source_kind=source_kind,
        rules=rules,
        apply=apply,
        state=state,
        filter_path=args.path,
    )

    if apply and not conflicts:
        save_state(codex_root, state)

    mode = "apply" if apply else "dry-run"
    print(f"Mode: {mode}")
    print(f"Direction: {args.direction}")
    print(f"Source: {source_root}")
    print(f"Target: {target_root}")
    print(f"Scanned: {scanned}")
    print(f"Changed: {len(changed)}")
    print(f"Conflicts: {len(conflicts)}")
    if changed:
        for item in changed[:100]:
            print(f"CHANGE {item}")
    if conflicts:
        for item in conflicts[:100]:
            print(f"CONFLICT {item}")
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
