# 侧栏快捷小窗 · Side Shortcuts Popout

**语言 / Language:** [简体中文](README.zh-CN.md) · [English](README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](manifest.json)
[![Chrome 114+](https://img.shields.io/badge/Chrome-114%2B-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
[![Edge 114+](https://img.shields.io/badge/Edge-114%2B-0078D4?logo=microsoftedge&logoColor=white)](https://learn.microsoft.com/microsoft-edge/extensions-chromium/)
[![Version](https://img.shields.io/badge/version-2.1.4-blue.svg)](CHANGELOG.md)

**仓库地址：** [github.com/ChakmingLeung/Side-Shortcuts-Popout](https://github.com/ChakmingLeung/Side-Shortcuts-Popout)

在 Microsoft Edge [逐步下线内置侧边栏 App Tower](https://support.microsoft.com/en-US/edge/streamline-access-to-your-favorite-sites-and-apps-with-sidebar-in-microsoft-edge) 的背景下，本扩展通过浏览器原生 **Side Panel（侧边栏）** API，纵向列出可配置的网页快捷入口；**点击即在独立小窗打开**，与主窗口并排浏览，登录态与常规标签页一致。

> 产品文档：[PRD（中文）](docs/PRD.zh-CN.md) · [架构（中文）](docs/ARCHITECTURE.zh-CN.md)  
> GitHub 仓库文案模板：[.github/DESCRIPTION.md](.github/DESCRIPTION.md)

---

## 为何不做侧栏内嵌（iframe）预览？

早期版本（v1.x）曾在侧栏里用 **iframe** 嵌套显示目标网页，以便「主窗口 + 侧栏」同时看两个站。实测与平台限制下，该方案**对用户不友好**，自 **v2.0.0** 起已**放弃**，改为「侧栏快捷列表 + 点击小窗打开」。

| 问题 | 说明 |
|------|------|
| **扩展 API 限制** | [Side Panel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel) 只能加载扩展自己的页面（如 `sidepanel.html`），不能把侧栏直接设为 `https://…`，外站只能再套一层 iframe。 |
| **Cookie / 登录隔离** | 侧栏 iframe 与常规标签页的 Cookie **分区不同**（与扩展顶层、CHIPS 等有关），常出现「标签页已登录、侧栏未登录」或扫码失败；靠 DNR 注入 Cookie 等补丁脆弱且需额外权限。 |
| **站点禁止嵌入** | 大量站点通过 `X-Frame-Options`、CSP `frame-ancestors` 等拒绝被 iframe 加载；即使用 `declarativeNetRequest` 改响应头，仍可能被前端脚本检测 `window.top !== window.self` 而禁用登录/二维码。 |
| **与 Edge 内置侧栏差异** | 旧版 Edge 侧栏由浏览器在**独立顶层浏览上下文**中打开网页，Cookie 与登录与正常窗口一致；扩展 iframe 方案无法等价复现。 |
| **维护成本** | 为少数可嵌站点维护白名单、移动 UA、去响应头、Cookie 同步等逻辑，权限面大（`<all_urls>`、`cookies`、DNR），仍无法覆盖小红书等强登录场景。 |

**当前方案：** 侧栏只负责**纵向展示快捷入口**；点击后用 `window.open` 打开**独立小窗**（正常浏览器环境），登录、扫码、支付与标签页行为一致。详见 [CHANGELOG.md](CHANGELOG.md) 中 v2.0.0 说明。

---

## 功能亮点

| 能力 | 说明 |
|------|------|
| 可配置快捷入口 | 自定义名称、URL；图标自动取自网站 favicon |
| 小窗打开 | 点击快捷入口在独立小窗打开（可并存多个） |
| 摸鱼友好 | 主窗口照常办公/学习，侧栏一键开小窗刷小红书、抖音、Ins 等；小窗关了就收，不占主标签 |
| 低调并排 | 侧栏只占一条窄列，不像全屏切站那么显眼；需要时焦点切回主窗口即可 |
| 移动版 (WAP) 默认 | B 站、微博等白名单转 `m.` 域名；其余使用保存的 URL |
| 纵向列表 | 侧栏仅展示快捷入口，无 iframe 内嵌 |
| 地址不被篡改 | 存储的配置 URL 始终为用户填写的原始地址（v1.1.1+） |
| 配置同步 | 使用 `chrome.storage.sync`，同账号多设备可同步 |
| 界面语言 | 侧边栏与设置页支持简体中文 / English / 跟随浏览器 |
| 隐私友好 | 不采集、不上传浏览数据 |

## 截图

| 侧栏快捷列表 | 快捷入口管理 |
|:---:|:---:|
| *待补充* | *待补充* |

## 环境要求

- **Microsoft Edge 114+** 或 **Google Chrome 114+**
- 权限：`storage`、`sidePanel`

## 快速安装

### 方式一：下载 Release（推荐，下载即用）

1. 打开 [Releases](https://github.com/ChakmingLeung/Side-Shortcuts-Popout/releases) 页面
2. 下载最新版的 **`Side-Shortcuts-Popout-v*.zip`**
3. 解压到任意文件夹（解压后该文件夹根目录应能看到 `manifest.json`）
4. **Edge：** 打开 `edge://extensions/` → 开启 **开发人员模式** → **加载解压缩的扩展** → 选中解压后的文件夹  
5. **Chrome：** 打开 `chrome://extensions/` → 开启 **开发者模式** → **加载已解压的扩展程序** → 选中解压后的文件夹  
6. 点击扩展图标，在侧栏中使用

> 说明：此为开发者模式加载，非应用商店安装；浏览器可能提示「未经验证的扩展」，属正常现象。

### 方式二：克隆源码（开发者）

#### Microsoft Edge

1. `git clone https://github.com/ChakmingLeung/Side-Shortcuts-Popout.git`
2. 打开 `edge://extensions/`，开启 **开发人员模式**
3. **加载解压缩的扩展**，选择克隆后的项目根目录
4. 点击扩展图标，或右键 → **在侧边栏中打开**

#### Google Chrome

1. 打开 `chrome://extensions/`，开启 **开发者模式**
2. **加载已解压的扩展程序**，选择克隆后的项目根目录

### 首次使用

1. 预置语雀、小红书、抖音、Instagram、TikTok 示例，可在设置中修改
2. 在 **扩展选项** 添加快捷入口（名称 + 完整 URL）
3. 打开侧边栏，点击入口即可小窗打开
4. 右上角齿轮进入 **扩展选项** 管理列表

## 快捷方式会丢失吗？数据存在哪？

**不会**因为点击扩展管理页的「重新加载」而清空。保存快捷入口时，扩展会写入：

| 存储 | 作用 |
|------|------|
| **`chrome.storage.local`** | 本机持久化；重载、关闭浏览器后仍在 |
| **`chrome.storage.sync`** | 登录 Chrome / Edge 账号并开启同步时，可同步到其他设备 |

在 **扩展选项** 里添加或修改的网址会立即写入上述存储，侧栏打开时自动读取，**无需每次重配**。

**仍会丢失配置的情况：**

- **卸载**扩展（浏览器会删除该扩展的全部数据）
- 在浏览器设置里 **清除扩展数据 / 浏览数据** 并勾选扩展项
- 多台设备若只用 sync、本机从未成功写入时，以已登录且开启同步的账号为准

**建议：** 使用 Chrome 或 Edge **登录账号并开启同步**；开发时尽量用「重新加载」而不是删除后重新「加载已解压的扩展程序」。

## 移动版 (WAP) 说明

默认开启 **「以移动版 (WAP) 打开」**（可在选项页关闭）：

- **B 站、微博等**：移动版开启时小窗打开对应 `m.` 地址
- **不修改**你已保存的配置地址
- 单入口可设：跟随全局 / 始终移动版 / 始终桌面版

## 项目结构

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

## 开发

```powershell
# 可选：重新生成图标
powershell -ExecutionPolicy Bypass -File .\scripts\generate-icons.ps1

# 修改 manifest.json 版本号后 — 同步各文档中的版本
powershell -ExecutionPolicy Bypass -File .\scripts\sync-doc-version.ps1
```

修改代码后在扩展管理页点击 **重新加载**。

**文档同步：** 本项目通过 [AGENTS.md](AGENTS.md) 与 `.cursor/rules/github-docs-sync.mdc` 约束 Cursor 在改代码时同步更新中英文档。详见 [docs/MAINTENANCE.zh-CN.md](docs/MAINTENANCE.zh-CN.md)。

## 更新日志

见 [CHANGELOG.md](CHANGELOG.md)。当前最新：**v2.0.0** — 侧栏为快捷列表，点击默认小窗打开。

## 已知限制

小窗由浏览器弹窗策略管理；若被拦截，请在站点权限中允许弹窗。小窗尺寸固定约 420px 宽，可手动拉大。

## 文档

| 文档 | 说明 |
|------|------|
| [docs/PRD.zh-CN.md](docs/PRD.zh-CN.md) | 产品需求文档（中文） |
| [docs/PRD.md](docs/PRD.md) | Product Requirements (English) |
| [docs/ARCHITECTURE.zh-CN.md](docs/ARCHITECTURE.zh-CN.md) | 技术架构（中文） |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture (English) |
| [CONTRIBUTING.zh-CN.md](CONTRIBUTING.zh-CN.md) | 贡献指南（中文） |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributing (English) |
| [CHANGELOG.md](CHANGELOG.md) | 版本更新记录（中英） |

## 隐私

仅在本地及可选的浏览器账号同步中存储快捷入口配置，不收集浏览历史或页面内容。

## 许可证

[MIT License](LICENSE) © 2026

## 免责声明

本项目与 Microsoft、Google 无隶属关系。Edge 侧边栏变更以 [Microsoft 官方说明](https://support.microsoft.com/en-US/edge/streamline-access-to-your-favorite-sites-and-apps-with-sidebar-in-microsoft-edge) 为准。
