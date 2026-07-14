# pi-coding-agent Configuration Directory

This directory serves as the **user configuration folder** for `pi-coding-agent` — the equivalent of `~/.pi/agent/` in a standard installation.

When `pi` is launched from anywhere on this system, it loads resources from this directory (settings, extensions, themes, installed packages, and session history).

## Layout

| Path | Purpose |
|------|---------|
| `settings.json` | Global settings (theme, model, provider, packages, compaction, telemetry) |
| `extensions/` | Custom TypeScript extensions loaded at startup |
| `git/` | Git-based pi packages installed via `pi install git:...` |
| `sessions/` | Saved conversation sessions (JSONL) |
| `themes/` | Custom TUI themes (e.g. `catpuccin-mocha.json`) |
| `auth.json` | Provider API keys / subscription credentials |
| `notify.sh` | Optional notification hook script |
| `system-prompt-opencode.md` | Custom system prompt override for OpenCode provider |
| `plan-system-prompt-opencode.md` | Plan-mode system prompt for OpenCode provider |

## Quick Reference

- Edit settings: modify `settings.json` or use `/settings` inside pi.
- Add extensions: drop `.ts` files into `extensions/` and run `/reload`.
- Add themes: drop `.json` files into `themes/` and reference them in `settings.json`.
- Sessions auto-save to `sessions/`.

## Notes

- This is the **global** agent directory, not project-local (project-level config lives in `.pi/` inside individual repos).
- The `auth.json` file in this directory should never be committed to version control.
- If you move this directory, update `PI_CODING_AGENT_DIR` or symlink it back to `~/.pi/agent`.
