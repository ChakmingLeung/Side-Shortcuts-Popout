# Documentation maintenance

**Language:** [English](MAINTENANCE.md) · [简体中文](MAINTENANCE.zh-CN.md)

Use this checklist whenever you change extension code before pushing to GitHub.

## Automated

```powershell
# After editing manifest.json "version":
powershell -ExecutionPolicy Bypass -File .\scripts\sync-doc-version.ps1
```

This updates version badges and version lines in README, PRD, ARCHITECTURE, and `docs/README.md`.

## Manual (required every release)

1. **Bump** `manifest.json` → `"version"`
2. **Run** `scripts/sync-doc-version.ps1`
3. **Add** a section to [CHANGELOG.md](../CHANGELOG.md) (English + 中文要点)
4. **Update** feature/behavior sections in bilingual README if user-facing
5. **Update** [PRD.md](PRD.md) / [PRD.zh-CN.md](PRD.zh-CN.md) if scope or rules change
6. **Update** [ARCHITECTURE.md](ARCHITECTURE.md) / [ARCHITECTURE.zh-CN.md](ARCHITECTURE.zh-CN.md) if modules or flows change

## Cursor AI

Project rule `.cursor/rules/github-docs-sync.mdc` is **always on**. When you ask the agent to change code, it should update docs in the same task.

## Quick mapping

| Code change | Docs to touch |
|-------------|---------------|
| New permission in `manifest.json` | README (Requirements), ARCHITECTURE (Permissions), CHANGELOG |
| `shared.js` mobile allowlist | ARCHITECTURE, README (Mobile), PRD (§5.1), CHANGELOG |
| UI in `sidepanel` / `options` | README (Features), PRD, screenshots note |
| Bug fix only | CHANGELOG + version bump |

## Git commit suggestion

```
feat(sidepanel): short description

- CHANGELOG: vX.Y.Z
- docs: sync README/PRD/ARCHITECTURE (en + zh-CN)
```
