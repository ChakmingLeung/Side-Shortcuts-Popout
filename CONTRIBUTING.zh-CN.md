# 贡献指南

**语言：** [简体中文](CONTRIBUTING.zh-CN.md) · [English](CONTRIBUTING.md)

感谢你对 **侧栏快捷小窗** 的关注！

## 开始之前

- [docs/PRD.zh-CN.md](docs/PRD.zh-CN.md) — 产品范围
- [docs/ARCHITECTURE.zh-CN.md](docs/ARCHITECTURE.zh-CN.md) — 代码结构
- [docs/MAINTENANCE.zh-CN.md](docs/MAINTENANCE.zh-CN.md) — **每次改代码后的文档同步清单**

## 本地开发

1. Fork 并克隆仓库
2. Edge / Chrome **加载解压缩的扩展**（项目根目录）
3. 修改后点击 **重新加载**
4. 重新打开侧边栏验证

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate-icons.ps1
```

## 提交规范

- 分支：`feature/xxx`、`fix/xxx`
- Commit 示例：
  - `feat: 支持快捷入口拖拽排序`
  - `fix: 移动版切换后未刷新 iframe`
- PR：说明动机、测试步骤；UI 变更请附截图

## Issue 反馈

请包含：浏览器与版本、操作系统、复现步骤、期望 vs 实际、相关 URL（若嵌入失败）。

## 文档

- 用户面向文档请同时更新 **中文**（`*.zh-CN.md`）与 **英文**（`*.md`）版本
- 发版时更新 [CHANGELOG.md](CHANGELOG.md)，版本号与 `manifest.json` 一致
- 行为变更时同步 [docs/PRD.zh-CN.md](docs/PRD.zh-CN.md)、[docs/ARCHITECTURE.zh-CN.md](docs/ARCHITECTURE.zh-CN.md) 等
- README 语言切换：`README.md` ↔ `README.zh-CN.md`

## 代码原则

- Manifest V3，权限最小化
- 避免不必要的构建依赖
- 复用 `shared.js`
- 扩展 UI 文案默认简体中文（`_locales` 国际化可后续补充）

## 许可证

贡献即表示同意以 [MIT License](LICENSE) 发布。
