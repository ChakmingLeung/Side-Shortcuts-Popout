# Side Shortcuts Popout

**Language / 语言:** [English](README.md) · [简体中文](README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](manifest.json)
[![Chrome 114+](https://img.shields.io/badge/Chrome-114%2B-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
[![Edge 114+](https://img.shields.io/badge/Edge-114%2B-0078D4?logo=microsoftedge&logoColor=white)](https://learn.microsoft.com/microsoft-edge/extensions-chromium/)
[![Version](https://img.shields.io/badge/version-2.2.3-blue.svg)](CHANGELOG.md)

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
| Custom shortcuts | Name and URL; favicon from each site (Chrome bookmark-style cache) |
| Popout on click | Each shortcut opens in a dedicated popout window |
| Break-time friendly | Keep work in the main window; pop out Xiaohongshu, Douyin, Instagram, etc. beside you—close the small window when done |
| Low-profile layout | Narrow side panel launcher—less obvious than switching full tabs; focus the main window anytime |
| Mobile (WAP) by default | Allowlisted `m.` mapping (Bilibili, Weibo); others use saved URL |
| Appearance | System / light / dark theme (options + side panel) |
| Backup & restore | Export/import JSON from the **Saved shortcuts** header (for uninstall or reinstall) |
| Options layout | Add form on the left, list on the right; **Edit** expands inline in the list |
| Vertical list | Side panel is a launcher only—no iframe embedding |
| Saved URL integrity | Configured URLs are never rewritten in storage (v1.1.1+) |
| Sync | `chrome.storage.sync` across signed-in devices (while extension stays installed) |
| UI language | Simplified Chinese / English / follow browser (side panel + options) |
| Privacy-first | No analytics; config stored locally / in sync only |

## Screenshots

| Side panel preview | Options page |
|:---:|:---:|
| *Coming soon* | *Coming soon* |

## Requirements

- **Microsoft Edge 114+** or **Google Chrome 114+** (Side Panel API)
- Permissions: `storage`, `sidePanel`, `favicon` (site icons, same source as the bookmark bar)

## Quick start

### Option 1: Download a Release (recommended)

1. Open [Releases](https://github.com/ChakmingLeung/Side-Shortcuts-Popout/releases)
2. Download the latest **`Side-Shortcuts-Popout-v*.zip`**
3. Unzip to a folder (you should see `manifest.json` at the top level)
4. **Edge:** `edge://extensions/` → **Developer mode** → **Load unpacked** → select that folder  
5. **Chrome:** `chrome://extensions/` → **Developer mode** → **Load unpacked** → select that folder  
6. **Pin to toolbar (recommended):** Open the **extensions menu (puzzle icon)** → find **Side Shortcuts Popout** → click **Pin** for one-click access to the side panel  
7. Click the pinned extension icon to open the side panel

> Loaded in developer mode (not from a store). An “unverified extension” notice is normal.

### Option 2: Clone the repo (developers)

#### Microsoft Edge

1. `git clone https://github.com/ChakmingLeung/Side-Shortcuts-Popout.git`
2. Open `edge://extensions/` and enable **Developer mode**
3. **Load unpacked** and select the project root
4. Click the extension icon or right-click → **Open in side panel**

#### Google Chrome

1. Open `chrome://extensions/` and enable **Developer mode**
2. **Load unpacked** and select the project root

### First run

1. **Pin to toolbar:** Extensions menu (puzzle) → **Side Shortcuts Popout** → Pin, so you can open the side panel anytime  
2. Sample shortcuts (Yuque, Xiaohongshu, Douyin, Instagram, TikTok) are pre-installed—edit or remove them in options  
3. Open the side panel and click a shortcut to open its popout  
4. Manage shortcuts via the **gear** icon in the side panel or **Extension options**; use **Edit** on a list row to change it in place

## Will I lose my shortcuts?

**No** — clicking **Reload** on the extensions page does **not** erase your list. When you save a shortcut, the extension writes to:

| Storage | Purpose |
|---------|---------|
| **`chrome.storage.local`** | Persists on this device across reloads and browser restarts |
| **`chrome.storage.sync`** | Syncs to other devices when you’re signed in to Chrome/Edge with sync enabled |

**You will lose data if you:**

- **Uninstall** the extension (local and sync storage are cleared—**reinstall does not reliably restore** your list)
- **Clear extension/browsing data** for this extension in browser settings

**Tips:**

- Stay signed in with sync for multi-device use while the extension remains installed
- Before uninstall, device change, or reinstall from the **Edge Add-ons store**: on the options page, **Export** from the **Saved shortcuts** header, then **Import** after reinstall (choose merge or replace, then pick the JSON file)
- When developing, use **Reload** instead of removing and re-adding the unpacked extension

## Mobile (WAP) mode

New shortcuts **default to mobile**; each entry can be set to desktop in the editor:

- **Allowlisted sites** (Bilibili, Weibo): mobile mode opens the mapped `m.` URL in the popout
- Saved shortcut URL is never rewritten in storage
- Per shortcut: mobile or desktop

## Project structure

```
Side-Shortcuts-Popout/
├── manifest.json
├── background.js
├── shared.js
├── theme.js
├── backup.js
├── i18n.js
├── sidepanel.html/js/css
├── options.html/js/css
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

See [CHANGELOG.md](CHANGELOG.md) for release notes. Latest: **v2.2.3** — theme & backup, options layout with inline edit, favicons, import/export UX.

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
