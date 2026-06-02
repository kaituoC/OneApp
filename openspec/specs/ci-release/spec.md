# ci-release Specification

## Purpose
TBD - created by archiving change add-ci-multiplatform-release. Update Purpose after archive.
## Requirements
### Requirement: Tag-triggered multi-platform build

系统 SHALL 在推送 `vX.Y.Z` 格式的 git tag 时，通过 GitHub Actions 在 macOS（Intel 与 Apple Silicon）、Windows、Linux 原生 runner 上分别构建对应平台的安装包。单个平台构建失败 SHALL NOT 中止其它平台的构建。

#### Scenario: Push version tag triggers all platforms
- **WHEN** 推送形如 `v1.4.0` 的 tag 到仓库
- **THEN** 在 macOS Intel、macOS Apple Silicon、Windows、Linux 四个 runner 上分别启动构建
- **THEN** 各 runner 产出对应平台安装包（mac: dmg/zip；win: exe/zip；linux: AppImage/deb）

#### Scenario: One platform failure does not abort others
- **WHEN** 某一平台的构建步骤失败
- **THEN** 其余平台的构建继续进行并产出各自产物

#### Scenario: Manual dispatch
- **WHEN** 维护者通过 workflow_dispatch 手动触发该工作流
- **THEN** 工作流按相同矩阵执行构建

### Requirement: Tag and version consistency check

构建前系统 SHALL 校验 git tag 版本与 `package.json` 的 `version` 一致；不一致时 SHALL 使该次发布失败。

#### Scenario: Tag matches package.json version
- **WHEN** tag 为 `v1.4.0` 且 `package.json` 的 version 为 `1.4.0`
- **THEN** 校验通过，构建继续

#### Scenario: Tag mismatches package.json version
- **WHEN** tag 为 `v1.4.0` 但 `package.json` 的 version 为 `1.3.0`
- **THEN** 工作流失败并报告版本不一致，不产出 Release

### Requirement: Unique artifact naming across platforms and architectures

产物命名 SHALL 包含平台与架构标识，确保多平台多架构产物互不撞名。

#### Scenario: Dual macOS architectures do not collide
- **WHEN** 同时构建 macOS x64 与 arm64 包
- **THEN** 两者文件名分别含 `mac-x64` 与 `mac-arm64`，不互相覆盖

#### Scenario: Naming pattern
- **WHEN** 产出任一平台安装包
- **THEN** 文件名形如 `OneApp-<version>-<os>-<arch>.<ext>`

### Requirement: GitHub Release with Chinese notes from CHANGELOG

所有平台构建完成后，系统 SHALL 汇总各平台产物创建一个 GitHub Release 并直接发布；Release notes SHALL 取自 `CHANGELOG.md` 中对应版本的段落。

#### Scenario: Release aggregates all platform artifacts
- **WHEN** 所有平台构建成功
- **THEN** 创建对应该 tag 的 GitHub Release，并上传全部平台产物作为附件

#### Scenario: Notes sourced from CHANGELOG
- **WHEN** CHANGELOG 中存在该版本对应的段落
- **THEN** Release notes 使用该段落的中文内容

#### Scenario: Direct publish
- **WHEN** Release 创建
- **THEN** 其状态为已发布（非 draft、非 prerelease）

### Requirement: Unsigned build configuration

CI 构建 SHALL 在未配置签名证书的情况下成功完成，不因签名探测失败而中止，也不触发 electron-builder 的隐式 publish。

#### Scenario: Build without signing identity
- **WHEN** CI 环境无 macOS 签名证书
- **THEN** 构建关闭自动签名探测并成功产出未签名包

#### Scenario: No implicit publish
- **WHEN** electron-builder 在存在 git tag 的上下文运行
- **THEN** 不触发其隐式 publish（发布仅由专门的 release 步骤负责）

