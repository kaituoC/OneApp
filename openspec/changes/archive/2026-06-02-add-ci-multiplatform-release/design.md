## Context

OneApp 是 Electron + Vue 3 桌面应用，`package.json` 的 `build` 字段已配置三平台 target（mac dmg/zip、win nsis/zip、linux AppImage/deb），但仓库**无任何 CI**，发布靠本地 `npm run dist`（裸 electron-builder，无 build 前置、无平台细分），实际只产出 macOS x64 包。姊妹项目 CardGodOfWar 已有成熟的 `release.yml`（tag → 三平台 runner → 汇总 Release），是本设计的直接蓝本。

电脑端 git remote 为 `git@github.com:kaituoC/OneApp.git`，具备 GitHub Actions 条件。

## Goals / Non-Goals

**Goals:**
- 打 tag `vX.Y.Z` 自动在原生 runner 上构建 macOS（Intel + Apple Silicon）/ Windows / Linux 安装包并发布 GitHub Release
- 杜绝 tag 与 `package.json` version 不一致的误发
- Release notes 自动取自 CHANGELOG 对应版本段（中文）
- 单平台构建失败不拖垮其它平台

**Non-Goals:**
- 不做代码签名 / 公证（沿用未签名社区构建）
- 不给已发布的 v1.3.0 补 Win/Linux 包（CI 从下个版本生效）
- 不做自动更新（auto-update）/ 增量更新
- 不引入独立 `electron-builder.json`（继续用 `package.json` 的 build 字段）

## Decisions

### 决策 1：原生 runner 矩阵，而非交叉编译
四 runner 并行：`macos-13`(Intel x64) + `macos-latest`(arm64) + `windows-latest` + `ubuntu-latest`，各跑对应 `dist:*` 脚本产本平台包。
- 理由：原生构建最稳，避免交叉编译 native 依赖的坑；`fail-fast: false` 保证单平台失败不影响其它。
- 备选：单 mac runner 交叉出 x64+arm64（被否，交叉编译风险高）。

### 决策 2：`artifactName` 含 `os-arch` 避免撞名
在 `package.json` build 加 `"artifactName": "${productName}-${version}-${os}-${arch}.${ext}"`。
- 理由：双 mac runner 都默认产 `OneApp-X.Y.Z.dmg`，release job `merge-multiple` 下载到同目录会互相覆盖。加 `os-arch` 后名称唯一。
- 用 `${productName}`（OneApp，大写）而非 `${name}`（oneapp）保持品牌一致。
- 副作用：产物命名从 `OneApp-1.3.0.dmg` 变为 `OneApp-X.Y.Z-mac-arm64.dmg` 等，README 下载说明需同步。

### 决策 3：tag/version 一致性校验作为构建门禁
build job 第一步校验：从 `GITHUB_REF_NAME` 去掉前缀 `v` 得到的版本号，必须等于 `package.json` 的 `version`，否则 `exit 1`。
- 理由：防止"改了 tag 忘改 package.json"（或反之）导致产物版本号与 release tag 不符。
- `workflow_dispatch` 手动触发无 tag 上下文时跳过该校验（或要求输入版本）。

### 决策 4：Release notes 取自 CHANGELOG，直接 publish
release job 用 shell 从 `CHANGELOG.md` 提取 `## [X.Y.Z]` 到下一个 `## ` 之间的段落作为 notes，传给 `softprops/action-gh-release`（`draft: false`、`prerelease: false`）。
- 理由：CHANGELOG 维护良好且为中文，契合既有发布习惯；直接 publish 符合用户选择（打完 tag 自动上线）。
- 若 CHANGELOG 无对应版本段，notes 回退为空或简短占位（构建不失败）。

### 决策 5：禁用 electron-builder 隐式 publish 与签名探测
各 `dist:*` 调用加 `-- --publish never`；CI env 设 `CSC_IDENTITY_AUTO_DISCOVERY=false`。
- 理由：electron-builder 检测到 git tag 会尝试隐式 publish，缺 token 会让 job 失败；未配证书时签名探测也会失败。统一关闭，发布只由 release job 负责。

### 决策 6：触发方式 tag push + workflow_dispatch
`on: push: tags: ['v*']` 为主；额外 `workflow_dispatch` 便于手动重跑 / 补发。

### 决策 7：产物目录沿用默认 `dist/`
不引入 `directories.output`，electron-builder 默认输出 `dist/`；workflow 的 upload-artifact 路径对应 `dist/`（`.dmg`/`.zip`/`.exe`/`.AppImage`/`.deb`）。

## Risks / Trade-offs

- **首次三平台构建可能踩平台特有坑**（Linux 缺 `libarchive`/`fpm`、Windows nsis 配置等）→ `fail-fast: false`，逐平台排查；首版可只验证能产物再上线。
- **CHANGELOG 段提取脚本对格式敏感**（依赖 `## [X.Y.Z]` 标题格式）→ 提取失败时回退空 notes 而非中止发布；本仓库 CHANGELOG 已遵循 Keep a Changelog 格式。
- **macOS 未签名包**：用户首次打开需「右键 → 打开」绕过 Gatekeeper → 在 release notes 提示（已是既有做法）。
- **CI 无法在本地完整验证**：workflow 正确性只能 push tag 后在 GitHub 实跑确认 → 可先用一个预发 tag（如 `v1.4.0-rc.1`）试跑，或 `workflow_dispatch` 手动验证后再正式打 tag。
- **Actions 权限**：需仓库允许 Actions 且 `permissions: contents: write`，否则 release 创建失败 → workflow 内显式声明权限。
