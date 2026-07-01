## Context

OneApp 当前通过 `__APP_VERSION__` 在渲染层展示版本号，设置页“检查更新”只弹出固定 `alert` 文案。渲染层还在 Agent 研讨室首次成本提示中使用原生 `confirm`，这类弹窗没有 OneApp 图标，也绕过了主进程对系统对话框的一致控制。

本变更涉及主进程 IPC、preload 窄接口、设置页 UI 和 Agent 研讨室启动确认，属于跨层变更。目标是先做“检查最新 Release + 一致消息框”，不引入自动更新安装链路。

## Goals / Non-Goals

**Goals:**

- 设置页可以检查 GitHub Releases 最新正式版本，并与当前应用版本比较。
- 统一应用级消息弹窗，默认使用 OneApp 图标，找不到图标时降级为系统默认图标。
- 替换现有渲染层 `alert` 和 Agent 研讨室首次成本提示 `confirm`。
- 保持 preload API 窄接口，不暴露通用 IPC channel。
- 保持 Agent 研讨室主进程编排、只读约束、记录持久化和事件订阅行为不变。

**Non-Goals:**

- 不接入 `electron-updater`。
- 不自动下载、安装、后台检查或提示重启。
- 不做全项目未来所有提示场景的重构。
- 不引入外部账号、凭证或私有 GitHub API token。

## Decisions

1. **由主进程执行 Release 检查**

   设置页通过 preload 调用 `checkForUpdates`，主进程使用公开 GitHub REST endpoint 获取 `repos/kaituoC/OneApp/releases/latest`。这样渲染层不直接关心网络请求细节，也便于后续在主进程统一处理 User-Agent、超时和错误。

   备选方案是在渲染层直接 `fetch` GitHub。实现更少，但会把错误归一化、版本比较和后续下载入口分散在 UI 组件内，不利于测试和复用。

2. **版本比较放在共享 helper 中**

   新增纯函数处理 `vX.Y.Z` / `X.Y.Z` 解析、比较、Release 响应归一化和 notes 摘要截断。主进程和测试使用同一逻辑，UI 只消费结构化结果。

   备选方案是主进程内联字符串比较。成本最低，但语义化版本比较容易被 `1.10.0` 与 `1.9.0` 这类场景误伤。

3. **统一消息框由主进程封装**

   preload 暴露 `showMessageBox(options)`，主进程调用 `dialog.showMessageBox` 并注入图标路径。返回值保留 `response`、`checkboxChecked` 等 Electron 结果，供确认类弹窗判断按钮选择。

   备选方案是在渲染层实现自定义 modal。视觉可控，但无法真正统一系统弹窗图标，也会引入更多可访问性和焦点管理工作。

4. **外部 Release 页面仍复用现有 openExternal**

   有新版时弹窗提供“前往下载”和“稍后”按钮；用户选择前往下载后，渲染层复用现有 `openExternal` 打开 Release URL。主进程不新增专门的打开 Release IPC。

## Risks / Trade-offs

- [Risk] GitHub API 失败、限流或网络不可用会让检查更新失败 → Mitigation：返回结构化错误，设置页用统一弹窗展示可理解提示，不影响应用其他功能。
- [Risk] Release notes 过长导致系统弹窗文案拥挤 → Mitigation：helper 生成摘要，限制长度并保留打开 Release 页面入口。
- [Risk] 图标路径在开发和生产环境不同 → Mitigation：主进程封装 `getMessageBoxIconPath`，依次检查打包资源和开发资源；不可用时不传 icon。
- [Risk] 系统消息框按钮顺序在不同平台观感不同 → Mitigation：显式按钮文案，渲染层只依赖返回的按钮索引。
- [Risk] Agent 研讨室确认迁移影响启动流程 → Mitigation：仅替换确认弹窗实现，保留确认后写入 `costNoticeAccepted` 的现有逻辑。
