# 产品需求文档（PRD）

**语言：** [简体中文](PRD.zh-CN.md) · [English](PRD.md)

## 侧栏快捷小窗浏览器扩展

| 属性 | 内容 |
|------|------|
| 文档版本 | v2.0.0 |
| 产品版本 | 2.0.0 |
| 最后更新 | 2026-05-19 |
| 状态 | 已发布（开源） |
| 目标平台 | Microsoft Edge 114+、Google Chrome 114+ |

---

## 1. 背景与问题

### 1.2 用户痛点

| 痛点 | 描述 |
|------|------|
| iframe 登录/嵌入 | 侧栏内嵌与标签页 Cookie 不一致，部分站禁止嵌入 |
| **地址被误改（v1.1.0）** | 泛化 `www`→`m` 导致 Outlook 等无法访问（已修复） |

### 1.3 产品机会

**Side Panel 快捷列表** + **小窗打开（顶层浏览）** + **白名单移动域名**，且**不修改存储中的 URL**。

---

## 2. 产品目标

1. `shortcuts[].url` **始终为用户配置的原始地址**
2. 侧栏纵向列表；点击小窗打开
3. 移动版：白名单转 `m.` 域名；其余原 URL
4. 配置同步，零服务端

---

## 4. 用户故事（节选）

| ID | 故事 | 验收标准 |
|----|------|----------|
| US-07 | 抖音移动版 | 侧栏加载 `m.douyin.com`；存储仍为 `www.douyin.com` |
| US-08 | Office 正常访问 | 不自动 `m.` 改写 |
| US-09 | 设置页展示 | 列表显示原始 URL；可选「侧边栏加载」提示 |

---

## 5. 功能需求

### 5.1 移动版规则（v1.1.1）

| 规则 | 行为 |
|------|------|
| 存储 | 仅保存用户填写的 canonical URL |
| 白名单 | `shared.js` 中 `HOST_TO_MOBILE`（抖音、B 站、微博等） |
| 非白名单 | `loadUrl === canonicalUrl`，仅 DNR 注入移动 UA |
| 禁止 | 泛化 `www.*` → `m.*`（已在 v1.1.1 移除） |

### 5.2 数据模型

```json
{
  "settings": { "locale": null },
  "shortcuts": [
    {
      "id": "uuid",
      "title": "抖音",
      "url": "https://www.douyin.com/jingxuan",
      "mobile": true
    }
  ]
}
```

`resolveLoadUrl()` 返回 `{ loadUrl, canonicalUrl, mobile, urlTransformed }`。

---

## 8. 版本规划

### v1.1.1（当前）

- 修复移动版误改用户 URL
- 仅白名单域名转换
- DNR 按实际加载主机名匹配
- 设置页展示原始地址

### v1.1.0

- 移动版 WAP、UA 注入、单入口开关

### v1.0.0

- 侧边栏、快捷入口、JSON 导入导出备份、sync

---

## 9. 参考资料

- [Edge App Tower 下线说明](https://support.microsoft.com/en-US/edge/streamline-access-to-your-favorite-sites-and-apps-with-sidebar-in-microsoft-edge)
- [chrome.sidePanel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
