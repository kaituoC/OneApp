## Why

Agent 研讨室已经可以保存和恢复完整研讨 timeline，但长记录中用户只能从头滚动查找某一轮、某个 Agent 的输出，回看成本随消息数量增长明显上升。ROADMAP 已将“记录导航”列为下一阶段最高优先级，本次改动用左侧现有进度模块补齐轻量目录能力。

## What Changes

- 将左侧「进度」里的已产出消息 Agent chip 变为可点击导航入口。
- 点击 chip 时，右侧「研讨记录」timeline 滚动到对应轮次、对应 Agent 的消息，并短暂高亮目标消息。
- 仅对存在对应消息的 chip 呈现 hover / clickable 状态；`pending`、`running` 或没有消息的 chip 保持状态展示用途。
- 导航映射优先在 renderer 层根据 `phase + agentId` 与消息 DOM 建立，不改变主进程 IPC、研讨编排、记录持久化格式或 Agent 调用逻辑。
- 更新 ROADMAP 中待办优先级，并移除不再计划实现的 Diff 文件夹对比项。

## Capabilities

### New Capabilities

### Modified Capabilities

- `agent-workshop`: 研讨进度区新增对已产出消息的 timeline 定位与高亮要求。

## Impact

- 主要影响 `src/renderer/components/AgentWorkshopTab.vue` 的进度 chip 渲染、timeline message ref 和滚动/高亮状态。
- 可能补充 `src/renderer/utils/agentWorkshopHelper.js` 纯函数，用于从消息列表推导可导航目标，并增加单元测试。
- 不新增 runtime 依赖。
- 不改变 Electron 主进程 IPC、Agent Workshop orchestrator / runner / records、记录 JSON schema 或 CLI 调用参数。
