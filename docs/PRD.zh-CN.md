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

### 1.2 用户痛点

| 痛点 | 描述 |
|------|------|
| iframe 登录/嵌入 | 侧栏内嵌与标签页 Cookie 不一致，部分站禁止嵌入（v2.0 已放弃 iframe） |
| **地址被误改（v1.1.0）** | 泛化 `www`→`m` 导致 Outlook 等无法访问（已修复） |
| 卸载丢配置 | 卸载扩展会清除存储；需用户自行导出 JSON 备份 |

### 1.3 产品机会

**Side Panel 快捷列表** + **小窗打开（顶层浏览）** + **白名单移动域名** + **主题/备份/内联编辑**，且**不修改存储中的 URL**。

---

## 2. 产品目标

1. `shortcuts[].url` **始终为用户配置的原始地址**
2. 侧栏纵向列表；点击小窗打开
3. 新建入口默认移动版；每条可单独选移动版/桌面版
4. 配置本机持久化 + 可选账号 sync；支持 JSON 导入/导出
5. 零服务端、无遥测

---

## 4. 用户故事（节选）

| ID | 故事 | 验收标准 |
|----|------|----------|
| US-02 | 侧栏打开小窗 | 独立小窗加载 `resolveLoadUrl` 结果 |
| US-07 | B 站/微博移动版 | 白名单站点小窗打开 `m.` 地址；存储仍为桌面 URL |
| US-08 | 普通站点 | 非白名单保持用户保存的 URL |
| US-10 | 列表内编辑 | 在「已保存的入口」点编辑就地改，无需滚回左侧表单 |
| US-11 | 备份恢复 | 导出 JSON；卸载重装后导入（合并/替换） |
| US-12 | 外观主题 | 设置页选跟随系统/浅色/深色，侧栏同步 |

---

## 5. 功能需求

### 5.1 移动版规则

| 规则 | 行为 |
|------|------|
| 存储 | 仅保存用户填写的 canonical URL |
| 默认 | 新建 `mobile: true`；`mobile === false` 为桌面版 |
| 白名单 | `shared.js` 中 `HOST_TO_MOBILE`（B 站、微博） |
| 非白名单 | `loadUrl === canonicalUrl`（v2 小窗无 DNR/UA 注入） |
| 禁止 | 泛化 `www.*` → `m.*` |

### 5.2 数据模型

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

### 5.3 备份格式

- 导出：`backup.js` 生成 JSON（含 `shortcuts`、`settings`、版本号与时间戳）
- 导入：合并（同 ID 覆盖、新 ID 追加）或替换（清空后导入）
- 入口：选项页「已保存的入口」标题栏；导入时先选模式再选文件

### 5.4 设置页与侧栏

- 全局：语言、外观主题
- 左右分栏：左添加、右列表；宽屏自适应
- 页眉右侧：作者、GitHub 链接、扩展版本
- 侧栏：favicon 图标、设置入口、storage 同步刷新列表

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
