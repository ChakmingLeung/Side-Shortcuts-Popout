# Agent instructions (Side Shortcuts Popout / 侧栏快捷小窗)

When modifying this browser extension, **always sync GitHub documentation** in the same change set.

## Required workflow

1. Update code and bump `manifest.json` `"version"` when releasing.
2. Run `powershell -ExecutionPolicy Bypass -File .\scripts\sync-doc-version.ps1`
3. Add `CHANGELOG.md` entry for the new version (bilingual bullets).
4. Keep **English and Chinese** docs aligned:
   - `README.md` / `README.zh-CN.md`
   - `docs/PRD.md` / `docs/PRD.zh-CN.md`
   - `docs/ARCHITECTURE.md` / `docs/ARCHITECTURE.zh-CN.md`

## Rules

See `.cursor/rules/github-docs-sync.mdc` for full checklist.

## Maintenance guide

- [docs/MAINTENANCE.md](docs/MAINTENANCE.md) (English)
- [docs/MAINTENANCE.zh-CN.md](docs/MAINTENANCE.zh-CN.md) (简体中文)
