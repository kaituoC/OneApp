## 背景

Agent 研讨室当前通过主进程检测本地 Codex / ClaudeCode CLI，并在研讨时用 `runner.js` spawn 子进程执行只读调用。Dock 启动的 Electron 主进程不会继承用户终端 shell 中的代理变量，因此 `runAgent` 不显式传 `env` 时，子进程只能继承 launchd 的最小环境，可能无法访问 OpenAI 或 Anthropic 服务。

现有检测链路已经区分安装、版本和登录态，并且 UI 使用 `loggedIn` 派生可选 agent。当前机器验证显示新版 ClaudeCode 的 `claude auth status` 可正常返回登录 JSON，因此本次设计不把登录态检测替换成最小实调；最小实调只作为用户按需触发的连接测试，避免自动检测消耗服务用量。

## 目标 / 非目标

**目标：**

- 让用户在 Agent 研讨室内配置一套全局代理，并持久化到 `agentWorkshop.*` 配置命名空间。
- 让正式研讨调用和按需连接测试共享同一套代理 env 派生逻辑，避免“测试与真实调用环境不一致”。
- 保留现有安装与登录态检测语义，不让自动重新检测触发模型调用或消耗服务用量。
- 保持 Codex read-only sandbox、ClaudeCode plan 模式与只读工具白名单不变。
- 在用户停用代理时，能够明确不向子进程注入代理，并避免从 Electron 主进程环境意外继承代理变量。

**非目标：**

- 不做自定义 provider、base URL、API token、模型 profile 或 per-agent 环境变量管理。
- 不存储敏感 token，不引入系统钥匙串或加密凭证管理。
- 不改变 Agent Workshop 三阶段编排、讨论记录 JSON 格式、Markdown 导出格式或 Git advisory 行为。
- 不支持 Windows 上的 Agent Workshop CLI 检测与进程组管理，本次沿用现有平台门控。

## 决策

### 代理配置采用专用数据结构，而不是通用 env 编辑器

新增 `proxyConfig` 一类专用配置，建议字段为 `enabled`、`url`、`applyHttp`、`applyHttps`、`applyAll`。渲染层负责基础输入体验，主进程在读取后再次校验并派生环境变量。

选择专用结构的原因是代理地址通常不是敏感凭证，安全边界清晰；通用 env 编辑器很容易把 token、base URL 和 provider profile 一起引入，需要掩码、加密存储、导出防泄露和更复杂的 UI。自定义 provider 可以作为后续独立 change。

### 登录态检测与连接测试分离

`agent-discussion:check-agents` 继续检测安装、版本和登录态；Codex 仍以 `codex login status` 退出码判断，ClaudeCode 仍解析 `claude auth status` 的 `loggedIn`。新增 `agent-discussion:test-agent-connection` 或同等窄接口，由用户按需触发带代理的最小实调。

这样 UI 的 ready 状态仍代表“本地 CLI 已安装并已登录”，连接测试状态只代表“当前代理配置下是否能完成真实连通”。这能避免打开页面或重新检测时自动消耗 agent 服务用量。

### 用共享 helper 派生子进程环境

在纯逻辑层新增代理配置默认值、校验、归一化和 `buildAgentEnvironment(baseEnv, proxyConfig)`。主进程正式调用和连接测试都调用同一 helper。正式调用传入 `process.env` 作为 base env，再合并或清理代理变量后交给 `spawn` / `execFile`。

当 `enabled` 为 true 且 URL 合法时，按配置写入 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 以及对应小写变量。默认启用 `HTTP_PROXY` / `HTTPS_PROXY`，`ALL_PROXY` 作为可选项。当 `enabled` 为 false 时，从子进程 env 中移除常见代理变量，避免开发模式下从终端启动时仍意外继承代理。

### runner 显式接受 env

`runAgent` 增加可选 `env` 参数，并在 `spawn(command, args, { cwd, shell:false, detached:true, env })` 中显式传入。调用方负责构造 env；runner 不读取 store，也不理解代理配置，继续保持单次进程执行器职责。

### 连接测试使用真实 adapter 参数但降低副作用

连接测试应复用已解析的 CLI 路径、repoDir 和代理 env。测试 prompt 采用极短文本，并走与正式调用相同的 adapter 只读参数：Codex 使用 read-only exec；ClaudeCode 使用 print + plan + read-only tools。连接测试结果不写入讨论记录，只在配置区显示最近一次测试结果和错误摘要。

## 风险 / 取舍

- 代理 URL 配错会导致所有 agent 调用失败 → 在 UI 中提供清晰的“测试连接”按钮和错误摘要；正式调用失败仍沿用现有失败消息保存。
- 停用代理时清理继承代理变量可能改变从终端启动开发模式下的行为 → 这是有意设计，保证“关闭代理”语义明确；用户可重新启用代理配置。
- 连接测试会真实调用 CLI，可能消耗少量服务用量 → 只做手动触发，并在按钮文案或提示中说明它会真实调用本地 CLI。
- ClaudeCode / Codex CLI 的登录态命令未来可能变化 → 保持检测失败时降级为 logged-out，并将错误写入 availability；连接测试作为辅助诊断，不作为 ready 的唯一依据。

## 迁移计划

- 新增配置默认值为空且 `enabled: false`，现有用户升级后行为不变。
- 旧的 `availability` 缓存仍可读取；代理配置变更后用户可手动重新检测或测试连接。
- 若需要回滚，移除 UI、IPC、helper 和 runner env 传参后，electron-store 中遗留的代理配置键不会影响旧逻辑。

## 待确认问题

- `ALL_PROXY` 默认是否启用：建议先默认关闭，仅在用户明确勾选时写入。
- 连接测试是否支持“全部 agent 一键测试”：建议 Phase 0 先支持单 agent 测试，避免一次点击触发多次真实调用。
