# 侧栏快捷小窗 · Side Shortcuts Popout

**语言 / Language:** [简体中文](README.zh-CN.md) · [English](README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](manifest.json)
[![Chrome 114+](https://img.shields.io/badge/Chrome-114%2B-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
[![Edge 114+](https://img.shields.io/badge/Edge-114%2B-0078D4?logo=microsoftedge&logoColor=white)](https://learn.microsoft.com/microsoft-edge/extensions-chromium/)

在 Microsoft Edge [逐步下线内置侧边栏 App Tower](https://support.microsoft.com/en-US/edge/streamline-access-to-your-favorite-sites-and-apps-with-sidebar-in-microsoft-edge) 的背景下，本扩展通过浏览器原生 **Side Panel（侧边栏）** API，纵向列出可配置的网页快捷入口；**点击即在独立小窗打开**，与主窗口并排浏览，登录态与常规标签页一致。

---

## 功能亮点

| 能力 | 说明 |
|------|------|
| 可配置快捷入口 | 自定义名称、URL；图标自动取自网站 favicon |
| 小窗打开 | 点击后在独立 popout 小窗打开（可多窗并存） |
| 浏览进度 | 小窗仍开着时再点 → 只聚焦、不刷新；关窗后再点 → 本次浏览器会话内恢复上次页面 URL |
| 回到起始页 | **Shift+点击** 或 **右键「从头打开」** → 加载设置里配置的起始网址 |
| 移动 / 桌面 | 每条入口单独选择；移动版用 Android UA + 375px 宽 + viewport 注入 |
| 打开方式 | 工具栏图标可切换 **侧栏列表** 或 **弹出菜单** |
| 外观主题 | 设置页可选跟随系统 / 浅色 / 深色 |
| 备份与恢复 | 导出/导入 JSON 配置 |
| 配置同步 | 登录浏览器账号后，修改可通过 `chrome.storage.sync` 同步 |
| 界面语言 | 简体中文 / English / 跟随浏览器 |

## 环境要求

- **Microsoft Edge 114+** 或 **Google Chrome 114+**

## 安装

### 从源码加载（开发者模式）

1. 克隆或下载本仓库
2. **Edge：** `edge://extensions/` → 开启 **开发人员模式** → **加载解压缩的扩展** → 选择项目根目录（含 `manifest.json`）
3. **Chrome：** `chrome://extensions/` → 开启 **开发者模式** → **加载已解压的扩展程序** → 选择项目根目录
4. 将扩展 **固定到工具栏**，点击图标打开侧栏

> 开发者模式加载时，浏览器可能提示「未经验证的扩展」，属正常现象。

### 首次使用

1. 首次安装预置 9 个常用入口，可在 **选项** 页修改
2. 点击侧栏入口在小窗打开；右上角 **齿轮** 进入设置
3. 卸载或换电脑前，请在选项页 **导出配置** 以便恢复

## 小窗操作

| 操作 | 效果 |
|------|------|
| 普通点击 | 开小窗；关窗后再点尽量恢复上次 URL（同一次浏览器会话） |
| 小窗仍开着时再点 | 只聚焦，不刷新 |
| **Shift+点击** / **右键从头打开** | 加载起始网址 |

## 移动版 / 桌面版

- **存储的 URL** 始终为你填写的内容，扩展不会自动改写
- **移动版**：小窗约 **375px** 宽，Android UA + viewport
- **桌面版**：小窗约 **420px** 宽，原生 UA
- 需要移动站时请填写移动地址（如 `https://m.weibo.cn/`）

## 已知限制

- 小窗受浏览器弹窗策略限制；被拦截时请在站点权限中允许弹窗
- **续看**仅恢复 URL，不保证滚动位置或未提交表单；关闭浏览器后 session 清空
- 扩展无法将小窗设为「总在最前」

## 隐私

仅在本地及可选的浏览器账号同步中存储快捷入口配置，不收集浏览历史或页面内容。

## 许可证

[MIT License](LICENSE) © 2026

## 免责声明

本项目与 Microsoft、Google 无隶属关系。
