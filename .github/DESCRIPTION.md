# GitHub 仓库文案（复制到 About / 商店说明）

> 本文件供维护者在 GitHub 仓库 **About → Description**、Topics、Release 摘要等处粘贴使用。  
> 产品说明以 [README.zh-CN.md](../README.zh-CN.md) / [README.md](../README.md) 为准。

---

## 仓库 Description（建议，≤350 字符）

**中文：**

```
侧栏快捷小窗：Chrome/Edge 侧栏纵向快捷入口，点击独立小窗并排浏览。Side Shortcuts Popout · MV3 · MIT
```

**English：**

```
侧栏快捷小窗 / Side Shortcuts Popout — side panel shortcuts, popout on click. Chrome/Edge MV3 · MIT
```

---

## Topics（建议标签）

```
chrome-extension
edge-extension
manifest-v3
side-panel
browser-extension
productivity
chromium
```

---

## 扩展简短说明（Chrome Web Store / Edge Add-ons，可选）

**中文（约 80 字）：**

在浏览器侧边栏管理常用网站快捷方式，点击即在独立小窗打开，登录与主窗口标签一致。可同步配置、支持移动版白名单。不使用侧栏内 iframe 预览。

**English:**

Manage favorite sites in the side panel; click to open a popout with normal login and cookies. Synced shortcuts, optional mobile URLs. No in-panel iframe preview.

---

## Release 摘要模板（v2.0.0）

**中文：**

v2.0 放弃侧栏 iframe 内嵌预览，改为快捷列表 + 小窗打开，以解决登录态、扫码与站点反嵌套等问题；权限精简为 `storage` + `sidePanel`。

**English:**

v2.0 removes in-panel iframe preview in favor of a shortcut list + popout windows, fixing login/cookie/frame issues; permissions reduced to `storage` + `sidePanel`.
