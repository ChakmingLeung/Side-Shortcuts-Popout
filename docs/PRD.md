# Product Requirements Document (PRD)

**Language:** [English](PRD.md) · [简体中文](PRD.zh-CN.md)

## Side Shortcuts Popout Browser Extension

| Attribute | Value |
|-----------|-------|
| Doc version | v2.2.3 |
| Product version | 2.2.3 |
| Last updated | 2026-05-19 |
| Status | Open source |
| Platforms | Microsoft Edge 114+, Google Chrome 114+ |

---

## 1. Background & problem

### 1.1 Industry context

Microsoft is simplifying Edge and [retiring the sidebar App Tower](https://support.microsoft.com/en-US/edge/streamline-access-to-your-favorite-sites-and-apps-with-sidebar-in-microsoft-edge).

### 1.2 User pain points

| Pain | Description |
|------|-------------|
| Broken habits | Users relied on Edge sidebar for quick site access |
| iframe / login | Embedded side panel ≠ tab cookies; some sites block framing (iframe removed in v2.0) |
| **Broken URLs (v1.1.0)** | Generic `www`→`m` rewrite (fixed) |
| Data loss on uninstall | Extension storage is cleared on uninstall; JSON backup is user-driven |

### 1.3 Opportunity

**Side Panel shortcut list** + **popout browsing** + **allowlisted mobile mapping** + **theme / backup / inline edit**—without mutating stored URLs.

---

## 2. Product goals

1. Stored `shortcuts[].url` is always user input
2. Vertical list in side panel; click opens popout
3. New shortcuts default to mobile; per-entry mobile/desktop
4. Local persistence + optional `chrome.storage.sync`; JSON import/export
5. No server, no telemetry

### 2.2 Non-goals

- Replace Copilot; in-sidebar iframe (removed in v2.0.0); native mobile browsers

---

## 4. User stories (selected)

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| US-02 | Open from sidebar | Popout with resolved URL |
| US-07 | Mobile allowlist | Bilibili/Weibo use `m.` host in popout; saved URL unchanged |
| US-08 | Other sites | Non-allowlist keeps saved URL |
| US-10 | Inline edit | Edit expands in the saved list without scrolling to the add form |
| US-11 | Backup | Export JSON; import after reinstall (merge/replace) |
| US-12 | Theme | System / light / dark in options; side panel follows |

---

## 5. Functional requirements

### 5.1 Mobile mode rules

| Rule | Behavior |
|------|----------|
| Storage | `shortcuts[].url` = user canonical URL only |
| Default | New entries `mobile: true`; `mobile === false` = desktop |
| Allowlist | `HOST_TO_MOBILE` in `shared.js` (Bilibili, Weibo) |
| Non-allowlist | `loadUrl === canonicalUrl` (v2 popout: no DNR / UA injection) |
| No generic `www`→`m` | Removed in v1.1.1 |

### 5.2 Data model

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

### 5.3 Backup format

- Export: JSON via `backup.js` (shortcuts, settings, version, timestamp)
- Import: merge (update by id, append new) or replace (clear then import)
- UI: **Saved shortcuts** header; choose mode before file picker

### 5.4 Options & side panel

- Global: language, appearance theme
- Two-column options: add (left), list (right); responsive stack
- Header right: author, GitHub link, extension version
- Side panel: favicons, settings link, list refresh on storage changes

---

## 8. Roadmap (summary)

| Version | Highlights |
|---------|------------|
| **v2.2.3** (current) | Options layout, inline edit, import/export UX, header author info |
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
