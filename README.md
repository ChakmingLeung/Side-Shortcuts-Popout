# Side Shortcuts Popout

**Language / 语言:** [English](README.md) · [简体中文](README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](manifest.json)
[![Chrome 114+](https://img.shields.io/badge/Chrome-114%2B-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
[![Edge 114+](https://img.shields.io/badge/Edge-114%2B-0078D4?logo=microsoftedge&logoColor=white)](https://learn.microsoft.com/microsoft-edge/extensions-chromium/)

A browser extension that lists customizable web shortcuts in the native Chromium **Side Panel**—click to open in a **popout window** beside the main window, with normal cookies and login. Useful when [Microsoft Edge retires the built-in App Tower sidebar](https://support.microsoft.com/en-US/edge/streamline-access-to-your-favorite-sites-and-apps-with-sidebar-in-microsoft-edge).

---

## Features

| Feature | Description |
|---------|-------------|
| Shortcuts | Custom name & URL; favicon from site |
| Popout | Opens in an independent window; multiple popouts supported |
| Resume | Focus without reload if still open; restore last URL in same browser session after close |
| Open from start | **Shift+click** or context **Open from start URL** |
| Mobile / desktop | Per-entry; mobile uses Android UA + 375px + viewport |
| Launcher mode | **Side panel list** or **toolbar popup menu** |
| Theme | Light / dark / follow system |
| Backup | Export / import JSON |
| Sync | Optional `chrome.storage.sync` when signed in |
| Locale | English / 简体中文 / follow browser |

## Requirements

- **Microsoft Edge 114+** or **Google Chrome 114+**

## Install (load unpacked)

1. Clone or download this repository
2. **Edge:** `edge://extensions/` → **Developer mode** → **Load unpacked** → select the repo root (folder containing `manifest.json`)
3. **Chrome:** `chrome://extensions/` → **Developer mode** → **Load unpacked** → select the repo root
4. **Pin** the extension to the toolbar and open the side panel

> An “unverified extension” notice is normal in developer mode.

### First run

1. Nine preset shortcuts on first install; edit in **Options**
2. Click a shortcut to open a popout; use the gear icon for settings
3. **Export** your config before uninstall or device change

## Popout tips

| Action | Effect |
|--------|--------|
| Normal click | Open popout; after close, restore last URL in this session when possible |
| Click while popout open | Focus only, no reload |
| **Shift+click** / **Open from start** | Load configured start URL |

## Mobile / desktop

- Stored **URL is never rewritten** by the extension
- **Mobile:** ~375px wide, Android UA + viewport
- **Desktop:** ~420px wide, native UA
- Use mobile URLs yourself when needed (e.g. `https://m.weibo.cn/`)

## Known limitations

- Popups may be blocked by browser policy
- **Resume** restores URL only, not scroll or form state; session clears when the browser closes
- Popouts cannot be forced “always on top”

## Privacy

Only your shortcut list is stored locally and optionally synced with your browser account. No browsing history or page content is collected.

## License

[MIT License](LICENSE) © 2026

## Disclaimer

Not affiliated with Microsoft or Google.
