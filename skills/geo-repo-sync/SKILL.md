---
name: geo-repo-sync
description: Sync changes from `geo-claude` into `geo-codex` using the repo-local sync engine. Use when the user wants to refresh `geo-codex`, preview incoming changes, or apply a Claude-to-Codex sync safely.
metadata:
  short-description: Sync geo-claude into geo-codex
---

# Geo Repo Sync

This repo-local skill is the `geo-codex` entrypoint for syncs coming from `geo-claude`.

## Default Direction

- `claude-to-codex`

## Commands

```bash
# Dry-run
bash /Users/gab/repo/geo-codex/skills/geo-repo-sync/scripts/run_sync.sh --dry-run

# Apply
bash /Users/gab/repo/geo-codex/skills/geo-repo-sync/scripts/run_sync.sh --apply

# Limit to one path
bash /Users/gab/repo/geo-codex/skills/geo-repo-sync/scripts/run_sync.sh --dry-run --path geo-git/README.md
```

## Rules

- This wrapper only allows `claude-to-codex`.
- Run `--dry-run` before `--apply`.
- Stop on conflicts. Do not overwrite them automatically.
- The source of truth for mapping and exclusions is `sync-rules.json` at the repo root.
