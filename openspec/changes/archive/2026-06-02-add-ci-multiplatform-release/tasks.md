## 1. package.json 打包配置

- [x] 1.1 在 `build` 字段新增 `"artifactName": "${productName}-${version}-${os}-${arch}.${ext}"`
- [x] 1.2 mac target 由 runner 决定架构（原生 runner 各出本架构，mac target 不显式配 arch，保持现状）
- [x] 1.3 新增 scripts：`dist:mac`（`npm run build && electron-builder --mac`）、`dist:win`（`--win`）、`dist:linux`（`--linux`）；并修正裸 `dist` 加上 `npm run build` 前置

## 2. GitHub Actions workflow

- [x] 2.1 创建 `.github/workflows/release.yml`，`on: push: tags: ['v*']` + `workflow_dispatch`，顶层 `permissions: contents: write`
- [x] 2.2 `build` job：matrix `macos-13` / `macos-latest` / `windows-latest` / `ubuntu-latest`（`fail-fast: false`），含 `script: dist:mac|win|linux`
- [x] 2.3 build 步骤：checkout → setup-node 20 (cache npm) → `npm ci`
- [x] 2.4 tag/version 校验步骤：tag push 时校验 `${GITHUB_REF_NAME#v}` == `package.json` version，不一致 `exit 1`（workflow_dispatch 跳过）
- [x] 2.5 构建步骤：`npm run ${{ matrix.script }} -- --publish never`，env `CSC_IDENTITY_AUTO_DISCOVERY: false`
- [x] 2.6 upload-artifact：路径 `dist/*.dmg dist/*.zip dist/*.exe dist/*.AppImage dist/*.deb`，`if-no-files-found: error`
- [x] 2.7 `release` job（`needs: build`，仅 tag 推送时运行）：download-artifact（`merge-multiple: true`）
- [x] 2.8 从 `CHANGELOG.md` 提取当前版本段为 notes（awk；提取失败回退空 notes，不中止）
- [x] 2.9 `softprops/action-gh-release@v2` 上传全部产物，`draft: false`、`prerelease: false`、`body_path` 用提取的 notes

## 3. 文档同步

- [x] 3.1 CLAUDE.md「需求开发全流程」第 12 步：Release 改为"确认版本号→打 `vX.Y.Z` tag→push tag 触发 CI 自动三平台构建并发布"
- [x] 3.2 README：更新下载说明与产物命名（`OneApp-X.Y.Z-<os>-<arch>.<ext>`），明确 Windows/Linux 包由 Release 提供（不再仅源码构建）

## 4. 验证

- [x] 4.1 本地核对 `npm run dist:mac` 按新 `artifactName` 产出 `OneApp-1.3.0-mac-x64.dmg/zip`（沙箱外，已验证）
- [x] 4.2 `npm test` 通过（62 passed；唯一失败为预存在的 timeHelper 时区用例，与本次无关）；workflow YAML 语法校验通过
- [ ] 4.3 合并后用 `workflow_dispatch` 手动触发 workflow，在 GitHub 实跑验证三平台构建（仅 build、不创建 Release）；确认无误后正式打 tag 发版
