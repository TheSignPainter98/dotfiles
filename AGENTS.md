# AGENTS.md

## Repo Overview

This repo manages personal dotfiles. The main entrypoint is `./install`, a Python installer that provisions packages and links or copies files from `home/` into the user home directory.

Important paths:
- `install`: installer logic and task declarations
- `home/`: source-managed dotfiles and config trees
- `work_dir/`: local working area used by the installer, not source
- `*.db`: local installer state, not source

## Source Of Truth

Prefer editing files under `home/`.

For these config trees, YueScript is the source of truth:
- `home/.config/nvim/`
- `home/.config/wezterm/`

In those directories:
- edit `.yue` files first
- regenerate `.lua` output after changes
- do not hand-edit generated `.lua` unless the task specifically requires it

## Editing Guidelines

Keep changes small and localized.

When changing dotfiles:
- preserve the existing structure and style of the surrounding config
- avoid broad refactors unless they are required for the task
- prefer updating the canonical source file over derived output

When changing `install`:
- keep task ordering and installer state behavior intact unless the task requires changing them
- be careful with package provisioning changes because `./install` is stateful and machine-specific

Do not modify generated or local state as part of normal repo changes:
- `dotfiles.db`
- `dotfiles-temp.db`
- `work_dir/`

## Verification

Use the smallest relevant verification for the files you changed.

Installer changes:
- `python3 -m py_compile install`

Neovim config changes:
- `yue home/.config/nvim/`

WezTerm config changes:
- `yue home/.config/wezterm/`

Fish config changes:
- `fish -n home/.config/fish/config.fish`

Zsh config changes:
- `zsh -n home/.zshrc`

## Notes

`./install` prompts for machine-specific settings and writes installer state to a local database. Do not use it casually as a verification step unless the task explicitly requires testing the installer flow itself.
