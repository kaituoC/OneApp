## Why

设置页“检查更新”目前只显示固定的当前版本提示，无法告诉用户是否已有新版本可下载；同时渲染层仍使用原生 `alert/confirm`，视觉与应用图标不统一。这个变更补齐真实 Release 检查，并建立带 OneApp 图标的统一系统弹窗通道。

## What Changes

- 设置页“检查更新”改为请求 `kaituoC/OneApp` 最新 GitHub Release，比较当前 `__APP_VERSION__` 与最新 `tag_name`。
- 检查中禁用按钮并显示 loading 状态；完成后通过统一消息弹窗提示结果。
- 有新版时展示版本号、发布日期、更新说明摘要，并提供打开 Release 页面入口。
- 网络、接口或版本解析失败时展示清晰错误提示。
- 新增主进程统一消息框 IPC，默认注入 OneApp 应用图标，找不到图标时安全降级。
- 替换设置页原生 `alert` 和 Agent 研讨室首次成本提示原生 `confirm`。
- 不接入 `electron-updater`，不自动下载、安装或提示重启。

## Capabilities

### New Capabilities

- `app-update-check-dialogs`: 检查 GitHub Releases 最新版本，并通过统一应用图标系统弹窗展示应用级消息。

### Modified Capabilities

- `agent-workshop`: 首次成本提示从渲染层原生 `confirm` 迁移到统一消息框，保留确认后记忆接受状态的行为。

## Impact

- 主进程：新增应用消息框和 GitHub Release 检查 IPC handler，复用现有 `shell.openExternal` 能力。
- Preload：暴露窄接口给渲染层调用，不开放通用 IPC channel。
- 渲染层：更新 `SettingsTab.vue` 检查更新流程；更新 `AgentWorkshopTab.vue` 成本确认流程。
- 测试：新增更新检查 / 弹窗 helper 或 IPC 行为单测，覆盖版本比较、Release 响应解析和错误状态。
- 发布：新功能，预计 minor 版本。
