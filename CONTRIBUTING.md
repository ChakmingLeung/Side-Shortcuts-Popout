# Contributing

**Language:** [English](CONTRIBUTING.md) · [简体中文](CONTRIBUTING.zh-CN.md)

Thank you for your interest in **Side Shortcuts Popout**!

## Before you start

- [docs/PRD.md](docs/PRD.md) — product scope
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — code structure
- [docs/MAINTENANCE.md](docs/MAINTENANCE.md) — **doc sync checklist on every code change**

## Local development

1. Fork and clone the repo
2. **Load unpacked** in Edge / Chrome (project root)
3. Click **Reload** after changes
4. Re-open the side panel to verify

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate-icons.ps1
```

## Commit guidelines

- Branches: `feature/xxx`, `fix/xxx`
- Commit examples:
  - `feat: add drag-and-drop shortcut ordering`
  - `fix: refresh iframe after mobile mode toggle`
- PRs: describe motivation and testing; attach screenshots for UI changes

## Issues

Please include: browser & version, OS, steps to reproduce, expected vs actual behavior, and relevant URL (for embed failures).

## Documentation

- Update **both** English (`*.md`) and Chinese (`*.zh-CN.md`) docs for user-facing changes
- Add an entry to [CHANGELOG.md](CHANGELOG.md) when releasing a new version (match `manifest.json`)
- Keep language links in sync: `README.md` ↔ `README.zh-CN.md`
- Update [docs/PRD.md](docs/PRD.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) when behavior changes (e.g. mobile allowlist, URL resolution)

## Code principles

- Manifest V3, minimal permissions
- Avoid unnecessary build tooling
- Reuse `shared.js`
- Extension UI strings are Chinese by default (`_locales` i18n may come later)

## License

By contributing, you agree to license your work under the [MIT License](LICENSE).
