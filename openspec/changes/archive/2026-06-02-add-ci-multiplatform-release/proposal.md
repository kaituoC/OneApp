## Why

当前发布完全靠本地手动 `npm run dist`，只产出 macOS 包（dmg/zip），但 README 宣称支持 Windows（NSIS/zip）和 Linux（AppImage/deb），存在落差——非 macOS 用户实际拿不到安装包。手动流程还易漏平台、易打错 tag（版本号与 tag 不一致）。引入 GitHub Actions 在打 tag 时自动多平台构建并发布，消除落差、降低人为失误。

## What Changes

- 新增 `.github/workflows/release.yml`：`push` tag `v*` 或 `workflow_dispatch` 手动触发
- **三平台四 runner 构建矩阵**：`macos-13`(Intel x64) + `macos-latest`(arm64) + `windows-latest` + `ubuntu-latest`，分别产出 dmg/zip、exe/zip、AppImage/deb
- **tag / version 一致性校验**：构建前校验 git tag（`vX.Y.Z`）与 `package.json` 的 version 相符，不一致则 fail
- **汇总发布**：下载各平台产物，创建 GitHub Release 并**直接 publish**；release notes 取自 `CHANGELOG.md` 对应版本段（中文）
- `package.json`：补 `dist:mac` / `dist:win` / `dist:linux` scripts（各含 `npm run build` 前置）；新增 `artifactName: "${productName}-${version}-${os}-${arch}.${ext}"` 避免双架构产物撞名
- 未签名构建：CI 设 `CSC_IDENTITY_AUTO_DISCOVERY=false`，electron-builder 用 `--publish never`
- 文档：CLAUDE.md「需求开发全流程」第 12 步改为"打 tag 触发 CI"；README 下载说明与产物命名同步

## Capabilities

### New Capabilities
- `ci-release`: 打 tag 触发的多平台自动构建与 GitHub Release 发布能力——构建矩阵、tag/version 校验、产物命名、CHANGELOG 中文 notes、直接发布。

### Modified Capabilities
<!-- 无 spec 级能力变更；CLAUDE.md / README 为文档同步，不构成 capability 变更 -->

## Impact

- 新增 `.github/workflows/release.yml`（需仓库 Actions `contents: write` 权限）
- 修改 `package.json`：新增 dist:* scripts 与 `artifactName`
- 修改 `CLAUDE.md`（第 12 步 Release 流程）、`README.md`（下载说明 / 产物命名）
- **产物命名变化**：从 `OneApp-1.3.0.dmg` 变为含平台架构的 `OneApp-X.Y.Z-mac-arm64.dmg` / `-mac-x64.dmg` / `-win-x64.exe` / `-linux-x64.AppImage` 等
- 范围外：v1.3.0 不补 Win/Linux 包，CI 从下一个版本起生效
