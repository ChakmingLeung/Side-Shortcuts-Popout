# Product Requirements Document (PRD)

**Language:** [English](PRD.md) · [简体中文](PRD.zh-CN.md)

## Side Shortcuts Popout Browser Extension

| Attribute | Value |
|-----------|-------|
| Doc version | v2.1.7 |
| Product version | 2.1.7 |
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
| Broken habits | Users relied on Edge sidebar for Outlook, Teams, IM, etc. |
| iframe / login | Embedded side panel ≠ tab cookies; some sites block framing |
| **Broken URLs (v1.1.0)** | Generic `www`→`m` rewrite made saved shortcuts unreachable (fixed) |

### 1.3 Opportunity

**Side Panel shortcut list** + **popout (top-level browsing)** + **allowlisted mobile mapping**—without mutating stored URLs.

---

## 2. Product goals

### 2.1 Goals

1. User-defined shortcuts; **stored `url` is always user input**
2. Vertical shortcut list in side panel; click opens popout window
3. Mobile mode: allowlist hostname transform; non-allowlist = original URL in popout
4. Sync via `chrome.storage.sync`; no server, no telemetry

### 2.2 Non-goals

- Replace Copilot; in-sidebar iframe (removed in v2.0.0); native mobile browsers

---

## 4. User stories (selected)

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| US-02 | Open from sidebar | Popout window with resolved URL |
| US-03 | Multiple shortcuts | One popout per shortcut; refocus if already open |
| US-07 | Mobile allowlist | Bilibili/Weibo use `m.` host in popout; saved URL unchanged |
| US-08 | Outlook/Teams work | No automatic `m.` rewrite; original URL loads |
| US-09 | Options display | List shows saved URL; optional “sidebar load” hint |

---

## 5. Functional requirements

### 5.1 Mobile mode rules (v1.1.1)

| Rule | Behavior |
|------|----------|
| Storage | `shortcuts[].url` = user-configured canonical URL only |
| Allowlist | `HOST_TO_MOBILE` in `shared.js` (Douyin, Bilibili, Weibo, …) |
| Non-allowlist | `loadUrl === canonicalUrl`; mobile UA via DNR on **load hostname** |
| No generic `www`→`m` | Removed in v1.1.1 |

### 5.2 Data model

```json
{
  "settings": { "defaultMobileMode": true },
  "shortcuts": [
    {
      "id": "uuid",
      "title": "Douyin",
      "url": "https://www.douyin.com/jingxuan",
      "emoji": "🎵",
      "mobile": null
    }
  ],
  "lastShortcutId": "uuid"
}
```

`resolveLoadUrl()` returns `{ loadUrl, canonicalUrl, mobile, urlTransformed }`.

---

## 8. Roadmap

### v1.1.1 (current)

- Fix mobile URL overwrite bug
- Allowlist-only domain mapping
- Hostname-scoped DNR
- Options UI shows canonical URL

### v1.1.0

- Mobile WAP mode, DNR UA, per-shortcut toggles

### v1.0.0

- Side panel, shortcuts, tab bar, sync

### Backlog

v1.2 drag sort / JSON export · v2.0 store publish

---

## 9. References

- [Edge App Tower retirement](https://support.microsoft.com/en-US/edge/streamline-access-to-your-favorite-sites-and-apps-with-sidebar-in-microsoft-edge)
- [chrome.sidePanel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
- [declarativeNetRequest](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)
