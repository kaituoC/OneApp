## ADDED Requirements

### Requirement: Agent 代理配置

Agent 研讨室 SHALL 允许用户为本地 agent CLI 调用配置一套全局代理，将该配置持久化到本地，并默认保持代理注入关闭。

#### Scenario: 代理配置默认关闭
- **WHEN** 用户打开 Agent 研讨室且不存在已保存的代理配置
- **THEN** 系统显示代理注入为关闭状态，并且不向 agent 子进程注入代理变量

#### Scenario: 保存有效代理配置
- **WHEN** 用户启用代理注入并输入有效的 HTTP 或 HTTPS 代理 URL
- **THEN** 系统将代理配置保存到 Agent Workshop 配置命名空间

#### Scenario: 拒绝无效代理配置
- **WHEN** 用户在启用代理注入时输入无效的代理 URL
- **THEN** 系统阻止保存或使用该无效代理配置，并显示校验提示

#### Scenario: 关闭代理配置
- **WHEN** 用户关闭代理注入
- **THEN** 系统持久化关闭状态，并将 agent 子进程视为未配置代理注入

### Requirement: Agent CLI 代理环境注入

Agent 研讨室 SHALL 将已保存的代理配置应用到正式 Codex 和 ClaudeCode 研讨调用所使用的子进程环境，并且不改变只读执行参数。

#### Scenario: Codex 调用注入已启用代理
- **WHEN** 任一研讨阶段调用 Codex，且代理注入已启用并配置了有效代理 URL
- **THEN** 系统使用已配置的代理环境变量启动 Codex，并保留 Codex read-only sandbox 参数

#### Scenario: ClaudeCode 调用注入已启用代理
- **WHEN** 任一研讨阶段调用 ClaudeCode，且代理注入已启用并配置了有效代理 URL
- **THEN** 系统使用已配置的代理环境变量启动 ClaudeCode，并保留 ClaudeCode print mode、plan mode 和 read-only tool 参数

#### Scenario: 代理关闭时不继承代理变量
- **WHEN** 任一 agent 被调用且代理注入处于关闭状态
- **THEN** 系统不向该 agent 子进程传递继承而来的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`http_proxy`、`https_proxy` 或 `all_proxy` 等代理变量

#### Scenario: 代理注入不改变研讨记录
- **WHEN** 研讨在代理注入启用或关闭状态下运行
- **THEN** 系统保存的研讨记录格式保持不变，并且不包含代理配置详情

### Requirement: Agent 连接测试

Agent 研讨室 SHALL 为每个已安装 agent 提供用户手动触发的连接测试；该测试使用与正式研讨调用相同的代理环境派生逻辑，并且不替代登录态检测。

#### Scenario: 连接测试使用已保存代理配置
- **WHEN** 用户为已安装 agent 启动连接测试
- **THEN** 系统使用与研讨调用相同的代理环境派生逻辑调用该 agent，并报告测试是否成功

#### Scenario: 连接测试不改变 ready 状态
- **WHEN** 连接测试成功或失败
- **THEN** 系统保留由安装状态和登录态检测派生出的 agent ready 状态

#### Scenario: 手动 Agent 检测不运行连接测试
- **WHEN** 用户点击“重新检测”
- **THEN** 系统只检查安装状态、版本和登录态，不运行 model-backed 连接测试

#### Scenario: 连接测试结果不写入研讨时间线
- **WHEN** 连接测试完成
- **THEN** 系统在配置区域显示结果，并且不创建或修改研讨记录消息
