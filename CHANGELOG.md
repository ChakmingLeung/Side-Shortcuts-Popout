# Changelog

**Language / 语言:** English below · [简体中文](#简体中文) below

All notable changes to this project are documented here. Version numbers match `manifest.json`.

---

## [2.1.3] — 2026-05-19

### Changed / 变更

- Default shortcuts on first install: Yuque, Xiaohongshu, Douyin, Instagram, TikTok

### 变更（中文）

- 首次安装预置快捷方式：语雀、小红书、抖音、Instagram、TikTok

---

## [2.1.2] — 2026-05-19

### Changed / 变更

- Rename extension to **侧栏快捷小窗** / **Side Shortcuts Popout** (`_locales` for store name & description)

### 变更（中文）

- 扩展更名为 **侧栏快捷小窗**（英文 **Side Shortcuts Popout**），manifest 支持中英本地化名称

---

## [2.1.1] — 2026-05-19

### Changed / 变更

- Persist shortcuts/settings to **local + sync** (reload-safe even when sync is off)
- Seed default shortcuts only on **first install**, not on extension update

### 变更（中文）

- 快捷方式同时写入本机与账号同步；未登录时重载扩展也不丢配置
- 仅在首次安装时写入示例快捷方式

---

## [2.1.0] — 2026-05-19

### Added / 新增

- Auto favicon per shortcut URL (Chrome `/_favicon/` with Google fallback); removed manual Emoji field

### 新增（中文）

- 快捷入口图标自动使用网站 favicon，无需再填 Emoji

---

## [2.0.0] — 2026-05-19

### Changed / 变更

- **Remove in-panel iframe preview** — side panel is a vertical shortcut list only
- **Click shortcut → popout window** by default (normal cookies, login, QR codes)
- Drop `declarativeNetRequest`, `cookies`, and `<all_urls>` (no embed/Cookie DNR hacks)

**Rationale:** iframe preview hit API limits, cookie partitioning, anti-framing, and login/QR issues—see README “Why we dropped in-panel preview”.

### 变更（中文）

- **取消侧栏内嵌网页**，改为纵向快捷列表
- **点击默认小窗打开**，登录态与常规标签页一致
- 移除 iframe 嵌入、DNR、Cookie 同步相关权限与逻辑

**背景：** iframe 预览受 Side Panel API、Cookie 分区、站点反嵌套与登录/扫码限制影响，体验与维护成本不理想；详见 README「为何不做侧栏内嵌预览」。

---

## [1.3.4] — 2026-05-19

### Fixed / 修复

- Side panel iframe uses a separate cookie partition from normal tabs; for Xiaohongshu, sync login cookies from the browser via `cookies` + DNR (fixes missing login / QR when already logged in elsewhere)
- Refresh cookie injection when site cookies change

### 修复（中文）

- 侧栏 iframe 与常规标签页 Cookie 分区不同；预览小红书时同步浏览器已登录 Cookie，侧栏可保持登录态

---

## [1.3.3] — 2026-05-19

### Changed / 变更

- Address bar expands to use available toolbar width (more URL visible)
- Popout: icon only, shown inside the **active** tab (removed separate tab-bar button)

### 变更（中文）

- 地址栏自适应占满工具栏剩余宽度，可显示更多网址字符
- 小窗改为仅当前选中标签内显示图标，未选中标签不显示

---

## [1.3.2] — 2026-05-19

### Fixed / 修复

- Xiaohongshu (`xiaohongshu.com`): embed allowlist, API/CDN domains for login QR, desktop UA in side panel (skip mobile UA)
- DNR also relaxes CSP on XHR/image/script for preview + login-related hosts

### 修复（中文）

- 小红书侧栏预览：加入嵌入白名单、登录 API/CDN 域名处理，侧栏内使用桌面 UA 以改善扫码框
- 若仍无法显示二维码，请用标签栏「小窗」打开（站点可能限制 iframe 登录）

---

## [1.3.1] — 2026-05-19

### Changed / 变更

- Language switch only in options (removed from side panel toolbar)
- Address bar shows load URL with one-click copy
- Removed back / forward toolbar buttons

### 变更（中文）

- 语言仅在设置页配置，侧栏移除语言下拉
- 地址栏显示当前加载网址并支持一键复制
- 移除前进、后退按钮

---

## [1.3.0] — 2026-05-19

### Changed / 变更

- Remove embed-failure polling, loading overlay, and automatic fallback UI (faster iframe load)
- Click shortcut → set `iframe.src` immediately with mobile UA / DNR as configured
- Add **Popout** button on tab bar for manual open in a new window when a site blocks the side panel

### 变更（中文）

- 取消拒绝访问检测与自动引导层，点击快捷方式直接加载
- 标签栏新增「小窗」按钮，供用户自行小窗打开当前页

---

## [1.2.1] — 2026-05-19

### Fixed / 修复

- Improve QR / scan-to-login in side panel: relax iframe `allow` permissions
- DNR removes framing/CSP/Permissions-Policy headers for preview hosts, nested subframes, and common login iframe domains (WeChat, etc.)
- Embed header rules now apply in desktop mode too (not only mobile UA)
- Narrow embed-failure text detection to reduce false positives on login pages

### 修复（中文）

- 改善侧栏内扫码登录：放宽 iframe 权限，为嵌套登录框移除禁止嵌入响应头
- 桌面版预览同样启用嵌入头处理

---

## [1.2.0] — 2026-05-19

### Added / 新增

- In-app language switch (简体中文 / English / follow browser) in side panel toolbar and options
- Shared `i18n.js` messages; locale stored in `settings.locale`

### 新增（中文）

- 侧边栏工具栏与设置页支持界面语言切换（简体中文 / English / 跟随浏览器）

---

## [1.1.6] — 2026-05-19

### Improved / 改进

- Faster in-panel load: DNR rules apply in parallel with iframe navigation (no longer block on `await`)
- Dismiss loading overlay as soon as iframe `load` fires so the page is visible while checks continue
- Faster embed polling after load (50 ms); failure guide in ~400–500 ms when embed cannot be confirmed
- Skip redundant `src` reset when URL unchanged

### 改进（中文）

- 侧栏加载更快：网络规则与 iframe 并行，不再阻塞等待
- iframe 触发 `load` 后立即收起「正在加载」遮罩
- 拒绝连接等失败场景约半秒内显示「小窗 / 新标签」引导

---

## [1.1.5] — 2026-05-19

### Fixed / 修复

- Fix fallback buttons not appearing on `refused to connect` (no longer treat cross-origin as instant success)
- Poll iframe state and detect browser error pages / error text
- After max polls without success, show popout and new-tab options

### 修复（中文）

- 修复「refused to connect」时不出现「新建小窗 / 新标签页」引导的问题
- 轮询检测错误页与错误文案，避免误判为加载成功

---

## [1.1.4] — 2026-05-19

### Fixed / 修复

- Always **try in-sidebar iframe first** with loading state; fallback buttons only after confirmed embed failure
- Removed unreliable iframe `error` event that caused premature fallback UI

### 修复（中文）

- 先尝试在插件内加载，显示「正在加载」；**确认无法嵌入后**才显示小窗/新标签引导
- 修复过早弹出引导按钮的问题

---

## [1.1.3] — 2026-05-19

### Added / 新增

- When iframe preview fails: **Open in new window** (one popout per shortcut, multiple allowed) or **Open in new tab**
- Default remains in-sidebar preview

### 新增（中文）

- 侧栏无法打开时：**新建小窗打开**（每个快捷方式独立小窗，可多开）、**在新标签页打开**
- 默认仍在插件内预览

---

## [1.1.2] — 2026-05-19

### Fixed / 修复

- **Douyin 404:** no longer rewrite `www.douyin.com` → `m.douyin.com`; keep user URL + mobile UA
- **refused to connect:** remove `X-Frame-Options` / CSP on allowlisted roots (`douyin.com`, etc.) for iframe subframes
- In-panel fallback UI: retry or open in new tab when embed still fails

### 修复（中文）

- 抖音不再跳转 `m.douyin.com`，修复 404
- 对抖音等域名移除 iframe 禁止嵌入的响应头，缓解 refused to connect
- 加载失败时显示重新加载 / 新标签页打开

---

## [1.1.1] — 2026-05-19

### Fixed / 修复

- **Mobile mode no longer overwrites saved URLs** — `shortcuts[].url` always stores the user-configured address
- Removed the generic `www.*` → `m.*` rewrite that broke Outlook, Teams, OneNote, and other sites without a mobile subdomain
- **Allowlist-only hostname mapping** (Douyin, Bilibili, Weibo, etc.); other sites keep the original URL and only receive a mobile User-Agent in the iframe
- DNR User-Agent rules now target the **actual load hostname** instead of overly broad root domains (e.g. `live.com`)
- Options page always shows the **saved URL**; shows a separate “loaded in sidebar” hint when the iframe URL differs

### 修复（中文）

- **移动版不再改写用户保存的网址**
- 移除泛化 `www.*` → `m.*` 规则，修复 Outlook / Teams 等无法访问的问题
- 仅白名单站点做移动域名转换，其余站点保持原 URL + 移动 UA
- DNR 仅匹配实际加载的主机名
- 设置页始终显示原始配置地址

---

## [1.1.0] — 2026-05-19

### Added / 新增

- Mobile (WAP) mode enabled by default
- Host mapping + `declarativeNetRequest` mobile User-Agent
- Global and per-shortcut mobile toggles (inherit / on / off)
- Douyin and similar sites supported in side panel preview

### 新增（中文）

- 默认移动版 (WAP) 加载
- 域名映射与移动 UA 注入
- 全局/单入口移动版开关
- 改善抖音等站点侧边栏预览

---

## [1.0.0] — 2026-05-19

### Added / 新增

- Configurable shortcuts (name, URL, emoji)
- Chromium Side Panel with in-panel iframe preview
- Tab bar for quick switching with per-shortcut state
- Toolbar: home, back, forward, reload
- `chrome.storage.sync` for shortcuts
- Sample shortcuts: Outlook, Teams, OneNote

### 新增（中文）

- 可配置快捷入口
- 侧边栏 iframe 预览
- 标签栏快速切换与状态保留
- 工具栏导航与配置同步
- 预置示例入口

---

## 简体中文

完整版本历史见上文英文条目；当前最新版本为 **1.1.1**。

| 版本 | 要点 |
|------|------|
| 1.1.1 | 修复移动版误改 URL；白名单域名转换 |
| 1.1.0 | 移动版 WAP、UA 注入、抖音支持 |
| 1.0.0 | 侧边栏、标签切换、快捷入口管理 |
