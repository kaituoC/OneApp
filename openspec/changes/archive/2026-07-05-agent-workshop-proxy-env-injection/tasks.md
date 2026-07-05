## 1. 代理配置模型

- [x] 1.1 在 `agentWorkshopHelper.js` 中新增 Agent Workshop 代理 store key、默认代理配置、归一化、校验和环境派生 helper
- [x] 1.2 为有效代理 URL、无效代理 URL、关闭状态、启用 env 注入和关闭时清理 env 增加单元测试

## 2. 主进程集成

- [x] 2.1 更新 `runAgent`，支持显式传入子进程 `env`，并保持 timeout、取消、截断和 detached process 行为不变
- [x] 2.2 更新 Agent Workshop IPC 配置 get / set handler，支持读取、校验、持久化和返回代理配置
- [x] 2.3 在 `agent-discussion:start` 的正式研讨调用中应用派生后的代理环境
- [x] 2.4 新增窄口径 connection-test IPC handler，使用已解析 agent 路径、adapter 参数、repo cwd 和同一套代理环境派生逻辑，并且不写入研讨记录

## 3. 渲染进程集成

- [x] 3.1 通过 `preload.cjs` 暴露 connection-test IPC 方法，不新增通用 channel 或命令执行 API
- [x] 3.2 在 `AgentWorkshopTab.vue` 中新增紧凑的“网络 / 代理”配置区，包含启用开关、代理 URL 输入、可选 `ALL_PROXY` 开关、校验反馈和持久化
- [x] 3.3 新增 per-agent “测试连接”控件和结果展示，并确保它不改变 agent ready 状态或 discussion timeline 记录
- [x] 3.4 确保研讨运行时代理控件与现有 repository、agent、moderator、prompt 和 detection 控件一样被冻结

## 4. 验证

- [x] 4.1 新增或更新测试，覆盖 start validation 和 readiness 行为，确保连接测试结果不替代登录态检测
- [x] 4.2 新增测试或聚焦断言，证明代理 env 集成后 Codex 和 ClaudeCode adapter 参数仍保持 read-only
- [x] 4.3 运行 Agent Workshop 聚焦测试
- [x] 4.4 运行 `npm test`
- [x] 4.5 运行 `npm run build`
- [x] 4.6 在环境允许时执行本地 UI smoke test，覆盖代理保存 / 关闭和连接测试反馈
