## 背景

Agent 研讨室从 Dock 启动时，Electron 主进程不会继承终端 shell 中的代理环境变量，导致 Codex / ClaudeCode CLI 在正式研讨调用中可能无法连接各自服务。用户需要在应用内为研讨室配置代理，并让该配置稳定注入到 agent 子进程，同时不破坏现有登录态检测、只读执行和研讨编排。

## 变更内容

- 在 Agent 研讨室配置区新增“网络 / 代理”配置，支持启用或停用全局代理注入，并配置代理地址。
- 将代理配置持久化到 electron-store，并在主进程侧校验后派生出子进程环境变量。
- 在正式 agent 调用中注入代理环境变量，使 Codex / ClaudeCode 的研讨调用可从 Dock 启动的 OneApp 中稳定走代理。
- 在 Agent 检测区新增按需“测试连接”能力，使用相同代理注入配置执行最小实调，展示连接是否可用。
- 保留现有本地安装与登录态检测语义：`codex login status` 与 `claude auth status` 仍用于判断 agent 是否可选；连接测试不替代登录态检测，避免自动检测阶段消耗服务用量。
- 保持现有只读沙箱、plan-only prompt、Agent Workshop IPC 窄接口、讨论记录格式和三阶段编排不变。

## Capabilities

### New Capabilities

### Modified Capabilities
- `agent-workshop`: Agent 研讨室增加代理配置、代理环境注入和按需连接测试要求，并保持登录态检测与只读执行边界。

## 影响范围

- 主进程模块：`electron/agentWorkshop/runner.js`、`electron/agentWorkshop/detection.js`、`electron/agentWorkshop/ipc.js`
- 渲染进程模块：`src/renderer/components/AgentWorkshopTab.vue`、`src/renderer/utils/agentWorkshopHelper.js`、`preload.cjs`
- 持久化配置：在现有 `agentWorkshop.*` electron-store 命名空间下新增 Agent Workshop 代理配置键
- 测试：补充或更新 Agent Workshop helper、detection / runner、IPC 相关纯逻辑，以及必要的组件相邻行为测试
- 预计不新增 runtime dependency
