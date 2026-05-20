# Product Requirements Document (PRD)

**Language:** [English](PRD.md) · [简体中文](PRD.zh-CN.md)

## Side Shortcuts Popout Browser Extension

| Attribute | Value |
|-----------|-------|
| Doc version | v2.2.4 |
| Product version | 2.2.4 |
| Last updated | 2026-05-19 |
| Status | Open source |
| Platforms | Microsoft Edge 114+, Google Chrome 114+ |

---

## 1. Background & problem

### 1.1 Industry change: Edge sidebar capability reduced

Microsoft is simplifying Edge and [retiring the built-in sidebar App Tower](https://support.microsoft.com/en-US/edge/streamline-access-to-your-favorite-sites-and-apps-with-sidebar-in-microsoft-edge)—the feature that pinned favorite sites and apps in the sidebar. Many users relied on:

- Keeping the main window for work, study, or documents;
- Keeping a vertical list of favorite sites in the sidebar, one click away.

After that built-in capability goes away, **the browser no longer offers a configurable “sidebar shortcut list”**, and users need another way to get the same workflow back.

### 1.2 User pain points

| Pain | Description |
|------|-------------|
| Broken habits | No sidebar one-click access to frequent sites; fall back to tabs or bookmarks |
| Hard to browse side-by-side | Want “main window + a small window” for news/social without filling the main tab bar |
| Login & embedding | In-sidebar iframe preview breaks cookies vs tabs; many sites block framing (see §1.4) |
| Config loss | Uninstalling the extension clears `chrome.storage`; reinstall or new machine needs JSON backup |

### 1.3 Product positioning

This extension uses the Chromium **[Side Panel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)** API to show a **vertical list of user-defined shortcuts** in the extension’s own sidebar page. **A click opens the target site in a separate popout window** next to the main window.

- **Sidebar:** list and launch only—lightweight, no main-window tab churn.
- **Popout:** full browser context—login, QR codes, and payments behave like normal tabs.

It is a practical way to restore **“sidebar shortcuts + quick popout”** after Edge removes App Tower.

### 1.4 Design trade-off (why not iframe)

v1.x tried iframe preview inside the sidebar. Extension side panels can only load extension pages; external sites require iframe, which led to cookie isolation, `X-Frame-Options` blocks, and permission bloat. **Dropped in v2.0.0.** Current model: **sidebar list + popout on click**. Details: [README.md](../README.md).

---

## 2. Product goals

### 2.1 Vision

After Edge removes built-in sidebar shortcuts, users can still **open favorite sites in a popout from the browser sidebar**, alongside the main window, with simple local configuration.

### 2.2 Core goals

| Goal | Description |
|------|-------------|
| **Restore sidebar shortcuts** | User-defined name and URL; vertical list in the side panel; one click to open |
| **Popout side-by-side** | Independent popout window; main window tabs unchanged; multiple popouts allowed |
| **Predictable behavior** | Stored URL is always what the user entered; load-time rules (e.g. mobile allowlist) never silently rewrite saved config |
| **Lightweight** | No backend, no telemetry; permissions: `storage`, `sidePanel`, `favicon` |
| **Portable config** | JSON export/import; optional `chrome.storage.sync` across signed-in browsers |

### 2.3 Non-goals

- Replace Edge Copilot or the system sidebar app store
- Full in-sidebar web preview via iframe (removed)
- Replace native mobile apps or a full desktop browser
- Auto-crawl, recommend, or sync browsing history

### 2.4 Success criteria (qualitative)

- User completes “add shortcut → see in sidebar → click opens popout” in about one minute
- Common login-heavy sites work in the popout like a normal tab
- Clear path to export before uninstall; restore list after reinstall

---

## 3. Target users & scenarios

| User | Scenario |
|------|----------|
| Former App Tower users | Sidebar keeps Weibo, Bilibili, news, etc.; main window stays on work |
| Multitaskers | Main screen for docs; sidebar opens a popout for feeds; close popout when done |
| Multi-device users | `chrome.storage.sync` for shortcut list (while extension is installed) |

---

## 4. User stories (selected)

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| US-01 | Configure shortcuts | Add name and URL on options page; list appears in sidebar; pin extension to open panel |
| US-02 | Quick popout from sidebar | Click item; popout loads `resolveLoadUrl` result; main window unaffected |
| US-03 | Multiple popouts | Open several popouts; each closes independently |
| US-07 | Allowlisted mobile | Bilibili/Weibo: popout uses `m.` host; stored URL unchanged |
| US-08 | Other sites | Non-allowlist opens saved URL; no generic `www`→`m` |
| US-10 | Inline edit | Edit expands in saved list without scrolling to add form |
| US-11 | Backup | Export JSON; import after reinstall (merge/replace) |
| US-12 | Theme | System / light / dark in options; side panel follows |

---

## 5. Functional requirements

### 5.1 Side panel & popout (core)

| Rule | Behavior |
|------|----------|
| Sidebar content | Shortcut list, settings link, favicons only; no external iframe |
| Open action | Click → `window.open` popout; `loadUrl` from `resolveLoadUrl()` |
| Icons | `favicon` permission with fallback when fetch fails |

### 5.2 Mobile mode rules

| Rule | Behavior |
|------|----------|
| Storage | `shortcuts[].url` = user canonical URL only |
| Default | New entries `mobile: true`; `mobile === false` = desktop |
| Allowlist | `HOST_TO_MOBILE` in `shared.js` (Bilibili, Weibo) |
| Non-allowlist | `loadUrl === canonicalUrl` (v2 popout: no DNR / UA injection) |
| No generic `www`→`m` | Removed in v1.1.1 |

### 5.3 Data model

```json
{
  "settings": { "locale": null, "theme": "system" },
  "shortcuts": [
    {
      "id": "uuid",
      "title": "Douyin",
      "url": "https://www.douyin.com/jingxuan",
      "mobile": true
    }
  ],
  "lastShortcutId": "uuid"
}
```

`resolveLoadUrl()` returns `{ loadUrl, canonicalUrl, mobile, urlTransformed }`.

### 5.4 Backup format

- Export: JSON via `backup.js` (shortcuts, settings, version, timestamp)
- Import: merge (update by id, append new) or replace (clear then import)
- UI: **Saved shortcuts** header; choose mode before file picker

### 5.5 Options & side panel

- Global: language, appearance theme
- Two-column options: add (left), list (right); responsive stack
- Header right: author, GitHub link, extension version
- Side panel: favicons, settings link, list refresh on storage changes

---

## 8. Roadmap (summary)

| Version | Highlights |
|---------|------------|
| **v2.2.4** (current) | Code cleanup, favicon fallback trim, author profile link |
| v2.2.3 | Options layout, inline edit, import/export UX, header author info |
| v2.2.1 | JSON backup import/export |
| v2.2.0 | Appearance theme |
| v2.1.9 | Removed global mobile toggle; new shortcuts default mobile |
| v2.1.8 | `favicon` permission and icon fallbacks |
| v2.0.0 | Dropped iframe; popout on click |

See [CHANGELOG.md](../CHANGELOG.md).

---

## 9. References

- [Edge App Tower retirement](https://support.microsoft.com/en-US/edge/streamline-access-to-your-favorite-sites-and-apps-with-sidebar-in-microsoft-edge)
- [chrome.sidePanel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
- [Fetching favicons](https://developer.chrome.com/docs/extensions/how-to/ui/favicons)
