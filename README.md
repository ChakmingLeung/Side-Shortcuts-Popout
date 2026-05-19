# Side Shortcuts Popout

**Language / 语言:** [English](README.md) · [简体中文](README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](manifest.json)
[![Chrome 114+](https://img.shields.io/badge/Chrome-114%2B-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
[![Edge 114+](https://img.shields.io/badge/Edge-114%2B-0078D4?logo=microsoftedge&logoColor=white)](https://learn.microsoft.com/microsoft-edge/extensions-chromium/)
[![Version](https://img.shields.io/badge/version-2.1.2-blue.svg)](CHANGELOG.md)

**Repository:** [github.com/ChakmingLeung/Side-Shortcuts-Popout](https://github.com/ChakmingLeung/Side-Shortcuts-Popout)

A browser extension that brings back a **customizable web shortcut sidebar** using the native Chromium **Side Panel API**—ideal when [Microsoft Edge retires the built-in App Tower](https://support.microsoft.com/en-US/edge/streamline-access-to-your-favorite-sites-and-apps-with-sidebar-in-microsoft-edge). The side panel lists shortcuts vertically; **click to open in a popout window** alongside the main window, with normal cookies and login.

> Docs: [PRD (English)](docs/PRD.md) · [Architecture (English)](docs/ARCHITECTURE.md)  
> GitHub copy templates: [.github/DESCRIPTION.md](.github/DESCRIPTION.md)

---

## Why we dropped in-panel (iframe) preview

Early releases (v1.x) embedded target sites in an **iframe** inside the side panel so you could browse two sites at once. In practice this was **unfriendly and unreliable**, so **v2.0.0** removed it in favor of a **vertical shortcut list + popout window on click**.

| Issue | Explanation |
|-------|-------------|
| **Extension API** | The [Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel) only loads extension pages (e.g. `sidepanel.html`), not arbitrary `https://` URLs—external sites must be embedded in an iframe. |
| **Cookies / login** | Side-panel iframes use a **different cookie partition** than normal tabs, so “logged in on a tab but not in the sidebar” and broken QR login were common; workarounds (DNR Cookie injection, etc.) were fragile and required extra permissions. |
| **Anti-framing** | Many sites block iframes via `X-Frame-Options`, CSP `frame-ancestors`, or JavaScript that detects embedding and disables login. |
| **vs. legacy Edge sidebar** | Edge’s built-in sidebar used a **top-level browsing context** with normal cookies; extension iframes cannot match that. |
| **Maintenance** | Allowlists, mobile UA, header stripping, and cookie sync needed broad permissions (`<all_urls>`, `cookies`, DNR) yet still failed on sites like Xiaohongshu. |

**Current approach:** the side panel is a **launcher only**; clicks open a **popout** (`window.open`) with standard browser cookies and login. See [CHANGELOG.md](CHANGELOG.md) v2.0.0.

---

## Features

| Feature | Description |
|---------|-------------|
| Custom shortcuts | Name and URL; favicon loaded automatically from each site |
| Popout on click | Each shortcut opens in a dedicated popout window |
| Mobile (WAP) by default | Allowlisted `m.` mapping (Bilibili, Weibo); others use saved URL |
| Vertical list | Side panel is a launcher only—no iframe embedding |
| Saved URL integrity | Configured URLs are never rewritten in storage (v1.1.1+) |
| Sync | `chrome.storage.sync` across signed-in devices |
| UI language | Simplified Chinese / English / follow browser (side panel + options) |
| Privacy-first | No analytics; config stored locally / in sync only |

## Screenshots

| Side panel preview | Options page |
|:---:|:---:|
| *Coming soon* | *Coming soon* |

## Requirements

- **Microsoft Edge 114+** or **Google Chrome 114+** (Side Panel API)
- Permissions: `storage`, `sidePanel`

## Quick start

### Microsoft Edge

1. `git clone https://github.com/ChakmingLeung/Side-Shortcuts-Popout.git`
2. Open `edge://extensions/` and enable **Developer mode**
3. **Load unpacked** and select the project root
4. Click the extension icon or right-click → **Open in side panel**

### Google Chrome

1. Open `chrome://extensions/` and enable **Developer mode**
2. **Load unpacked** and select the project root

### First run

1. Sample shortcuts (Outlook, Teams, OneNote) are pre-installed—edit or remove them in options
2. Open **Extension options** to add shortcuts (name + full `http(s)://` URL)
3. Open the side panel and click a shortcut to open its popout
4. Use the gear icon for **Extension options**

## Will I lose my shortcuts?

**No** — clicking **Reload** on the extensions page does **not** erase your list. When you save a shortcut, the extension writes to:

| Storage | Purpose |
|---------|---------|
| **`chrome.storage.local`** | Persists on this device across reloads and browser restarts |
| **`chrome.storage.sync`** | Syncs to other devices when you’re signed in to Chrome/Edge with sync enabled |

**You will lose data if you:**

- **Uninstall** the extension
- **Clear extension/browsing data** for this extension in browser settings
- Never had a successful local or sync write (rare)

**Tip:** Stay signed in with sync on; when developing, use **Reload** instead of removing and re-adding the unpacked extension.

## Mobile (WAP) mode

**Open in mobile (WAP) mode** is enabled by default (can be turned off in options):

- **Allowlisted sites** (Bilibili, Weibo): mobile mode opens the mapped `m.` URL in the popout
- Saved shortcut URL is never rewritten in storage
- Per shortcut: follow global / always mobile / always desktop

## Project structure

```
Side-Shortcuts-Popout/
├── manifest.json
├── background.js
├── sidepanel.html/js/css
├── options.html/js/css
├── shared.js
├── icons/
├── scripts/
└── docs/
    ├── PRD.md / PRD.zh-CN.md
    └── ARCHITECTURE.md / ARCHITECTURE.zh-CN.md
```

## Development

```powershell
# Optional: regenerate icons
powershell -ExecutionPolicy Bypass -File .\scripts\generate-icons.ps1

# After bumping manifest.json version — sync version across docs
powershell -ExecutionPolicy Bypass -File .\scripts\sync-doc-version.ps1
```

After code changes, click **Reload** on the extensions page.

**Docs:** Cursor uses [AGENTS.md](AGENTS.md) and `.cursor/rules/github-docs-sync.mdc` to keep README / CHANGELOG / PRD / ARCHITECTURE (EN + zh-CN) in sync. See [docs/MAINTENANCE.md](docs/MAINTENANCE.md).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release notes. Latest: **v2.1.2** — vertical shortcut list; click opens popout.

## Known limitations

Popouts depend on the browser’s popup policy—allow popups for the extension if blocked. Default width is ~420px; you can resize the window manually.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/PRD.md](docs/PRD.md) | Product requirements (English) |
| [docs/PRD.zh-CN.md](docs/PRD.zh-CN.md) | 产品需求文档（中文） |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture (English) |
| [docs/ARCHITECTURE.zh-CN.md](docs/ARCHITECTURE.zh-CN.md) | 技术架构（中文） |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributing (English) |
| [CONTRIBUTING.zh-CN.md](CONTRIBUTING.zh-CN.md) | 贡献指南（中文） |
| [CHANGELOG.md](CHANGELOG.md) | Release notes (EN / 中文) |

## Privacy

Only your shortcut list is stored locally and optionally synced with your browser account. No browsing history or page content is collected.

## License

[MIT License](LICENSE) © 2026

## Disclaimer

This project is not affiliated with Microsoft or Google. For Edge sidebar changes, refer to [Microsoft’s official notice](https://support.microsoft.com/en-US/edge/streamline-access-to-your-favorite-sites-and-apps-with-sidebar-in-microsoft-edge).
