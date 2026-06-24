## REMOVED Requirements

### Requirement: Agent Workshop tab
**Reason**: 刷新后的 workbench shell 不再使用拥挤的横向顶部 tab bar 作为主导航模型，Agent Workshop 会升级为核心 AI 入口。

**Migration**: 使用新的「Agent Workshop AI 入口」需求。该功能仍然打开同一个 Agent Workshop workflow，Editor、JSON、Diff、Time、Regex、Encode 和 Settings 等现有工具继续通过刷新后的 workbench navigation 访问。

## ADDED Requirements

### Requirement: Agent Workshop AI 入口
OneApp SHALL 在刷新后的 workbench shell 中将 Agent Workshop 呈现为醒目的 AI 入口，同时保留现有基于本地 repo 的 workshop workflow。

#### Scenario: 从 AI 导航打开 Agent Workshop
- **WHEN** 用户在 AI 导航分组中选择 Agent Workshop 入口
- **THEN** 系统显示 Agent Workshop 界面，并包含配置/进度控制以及 idea input 或 discussion timeline

#### Scenario: 现有工具仍可访问
- **WHEN** Agent Workshop 被提升到 AI 导航分组
- **THEN** 现有 Editor、JSON、Diff、Time、Regex、Encode 和 Settings 工具仍可通过刷新后的 workbench navigation 访问

#### Scenario: Agent Workshop 保留工作流布局
- **WHEN** Agent Workshop 入口处于激活状态
- **THEN** 系统继续呈现 repo 配置、agent 检测、moderator agent 选择、启动控制、stage progress 和 discussion message，并且不改变底层 workshop 行为
