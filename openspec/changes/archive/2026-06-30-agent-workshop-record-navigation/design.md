## Context

Agent 研讨室当前左侧「进度」展示每个阶段、每个 Agent 的状态，右侧 timeline 展示用户输入、Agent 输出、系统消息和最终方案。两侧信息来自同一份 record，但 UI 只把进度当状态展示，没有把它作为长记录目录使用。

现有消息已经包含 `phase`、`agentId`、`type`、`content` 等字段，可以在 renderer 层从 `record.messages` 推导出某一轮、某个 Agent 对应的第一条 timeline 消息。ROADMAP 明确要求不改主进程 IPC、研讨编排、记录持久化格式和 Agent 调用逻辑，因此本设计只在渲染层建立导航映射。

## Goals / Non-Goals

**Goals:**

- 已产生消息的进度 chip 可点击，并滚动到右侧 timeline 中对应消息。
- 定位后目标消息短暂高亮，帮助用户确认跳转位置。
- 没有对应消息的 chip 保持纯状态展示，不显示可点击 affordance。
- 同时支持运行中记录和恢复后的历史记录。
- 保持 Agent Workshop 现有事件流、记录格式和主进程编排不变。

**Non-Goals:**

- 不新增独立目录面板、搜索、当前位置同步或错误消息跳转。
- 不改变 Agent 运行阶段、状态枚举、记录 JSON schema。
- 不把 timeline 分组重构为新的数据模型。

## Decisions

### 1. 使用 `phase + agentId` 推导导航目标

从 `record.messages` 中筛选带有 `phase` 与 `agentId` 的 Agent / moderator 消息，并按消息顺序为每个 `phase:agentId` 保存第一条消息 id。这样可以复用现有 record，不需要主进程在写入记录时维护额外索引。

备选方案是在记录中持久化锚点字段。该方案会引入 schema 迁移和历史记录兼容问题，而当前需求只需要 UI 定位，不值得扩大边界。

### 2. DOM ref 由 message id 管理

timeline 渲染每条消息时，用 message id 注册 DOM ref；点击 chip 时读取目标 message id，调用 `scrollIntoView`。高亮状态使用一个短时 `activeMessageId`，超时后自动清除，并在组件卸载时清理 timer。

备选方案是用 URL hash 或元素 id。桌面 SPA 内没有路由语义，hash 会污染全局状态；DOM ref 更贴合当前单组件结构。

### 3. 可点击状态只来自导航目标是否存在

chip 是否可点击不直接等同于 invocation status。即使状态是 `succeeded`，也要以 timeline 中存在对应消息为准；如果历史记录缺失消息或失败阶段没有输出，就不允许点击。这样可避免用户点击后没有反馈。

## Risks / Trade-offs

- 记录中同一 `phase + agentId` 出现多条消息 → 默认定位到第一条 Agent 输出，保持目录语义稳定。
- timeline DOM 尚未完成更新时点击 → 使用 Vue 已渲染后的 ref，必要时在滚动前等待 next tick。
- CSS 高亮影响现有主题 → 使用现有 theme token 和短时 outline / background，不改变消息布局尺寸。
