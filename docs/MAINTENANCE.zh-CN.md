# 文档维护说明

**语言：** [English](MAINTENANCE.md) · [简体中文](MAINTENANCE.zh-CN.md)

每次修改扩展代码并推送到 GitHub 前，请按本清单执行。

## 自动化脚本

```powershell
# 修改 manifest.json 的 version 后执行：
powershell -ExecutionPolicy Bypass -File .\scripts\sync-doc-version.ps1
```

脚本会将版本号同步到 README、PRD、ARCHITECTURE、`docs/README.md` 中的徽章与版本字段。

## 打包 Release（用户下载 zip）

```powershell
# 本地打包（输出 dist/Side-Shortcuts-Popout-vX.Y.Z.zip）
powershell -ExecutionPolicy Bypass -File .\scripts\pack-extension.ps1

# 推送到 GitHub 并自动发 Release（需先提交并打 tag）
git tag v2.1.5
git push origin v2.1.5
```

推送 `v*` 标签后，GitHub Actions（`.github/workflows/release.yml`）会自动上传 zip 到 [Releases](https://github.com/ChakmingLeung/Side-Shortcuts-Popout/releases)。

**注意：** 在 Actions 里对**旧标签**点「Re-run」仍会用该标签当时的 workflow（例如仍显示 `checkout@v4`）。修复 CI 后请**打新标签**推送，或在 Actions 页选择 **Release → Run workflow**（`workflow_dispatch`）用最新 main 打包。

## 每次发版必做（人工）

1. 更新 `manifest.json` → `"version"`
2. 运行 `scripts/sync-doc-version.ps1`
3. 在 [CHANGELOG.md](../CHANGELOG.md) 新增版本条目（含中英文要点）
4. 若用户可见行为变化，更新中英 README 对应小节
5. 若需求/规则变化，更新 [PRD.zh-CN.md](PRD.zh-CN.md) / [PRD.md](PRD.md)
6. 若模块或流程变化，更新 [ARCHITECTURE.zh-CN.md](ARCHITECTURE.zh-CN.md) / [ARCHITECTURE.md](ARCHITECTURE.md)
7. 打 tag `vX.Y.Z` 并推送，生成 GitHub Release 安装包

## Cursor 自动提醒

项目已配置 `.cursor/rules/github-docs-sync.mdc`（**始终生效**）。在本仓库用 Cursor 改代码时，Agent 应在同一任务内同步文档。

## 改动对照表

| 代码改动 | 需更新的文档 |
|----------|----------------|
| `manifest.json` 权限 | README 环境要求、ARCHITECTURE 权限、CHANGELOG |
| `shared.js` 移动版白名单 | ARCHITECTURE、README 移动版说明、PRD、CHANGELOG |
| `sidepanel` / `options` 界面 | README 功能说明、PRD、截图说明 |
| 仅 Bug 修复 | CHANGELOG + 版本号 |

## 提交信息建议

```
fix(mobile): 简短说明

- CHANGELOG: vX.Y.Z
- docs: 同步 README/PRD/ARCHITECTURE 中英文
```
