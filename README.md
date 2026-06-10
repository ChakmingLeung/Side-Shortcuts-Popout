# Side Shortcuts Popout

**Language / 语言:** [English](README.md) · [简体中文](README.zh-CN.md)  
**Changelog / 更新日志:** [CHANGELOG.md](CHANGELOG.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](manifest.json)
[![Chrome 114+](https://img.shields.io/badge/Chrome-114%2B-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
[![Edge 114+](https://img.shields.io/badge/Edge-114%2B-0078D4?logo=microsoftedge&logoColor=white)](https://learn.microsoft.com/microsoft-edge/extensions-chromium/)
[![Version](https://img.shields.io/badge/version-2.6.0-blue.svg)](CHANGELOG.md)

A browser extension that lists customizable web shortcuts in the native Chromium **Side Panel**—click to open in a **popout window** beside the main window, with normal cookies and login. Useful when [Microsoft Edge retires the built-in App Tower sidebar](https://support.microsoft.com/en-US/edge/streamline-access-to-your-favorite-sites-and-apps-with-sidebar-in-microsoft-edge).

## ✨ Features

| Feature | Description |
|---------|-------------|
| Shortcuts | Custom name & URL; favicon from site |
| Popout | Opens in an independent window; multiple popouts supported |
| Resume | Focus without reload if still open; restore last URL in same browser session after close |
| Open from start | **Shift+click** or context **Open from start URL** |
| Mobile / desktop | Per-entry; mobile uses Android UA + 375px + viewport |
| Launcher mode | **Side panel list** or **toolbar popup menu** |
| Open mode | Default **Popout** (recommended); **not recommended** for daily use: experimental **open page in side panel** |
| Theme | Light / dark / follow system |
| Backup | Export / import JSON |
| Sync | Optional `chrome.storage.sync` when signed in |
| Locale | English / 简体中文 / follow browser |

## 💻 Requirements

- **Microsoft Edge 114+** or **Google Chrome 114+**

## 📥 Install

### Option 1: Microsoft Edge Add-ons (recommended)

1. Open [Side Shortcuts Popout on Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/ongipjlogkkpiolghmglnjjkjaddbgoa)
2. Click **Get** / **Add extension**
3. **Pin** the extension to the toolbar and open the side panel

### Option 2: Download Release (zip)

1. Open [GitHub Releases](https://github.com/ChakmingLeung/Side-Shortcuts-Popout/releases)
2. Download the latest **`Side-Shortcuts-Popout-v*.zip`**
3. Unzip to any folder (the folder root must contain `manifest.json`)
4. **Edge:** `edge://extensions/` → **Developer mode** → **Load unpacked** → select the unzipped folder  
   **Chrome:** `chrome://extensions/` → **Developer mode** → **Load unpacked** → select the unzipped folder

> An “unverified extension” notice is normal when loading from a Release zip or source.

### First run

1. Nine preset shortcuts on first install; edit in **Options**
2. Click a shortcut to open a popout; use the gear icon for settings
3. **Export** your config before uninstall or device change

## 🖱️ Popout tips

| Action | Effect |
|--------|--------|
| Normal click | Open popout; after close, restore last URL in this session when possible |
| Click while popout open | Focus only, no reload |
| **Shift+click** / **right-click Open from start** | Load configured start URL |

The side panel list includes **usage tips** below the shortcuts. With **open page in side panel** enabled, popup menu clicks open sites in a side-panel iframe; the toolbar icon stays on the popup menu.

## 🧪 Open page in side panel (experimental, v2.6.0)

> [!WARNING]
> **Not recommended.** This is experimental: browser APIs and site policies make **failures common and behavior unreliable**. Keep the default **Popout**. Only try briefly if you must; switch back to Popout when anything goes wrong. Default iframe was dropped in **v2.0.0** for the same class of issues; the main path remains **shortcut list + popout**.

- **Options → Open mode → Side panel** opens sites in a full-screen iframe via the toolbar **popup menu** (toolbar stays on popup menu in this mode)
- The `!` hint in Settings says the same; use **Open in popout** on failure; this mode has **no** popout-style URL resume

| Limitation | Explanation |
|------------|-------------|
| **Extension API** | The [Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel) only loads extension pages (e.g. `sidepanel.html`), **not** arbitrary `https://` URLs—external sites must go in an **iframe**. |
| **Cookie / login isolation** | Panel iframes use **different cookie partitions** than normal tabs, so you often get “logged in on tab, not in panel” or failed QR login; cookie injection workarounds are fragile and need extra permissions. |
| **Sites block embedding** | Many sites set `X-Frame-Options` or CSP `frame-ancestors` to **refuse iframe embedding**; even if `declarativeNetRequest` strips headers, front-end code may detect `window.top !== window.self` and break login or QR codes. |
| **Unlike Edge’s built-in sidebar** | Legacy Edge opened sites in a **separate top-level browsing context** with normal cookies and login; **extension iframes cannot match that**. |
| **Maintenance & permissions** | Per-site allowlists, mobile UA, header rewriting, and cookie sync need broad permissions (`<all_urls>`, `cookies`, DNR) and still fail on strict login sites (e.g. Xiaohongshu). |

## 📱 Mobile / desktop

- Stored **URL is never rewritten** by the extension
- **Mobile:** ~375px wide, Android UA + viewport
- **Desktop:** ~420px wide, native UA
- Use mobile URLs yourself when needed (e.g. `https://m.weibo.cn/`)

## ⚠️ Known limitations

- Popups may be blocked by browser policy; if blocked, allow popups in the site’s permissions
- **Resume** restores URL only, not scroll or form state; session clears when the browser closes
- Popouts cannot be forced “always on top”

## 🔒 Privacy

Only your shortcut list is stored locally and optionally synced with your browser account. No browsing history or page content is collected.

## 📄 License

[MIT License](LICENSE) © 2026

## ℹ️ Disclaimer

Not affiliated with Microsoft or Google.
