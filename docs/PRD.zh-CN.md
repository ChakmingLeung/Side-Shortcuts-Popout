# 产品需求文档（PRD）

**语言：** [简体中文](PRD.zh-CN.md) · [English](PRD.md)

## 侧栏快捷小窗浏览器扩展

| 属性 | 内容 |
|------|------|
| 文档版本 | v2.2.3 |
| 产品版本 | 2.2.3 |
| 最后更新 | 2026-05-19 |
| 状态 | 已发布（开源） |
| 目标平台 | Microsoft Edge 114+、Google Chrome 114+ |

---

## 1. 背景与问题

### 1.1 行业变化：Edge 侧栏能力收缩

Microsoft 正在简化 Edge，并[逐步下线内置侧边栏 App Tower](https://support.microsoft.com/en-US/edge/streamline-access-to-your-favorite-sites-and-apps-with-sidebar-in-microsoft-edge)（在侧栏固定常用网站与应用入口的能力）。许多用户已习惯：

- 主窗口继续办公、学习或处理文档；
- 侧栏保留一列常用站点的入口，需要时一点即开。

内置能力移除后，**浏览器不再提供可配置的「侧栏快捷站点列表」**，用户需要自行找回同等效率。

### 1.2 用户痛点

| 痛点 | 说明 |
|------|------|
| 习惯断裂 | 失去侧栏一键直达常用站的方式，只能反复开新标签或翻书签 |
| 并排浏览难 | 希望「主窗口 + 旁边一个小窗」看资讯/社交，又不想占满主窗口标签栏 |
| 登录与嵌入 | 若在侧栏用 iframe 嵌网页，Cookie 与标签页不一致，且大量站点禁止被嵌入（见 §1.4） |
| 配置易丢 | 卸载扩展会清除 `chrome.storage`；换机或重装需自行备份 JSON |

### 1.3 产品定位

本扩展使用 Chromium 原生 **[Side Panel（侧边栏）](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)** API，在**扩展自己的侧栏页**中纵向展示用户配置的快捷入口；**点击后在独立小窗（popout）中打开目标网址**，与主窗口并排使用。

- **侧栏**：只负责「看列表、点一下」——轻量、不占主标签。
- **小窗**：在完整浏览器环境中打开站点，登录、扫码、支付与常规标签页行为一致。

这是在 Edge 下线 App Tower 之后，用扩展能力补回「侧栏快捷入口 + 快速开小窗」体验的可行方案。

### 1.4 设计取舍（为何不用 iframe）

v1.x 曾尝试在侧栏内 iframe 预览网页；因扩展侧栏只能加载扩展页面、外站必须套 iframe，带来 Cookie 隔离、`X-Frame-Options` 拦截、权限膨胀等问题，**自 v2.0.0 起已放弃**。当前方案为「侧栏列表 + 点击小窗」，详见 [README.zh-CN.md](../README.zh-CN.md) 中说明。

---

## 2. 产品目标

### 2.1 产品愿景

在 Edge 移除内置侧栏快捷能力后，让用户仍能**从浏览器侧栏快速打开常用网站的小窗**，与主窗口并排浏览，配置简单、数据留在本地。

### 2.2 核心目标

| 目标 | 说明 |
|------|------|
| **补回侧栏快捷入口** | 用户可自定义名称与 URL，在侧栏纵向浏览、一键打开 |
| **小窗并排浏览** | 点击后在独立 popout 窗口打开，不挤占主窗口标签；可开多个小窗 |
| **行为可预期** | 存储的 URL 始终为用户填写内容；打开时按规则解析（如白名单移动版），不静默改配置 |
| **轻量可维护** | 无后端、无遥测；权限限于 `storage`、`sidePanel`、`favicon` |
| **可迁移配置** | 支持 JSON 导出/导入；可选 `chrome.storage.sync` 同账号同步 |

### 2.3 非目标

- 替代 Edge Copilot 或系统级侧栏应用商店
- 在侧栏内嵌完整网页预览（iframe 方案，已废弃）
- 代替手机端原生 App 或完整桌面浏览器
- 自动爬取、推荐或同步用户浏览历史

### 2.4 成功标准（定性）

- 用户能在 1 分钟内完成「添加入口 → 侧栏出现 → 点击开小窗」闭环
- 常用需登录站点（如 B 站、微博、小红书等）在小窗内登录体验与标签页一致
- 卸载前有明确路径导出配置；重装后可恢复列表

---

## 3. 目标用户与典型场景

| 用户 | 场景 |
|------|------|
| 原 Edge App Tower 用户 | 侧栏保留微博、B 站、资讯等入口，主窗口继续办公 |
| 多任务办公者 | 主屏文档/表格，侧栏一点开小窗刷动态，关窗即收 |
| 多设备用户 | 同 Chrome/Edge 账号下 sync 同步快捷列表（未卸载前提下） |

---

## 4. 用户故事（节选）

| ID | 故事 | 验收标准 |
|----|------|----------|
| US-01 | 配置快捷入口 | 在设置页添加名称与 URL，侧栏立即显示，可固定扩展图标打开侧栏 |
| US-02 | 侧栏快速开小窗 | 点击列表项，独立小窗打开 `resolveLoadUrl` 结果，主窗口不受影响 |
| US-03 | 多入口并存 | 可连续打开多个小窗，各自独立关闭 |
| US-07 | 白名单移动版 | B 站、微博等：小窗用 `m.` 域名，存储仍为用户保存的 URL |
| US-08 | 普通站点 | 非白名单按保存的 URL 打开，不做泛化 `www`→`m` |
| US-10 | 列表内编辑 | 「已保存的入口」点编辑就地改，无需滚回左侧表单 |
| US-11 | 备份恢复 | 导出 JSON；卸载重装后导入（合并/替换） |
| US-12 | 外观主题 | 设置页选跟随系统/浅色/深色，侧栏同步 |

---

## 5. 功能需求

### 5.1 侧栏与小窗（核心）

| 规则 | 行为 |
|------|------|
| 侧栏内容 | 仅展示快捷列表、设置入口、favicon；不加载外站 iframe |
| 打开方式 | 点击项 → `window.open` popout，`loadUrl` 由 `resolveLoadUrl()` 计算 |
| 图标 | 使用 `favicon` 权限读取站点图标，失败时回退默认图标 |

### 5.2 移动版规则

| 规则 | 行为 |
|------|------|
| 存储 | 仅保存用户填写的 canonical URL |
| 默认 | 新建 `mobile: true`；`mobile === false` 为桌面版 |
| 白名单 | `shared.js` 中 `HOST_TO_MOBILE`（B 站、微博） |
| 非白名单 | `loadUrl === canonicalUrl`（v2 小窗无 DNR/UA 注入） |
| 禁止 | 泛化 `www.*` → `m.*` |

### 5.3 数据模型

```json
{
  "settings": { "locale": null, "theme": "system" },
  "shortcuts": [
    {
      "id": "uuid",
      "title": "抖音",
      "url": "https://www.douyin.com/jingxuan",
      "mobile": true
    }
  ],
  "lastShortcutId": "uuid"
}
```

`resolveLoadUrl()` 返回 `{ loadUrl, canonicalUrl, mobile, urlTransformed }`。

### 5.4 备份格式

- 导出：`backup.js` 生成 JSON（含 `shortcuts`、`settings`、版本号与时间戳）
- 导入：合并（同 ID 覆盖、新 ID 追加）或替换（清空后导入）
- 入口：选项页「已保存的入口」标题栏；导入时先选模式再选文件

### 5.5 设置页与侧栏

- 全局：语言、外观主题
- 左右分栏：左添加、右列表；宽屏自适应
- 页眉右侧：作者、GitHub 链接、扩展版本
- 侧栏：favicon 图标、设置入口、`storage` 变更时刷新列表

---

## 8. 版本规划（摘要）

| 版本 | 要点 |
|------|------|
| **v2.2.3**（当前） | 设置页布局、内联编辑、导入/导出位置与交互、页眉作者信息 |
| v2.2.1 | JSON 备份导入/导出 |
| v2.2.0 | 外观主题 |
| v2.1.9 | 移除全局移动版开关；新建默认移动版 |
| v2.1.8 | `favicon` 权限与图标回退 |
| v2.0.0 | 放弃 iframe，改为小窗打开 |

详见 [CHANGELOG.md](../CHANGELOG.md)。

---

## 9. 参考资料

- [Edge App Tower 下线说明](https://support.microsoft.com/en-US/edge/streamline-access-to-your-favorite-sites-and-apps-with-sidebar-in-microsoft-edge)
- [chrome.sidePanel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
- [Fetching favicons](https://developer.chrome.com/docs/extensions/how-to/ui/favicons)
