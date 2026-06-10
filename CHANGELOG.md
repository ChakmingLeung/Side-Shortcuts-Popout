# Changelog

**Language / 语言:** English below · [简体中文](#简体中文) below

All notable changes to this project are documented here. Version numbers match `manifest.json`.

---

## [2.6.0] — 2026-05-19

### Added / 新增

- **Experimental — side panel embed:** Settings → **Popout open mode** → **Side panel** opens popup-menu shortcuts in an iframe inside the side panel (default remains **Popout**)
- Settings `!` tooltip: recommends Popout; warns that Side panel embed may break login / loading on some sites
- Side panel **usage tips** (bulleted list below shortcuts): mobile/desktop switch, popout resume, Shift+click / right-click open from start
- Embed view: loading indicator; `chrome-error://` detection with **Open in popout** fallback
- Launcher list / popup: inline error when open fails (`errOpenFailed`, `errOpenNoWindow`, etc.)
- Module `sidebar-embed.js`: session key `sidebarEmbed`, `prepareSidebarEmbedFromShortcut`, `syncOpenEmbedIfChanged`
- Mobile UA for embed: DNR initiator rules + iframe viewport injection (`mobile-ua.js`)

### Changed / 变更

- When **Side panel** embed mode is on: toolbar icon **always opens popup menu** (`launcherMode` forced to `menu`); entries open in side panel iframe
- Embed open path uses **session storage** only (no duplicate message/refresh); side panel list opens embed locally without background round-trip
- `applyLauncherMode("menu")`: disable `openPanelOnActionClick` before restoring popup (fixes toolbar opening side panel instead of menu)
- `background.js`: `SYNC_LAUNCHER`, `shouldSyncLauncherFromSettingsChange`, unified `webNavigation` handler
- `shared.js`: in-memory storage read cache; `shouldHandleStorageUpdate` echo dedup unchanged
- `popout.js`: skip ephemeral `__ctx__:` popouts in `removeStalePopouts`
- `popup.js` / `sidepanel.js`: `boot()` wrapper (no top-level `await`)
- Switching to embed mode closes existing popouts; leaving embed clears embed session and mobile UA rules

### Fixed / 修复

- Settings change to URL/mobile refreshes open embed iframe (`syncOpenEmbedIfChanged`)
- Service worker restart restores embed mobile UA from session
- `fromStart` no longer hides loading spinner mid-load (clear flag after iframe `load`)
- Options/storage: avoid redundant list re-render on theme-only changes; launcher sync only when needed
- Embed session not cleared on unrelated shortcut list updates

### 新增（中文）

- **实验性功能 — 侧栏内嵌：** 设置页「小窗打开方式」可选 **侧栏**，在侧栏 iframe 内打开（默认仍为 **小窗**）
- 设置页 `!` 提示：建议优先小窗，非必要勿选侧栏；说明嵌入限制
- 侧栏列表底部 **使用提示**（分条）：移动/桌面切换、小窗续看、Shift+从头打开
- 内嵌视图：加载指示；`chrome-error://` 时显示「用小窗打开」
- 打开失败行内提示；`sidebar-embed.js` 与 embed 移动 UA

### 变更（中文）

- 侧栏内嵌模式：工具栏固定 **弹出菜单**，入口在侧栏 iframe 打开；session 单通道同步；launcher API 调用顺序修复
- 存储读缓存、SW 恢复 UA、切模式清理小窗/embed；popup/sidepanel 使用 `boot()`

### 修复（中文）

- 改 URL/移动版刷新 embed；`fromStart` loading 竞态；无关 storage 变更误清 embed session

---

## [2.5.3] — 2026-05-19

### Changed / 变更

- Code cleanup: parallel storage reads, debounced session resume writes, consolidated popout/sync handlers
- Fix sync empty `[]` recovering over locally seeded shortcuts

### 变更（中文）

- 代码优化：storage 并行读取、续看 URL 防抖写入、合并小窗/sync 处理逻辑
- 修复 sync 空列表覆盖误写预置

---

## [2.5.2] — 2026-05-19

### Removed / 移除

- Popout in-page home overlay (Chromium popup windows cannot add native title-bar buttons; use side panel Shift+click / right-click instead)

### 移除（中文）

- 小窗页面内注入的主页浮层（popup 小窗无原生自定义标题栏按钮；请用侧栏 Shift+点击或右键「从头打开」）

---

## [2.5.1] — 2026-05-19

### Added / 新增

- Popout overlay: home button (top-right) reloads the shortcut’s configured start URL

### 新增（中文）

- 小窗右上角「主页」按钮：回到该入口在设置中配置的起始网址

---

## [2.5.0] — 2026-05-19

### Added / 新增

- Session resume: after closing a popout, reopening the same shortcut loads the last browsed URL (stored in `chrome.storage.session` until browser quit)
- Shift+click or right-click → **Open start URL** to load the configured address instead

### 新增（中文）

- 关小窗后再点同一入口：本次浏览器会话内恢复上次浏览 URL
- Shift+点击或右键「从头打开」：打开配置的起始网址

---

## [2.4.5] — 2026-05-19

### Fixed / 修复

- Re-clicking a shortcut while its popout is still open focuses the window without reloading the start URL (preserves in-window browsing state)

### 修复（中文）

- 小窗仍打开时再次点击同一入口：仅聚焦小窗，不再重新加载起始 URL，保留当前浏览进度

---

## [2.4.4] — 2026-05-19

### Changed / 变更

- First install: read settings once — write defaults immediately if none (removed 12s settings wait)

### 变更（中文）

- 首次安装：settings 与 shortcuts 一致，读一次无记录即写默认，不再等待 12 秒

---

## [2.4.3] — 2026-05-19

### Changed / 变更

- First install: if sync and local have no shortcuts record, seed presets immediately (no 12s wait); late sync still recovers user data

### 变更（中文）

- 首次安装：sync/local 均无 shortcuts 记录时立即加载预置，不再等待；sync 晚到仍会覆盖误写的预置

---

## [2.4.2] — 2026-05-19

### Fixed / 修复

- First install: treat synced shortcuts key (including empty list) as user data — never seed presets over it

### 修复（中文）

- 首次安装：云端已有 shortcuts 同步记录（含空列表）也视为用户数据，不写入预置

---

## [2.4.1] — 2026-05-19

### Fixed / 修复

- First install: never overwrite user shortcuts — longer sync wait (12s), double-check before seeding, recover from sync if presets were written too early; presets still local-only (never uploaded to sync)

### 修复（中文）

- 首次安装：强化保护用户已有入口——延长 sync 等待、写入预置前二次校验、若预置写早则 sync 到达后覆盖；预置仍只写 local、不上传 sync

---

## [2.4.0] — 2026-05-19

### Changed / 变更

- Code cleanup: unified install storage keys, merged poll helpers, sync `resolveLoadUrl`
- Opening side panel / popup no longer overwrites launcher mode in settings (only explicit switch buttons do)
- Editing a shortcut’s URL or mobile/desktop mode refreshes its open popout automatically
- Inline edit layout: name + open mode on row 1, full-width URL on row 2
- Toolbar switch button uses short tooltip text

### Fixed / 修复

- First-install storage key reference (v2.3.6)

### 变更（中文）

- 代码精简：安装 storage 键统一、轮询合并、`resolveLoadUrl` 同步化
- 打开侧栏/菜单不再改写设置里的启动模式（仅点击切换按钮时保存）
- 编辑入口的网址或移动/桌面设置后，已打开的小窗自动刷新
- 内联编辑布局：第一行名称+打开方式，第二行网址全宽
- 切换按钮 tooltip 改为简短文案

---

## [2.3.6] — 2026-05-19

### Fixed / 修复

- First install: fix undefined `STORAGE_KEY` when seeding preset shortcuts (install could fail silently)

### 修复（中文）

- 首次安装：修复预置快捷入口写入时 storage 键名未定义，可能导致安装失败

---

## [2.3.5] — 2026-05-19

### Changed / 变更

- Universal mobile/desktop rules only — no per-site URL mapping or special cases
- First install: wait for sync; seed preset shortcuts to **local only** (never overwrite cloud sync)
- Preset shortcuts synced from author's current config (`default-shortcuts.js`)
- Side panel hint: switch mobile/desktop in Settings if a page looks wrong

### Fixed / 修复

- Popup no longer closes when `OPEN_SHORTCUT` returns no response (SW unavailable)
- Removed duplicate comment in `mobile-ua.js`

### 变更（中文）

- 移动/桌面仅通用规则，移除各站点写死逻辑
- 首次安装：等待云端同步；无数据时预置只写 local，不上传 sync，避免覆盖云端
- 预置入口与作者当前配置一致
- 侧栏增加「可切换移动版/桌面版」提示

### 修复（中文）

- 小窗打开无响应时 popup 不再误关
- 清理 `mobile-ua.js` 重复注释

---

## [2.3.4] — 2026-05-19

### Fixed / 修复

- Launcher list: handle failed `OPEN_SHORTCUT` messages; popup no longer closes when open fails
- Launcher mode switch: consume `runtime.lastError`; side panel open failure no longer closes popup
- Background: avoid duplicate `applyLauncherMode` + `updateActionTitle` on settings change; simplify install flow
- Popout tracker: prune stale window entries when counting open popouts
- Context menu: recover register queue after errors
- Mobile viewport inject: outer try/catch; drop redundant `onDOMContentLoaded` listener

### 修复（中文）

- 列表打开小窗失败时不再误关 popup；侧栏切换失败时不再误关 popup
- 设置变更时避免重复同步启动模式；安装流程精简
- 小窗追踪清理失效条目；右键菜单注册队列错误后可继续
- 移动 viewport 注入更稳健，移除重复导航监听

---

## [2.3.3] — 2026-05-19

### Fixed / 修复

- Context menu: serialize registration and remove duplicate `open-in-popout` create calls (fixes `Unchecked runtime.lastError: Cannot create item with duplicate id`)

### 修复（中文）

- 右键菜单：串行注册并避免重复创建 `open-in-popout`（修复 duplicate id 报错）

---

## [2.3.2] — 2026-05-19

### Changed / 变更

- Code cleanup: shared launcher list module, shared theme/launcher CSS, decouple install defaults from `shared.js`
- Removed dead code (`mobilePopoutTabIds`, unused CSS/i18n paths); zip no longer bundles `README.zh-CN.md`

### 变更（中文）

- 代码精简：合并 popup/侧栏列表逻辑，抽取公共 CSS，安装预置数据不再随 `shared.js` 加载到各页面
- 删除无用代码与打包内 README，减小扩展体积

---

## [2.3.1] — 2026-05-19

### Removed / 移除

- **Split screen mode** removed: Edge native in-tab split cannot be created via extension APIs; shortcuts open in **popout windows** again (same as before v2.3.0)
- Dropped `tabs` and `system.display` permissions

### 移除（中文）

- **分屏并排**已移除：Edge 标签页内原生分屏无法通过扩展 API 创建；点击快捷入口恢复为**独立小窗**打开（与 v2.3.0 之前一致）
- 移除 `tabs`、`system.display` 权限

---

## [2.3.0] — 2026-05-19

### Added / 新增

- **Split screen mode**: global setting **Click shortcut → Split screen** resizes the current window to the left half and opens the shortcut URL in a right half window (Edge native in-tab split has no extension API yet)
- New permissions: `tabs`, `system.display`

### 新增（中文）

- **分屏并排**：全局设置「点击快捷入口 → 分屏并排」时，当前窗口缩至左半屏，右半屏打开快捷网址（Edge 标签页内原生分屏暂无扩展 API，以左右并排窗口实现）
- 新增权限：`tabs`、`system.display`

---

## [2.2.14] — 2026-05-19

### Changed / 变更

- First-install default shortcuts now match the author’s curated list (9 entries, order and mobile/desktop flags preserved); data lives in `default-shortcuts.js`

### 变更（中文）

- 首次安装预置入口改为你当前配置的 9 个快捷方式（含顺序与移动/桌面设置），数据维护于 `default-shortcuts.js`

---

## [2.2.13] — 2026-05-19

### Changed / 变更

- Default shortcuts: Xiaohongshu stays **desktop**; Yuque, Douyin, Instagram, TikTok explicitly **mobile**
- On extension update, existing Xiaohongshu shortcuts are migrated to desktop mode (avoids in-app download prompts)

### 变更（中文）

- 预置入口：小红书为**桌面版**；语雀、抖音、Instagram、TikTok 为**移动版**
- 扩展更新时，已保存的小红书入口自动改为桌面版（避免移动 UA 引导下载 App）

---

## [2.2.12] — 2026-05-19

### Added / 新增

- Context menu on web pages: **Open this page in popout** — opens the current tab URL in a popout with the same mobile/desktop rules as saved shortcuts (matched by URL when configured)

### 新增（中文）

- 网页右键菜单：**在小窗中打开此页** — 将当前标签页网址以小窗打开；若已保存同 URL 快捷入口则沿用其移动/桌面设置

---

## [2.2.11] — 2026-05-19

### Added / 新增

- Settings: drag saved shortcuts by the handle to reorder; order syncs to popup and side panel

### 新增（中文）

- 设置页：已保存入口支持拖动手柄上下调整顺序，同步至弹出菜单与侧栏列表

---

## [2.2.10] — 2026-05-19

### Added / 新增

- Xiaohongshu (`xiaohongshu.com`): desktop mode uses a narrow popout (375px) so the responsive web app shows mobile layout without mobile User-Agent spoofing

### 新增（中文）

- 小红书：桌面版 + 窄小窗（375px），由响应式网页自行呈现移动布局，不注入移动 User-Agent

---

## [2.2.9] — 2026-05-19

### Fixed / 修复

- Viewport lock applies only to allowlisted responsive hosts (e.g. WPS Todo), not every mobile shortcut — fixes Xiaohongshu and similar sites showing mobile layout unintentionally
- Default install shortcut for Xiaohongshu opens in desktop mode

### 修复（中文）

- layout viewport 锁定仅作用于白名单响应式站点（如 WPS 待办），不再对所有移动版快捷入口生效，避免小红书等站点误显示移动版
- 首次安装示例中的小红书默认以桌面版打开

---

## [2.2.8] — 2026-05-19

### Fixed / 修复

- Responsive sites (WPS Todo): lock layout viewport to 375px in page context — fixes desktop layout when popout window is wider than mobile breakpoints

### 修复（中文）

- 响应式站点（WPS 待办）：在页面内将 viewport 锁定为 375px，避免小窗外框较宽时仍走桌面布局

---

## [2.2.7] — 2026-05-19

### Fixed / 修复

- Mobile popout: fix UA rules (`declarativeNetRequestWithHostAccess`, `urlFilter`, Client Hints), inject `navigator` shim at `document_start`, reload after load, narrower window (390px)

### 修复（中文）

- 移动版小窗：修正 UA 规则权限与条件，补充 Client Hints / navigator 覆盖，加载后刷新，窗口缩至 390px

---

## [2.2.6] — 2026-05-19

### Fixed / 修复

- Mobile mode: apply mobile User-Agent in popout tabs for responsive sites (e.g. [WPS Todo](https://todo.wps.cn/)) that have no separate mobile host; Bilibili/Weibo still use host mapping

### Changed / 变更

- Permissions: add `declarativeNetRequest` and `<all_urls>` (session-scoped UA rules per popout tab only)

### 修复（中文）

- 移动版小窗：对 WPS 待办等响应式站点注入移动 User-Agent；B 站/微博仍走域名映射

### 变更（中文）

- 权限：新增 `declarativeNetRequest` 与 `<all_urls>`（仅作用于小窗标签页的临时 UA 规则）

---

## [2.2.5] — 2026-05-19

### Added / 新增

- Two switchable launcher modes: **popup menu** (favicon + title) and **side panel list** (existing full list)
- Switch in the popup toolbar, side panel toolbar, or options global settings
- Centralized popout logic in `popout.js` (background service worker)

### Removed / 移除

- Side panel icon-only layout — ineffective due to browser ~360px minimum width

### Changed / 变更

- Default toolbar action: popup menu; switching to side panel mode restores click-to-open side panel

### 新增（中文）

- 两种可切换的启动方式：**弹出菜单**（图标+名称）与**侧栏列表**（原有完整列表）
- 可在弹出菜单、侧栏工具栏或设置页全局设置中切换
- 小窗打开逻辑集中到 `popout.js`

### 移除（中文）

- 侧栏「仅图标」布局（受浏览器最小宽度限制）

### 变更（中文）

- 默认点击工具栏为弹出菜单；切换为侧栏模式后，点击图标打开/关闭侧栏

---

## [2.2.4] — 2026-05-19

### Fixed / 修复

- Options: author name link opens GitHub profile; repository CTA unchanged

### Changed / 变更

- Code cleanup: remove unused left-form edit path, dead exports, duplicate list refresh
- Shared `escapeHtml`; slimmer favicon fallback chain (extension cache + site `/favicon.ico`)
- List rendering uses `DocumentFragment`; default install shortcuts moved to `shared.js`

### 修复（中文）

- 设置页作者「ChakmingLeung」跳转 GitHub 个人主页；仓库链接不变

### 变更（中文）

- 精简代码：移除左侧表单遗留编辑逻辑、未使用 API、重复刷新
- 合并 `escapeHtml`；favicon 仅保留扩展缓存与站点 `/favicon.ico` 回退
- 列表渲染优化；首次安装示例数据集中到 `shared.js`

---

## [2.2.3] — 2026-05-19

### Changed / 变更

- Options layout: add/edit left, saved list right; inline edit in list; import/export on list header
- Import panel: merge/replace only; close via top-right icon
- Author info and version moved to options page title row (right)
- Docs: README, PRD, ARCHITECTURE, MAINTENANCE, `.github/DESCRIPTION.md` synced for v2.2.x

### 变更（中文）

- 设置页左右分栏、列表内联编辑；导入/导出移至「已保存的入口」标题栏
- 导入面板仅保留合并/替换，右上角关闭图标
- 作者信息与版本号移至页面标题行右侧
- 文档：同步 README、PRD、ARCHITECTURE、MAINTENANCE、GitHub 仓库文案

---

## [2.2.2] — 2026-05-19

### Added / 新增

- Options page footer: author info and link to GitHub repository

### 新增（中文）

- 设置页页脚：作者信息与 GitHub 开源仓库链接

---

## [2.2.1] — 2026-05-19

### Added / 新增

- Backup: export/import shortcuts and settings as JSON (for uninstall, reinstall, Edge store)

### 新增（中文）

- 备份与恢复：导出/导入 JSON（卸载、重装、Edge 商店安装后恢复配置）

---

## [2.2.0] — 2026-05-19

### Added / 新增

- Appearance theme: follow system, light, or dark (options + side panel)

### 新增（中文）

- 外观主题：跟随系统 / 浅色 / 深色（设置页与侧栏同步）

---

## [2.1.9] — 2026-05-19

### Changed / 变更

- Removed global “default mobile mode”; new shortcuts default to mobile; per-shortcut mobile/desktop only

### 变更（中文）

- 移除全局「默认移动版」开关；新建入口默认移动版；仅在编辑单条时选择移动版/桌面版

---

## [2.1.8] — 2026-05-19

### Fixed / 修复

- Shortcut icons: add `favicon` permission so Chrome `/_favicon/` works like the bookmark bar; chain fallbacks on load failure

### 修复（中文）

- 快捷方式图标：声明 `favicon` 权限，使用与书签栏相同的 Chrome 站点图标缓存；加载失败时依次回退

---

## [2.1.7] — 2026-05-19

### Added / 新增

- First-run hint: pin extension to toolbar (side panel, options, README)

### 新增（中文）

- 首次使用说明：建议将扩展固定到工具栏（Pin），侧栏与文档同步更新

---

## [2.1.6] — 2026-05-19

### Fixed / 修复

- Release CI: create `dist/stage` before `cp` (fixes exit code 1); publish release via `gh` CLI with `--clobber` for retries

### 修复（中文）

- 修复 Release 打包目录未创建导致失败；发布步骤改用 `gh release` 支持重复上传

---

## [2.1.5] — 2026-05-19

### Fixed / 修复

- CI: `checkout@v6`, `action-gh-release@v3`, Node 24 env; fix zip paths; add `workflow_dispatch`
- Re-run on old tags still uses old workflow — push a new `v*` tag to release

### 修复（中文）

- 修复 Release 工作流；旧标签 Re-run 不会更新 workflow，请使用新标签 `v2.1.5` 或 Actions 手动运行

---

## [2.1.4] — 2026-05-19

### Added / 新增

- `scripts/pack-extension.ps1` and GitHub Actions **Release** workflow: tag `v*` uploads installable `.zip`
- README: install from [Releases](https://github.com/ChakmingLeung/Side-Shortcuts-Popout/releases) (load unpacked)

### 新增（中文）

- 支持打 Release 安装包 zip，用户下载解压后「加载解压缩的扩展」即可使用

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
