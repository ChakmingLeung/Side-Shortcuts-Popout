# 侧栏快捷小窗 · Side Shortcuts Popout

**语言 / Language:** [简体中文](README.zh-CN.md) · [English](README.md)  
**更新日志 / Changelog:** [CHANGELOG.md](CHANGELOG.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](manifest.json)
[![Chrome 114+](https://img.shields.io/badge/Chrome-114%2B-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
[![Edge 114+](https://img.shields.io/badge/Edge-114%2B-0078D4?logo=microsoftedge&logoColor=white)](https://learn.microsoft.com/microsoft-edge/extensions-chromium/)
[![Version](https://img.shields.io/badge/version-2.6.0-blue.svg)](CHANGELOG.md)

在 Microsoft Edge [逐步下线内置侧边栏 App Tower](https://support.microsoft.com/en-US/edge/streamline-access-to-your-favorite-sites-and-apps-with-sidebar-in-microsoft-edge) 的背景下，本扩展通过浏览器原生 **Side Panel（侧边栏）** API，纵向列出可配置的网页快捷入口；**点击即在独立小窗打开**，与主窗口并排浏览，登录态与常规标签页一致。

## ✨ 功能亮点

| 能力 | 说明 |
|------|------|
| 可配置快捷入口 | 自定义名称、URL；图标自动取自网站 favicon |
| 小窗打开 | 点击后在独立 popout 小窗打开（可多窗并存） |
| 浏览进度 | 小窗仍开着时再点 → 只聚焦、不刷新；关窗后再点 → 本次浏览器会话内恢复上次页面 URL |
| 回到起始页 | **Shift+点击** 或 **右键「从头打开」** → 加载设置里配置的起始网址 |
| 移动 / 桌面 | 每条入口单独选择；移动版用 Android UA + 375px 宽 + viewport 注入 |
| 点击工具栏图标 | 可切换 **侧栏列表** 或 **弹出菜单** |
| 打开方式 | 默认 **小窗**（推荐）；**不建议**日常使用实验性 **侧栏打开网页** |
| 外观主题 | 设置页可选跟随系统 / 浅色 / 深色 |
| 备份与恢复 | 导出/导入 JSON 配置 |
| 配置同步 | 登录浏览器账号后，修改可通过 `chrome.storage.sync` 同步 |
| 界面语言 | 简体中文 / English / 跟随浏览器 |

## 💻 环境要求

- **Microsoft Edge 114+** 或 **Google Chrome 114+**

## 📥 安装

### 方式一：Edge 加载项商店（推荐）

1. 打开 [Edge 加载项 · Side Shortcuts Popout](https://microsoftedge.microsoft.com/addons/detail/ongipjlogkkpiolghmglnjjkjaddbgoa)
2. 点击 **获取** / **添加扩展**
3. 将扩展 **固定到工具栏**，点击图标打开侧栏

### 方式二：下载 Release（zip）

1. 打开 [GitHub Releases](https://github.com/ChakmingLeung/Side-Shortcuts-Popout/releases)
2. 下载最新版 **`Side-Shortcuts-Popout-v*.zip`**
3. 解压到任意文件夹（根目录应含 `manifest.json`）
4. **Edge：** `edge://extensions/` → **开发人员模式** → **加载解压缩的扩展** → 选中解压后的文件夹  
   **Chrome：** `chrome://extensions/` → **开发者模式** → **加载已解压的扩展程序** → 选中解压后的文件夹

> 从 Release 或源码加载时，浏览器可能提示「未经验证的扩展」，属正常现象。

### 首次使用

1. 首次安装预置 9 个常用入口，可在 **选项** 页修改
2. 点击侧栏入口在小窗打开；右上角 **齿轮** 进入设置
3. 卸载或换电脑前，请在选项页 **导出配置** 以便恢复

## 🖱️ 小窗操作

| 操作 | 效果 |
|------|------|
| 普通点击 | 开小窗；关窗后再点尽量恢复上次 URL（同一次浏览器会话） |
| 小窗仍开着时再点 | 只聚焦，不刷新 |
| **Shift+点击** / **右键从头打开** | 加载起始网址 |

侧栏列表底部有 **使用提示**（移动/桌面、续看、从头打开）。若设置里选了 **侧栏打开网页**，弹出菜单点入口会在侧栏 iframe 打开，工具栏图标固定为弹出菜单。

## 🧪 侧栏打开网页（实验性，v2.6.0）

> [!WARNING]
> **不建议使用。** 此为实验功能，受浏览器 API 与站点策略限制，**异常概率高、体验不稳定**；请保持默认 **小窗**。仅在确有需要时短期尝试，出现问题请立即改回小窗。v1.x 曾因同类问题在 v2.0.0 放弃默认 iframe，主路径一直是「侧栏快捷列表 + 点击开小窗」。

- 设置 → **打开方式** → **侧栏**：从工具栏 **弹出菜单** 点入口后，在侧栏全屏 iframe 浏览（开启后工具栏固定为弹出菜单）
- 设置页 `!` 有相同说明；打开失败时可 **用小窗打开**；该模式**无**小窗式 URL 续看

| 限制 | 说明 |
|------|------|
| **扩展 API** | [Side Panel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel) 只能加载扩展自己的页面（如 `sidepanel.html`），**不能**把侧栏直接设为 `https://…`；外站只能再套一层 **iframe**。 |
| **Cookie / 登录隔离** | 侧栏 iframe 与常规标签页的 Cookie **分区不同**，常出现「标签页已登录、侧栏未登录」或扫码失败；靠注入 Cookie 等补丁脆弱且需额外权限。 |
| **站点禁止嵌入** | 大量站点通过 `X-Frame-Options`、CSP `frame-ancestors` 等 **拒绝被 iframe 加载**；即使用 `declarativeNetRequest` 改响应头，仍可能被前端脚本检测 `window.top !== window.self` 而禁用登录/二维码。 |
| **与 Edge 内置侧栏不同** | 旧版 Edge 侧栏由浏览器在 **独立顶层浏览上下文** 中打开网页，Cookie 与登录与正常窗口一致；**扩展 iframe 方案无法等价复现**。 |
| **维护与权限成本** | 为少数可嵌站点维护白名单、移动 UA、去响应头、Cookie 同步等，权限面大（`<all_urls>`、`cookies`、DNR），仍难覆盖小红书等强登录场景。 |

## 📱 移动版 / 桌面版

- **存储的 URL** 始终为你填写的内容，扩展不会自动改写
- **移动版**：小窗约 **375px** 宽，Android UA + viewport
- **桌面版**：小窗约 **420px** 宽，原生 UA
- 需要移动站时请填写移动地址（如 `https://m.weibo.cn/`）

## ⚠️ 已知限制

- 小窗受浏览器弹窗策略限制；被拦截时请在站点权限中允许弹窗
- **续看**仅恢复 URL，不保证滚动位置或未提交表单；关闭浏览器后 session 清空
- 扩展无法将小窗设为「总在最前」

## 🔒 隐私

仅在本地及可选的浏览器账号同步中存储快捷入口配置，不收集浏览历史或页面内容。

## 📄 许可证

[MIT License](LICENSE) © 2026

## ℹ️ 免责声明

本项目与 Microsoft、Google 无隶属关系。
