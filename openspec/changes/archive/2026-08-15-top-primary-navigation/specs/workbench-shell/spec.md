## MODIFIED Requirements

### Requirement: 分组 workbench navigation

应用 SHALL 通过顶部全局 navigation 呈现六个一级工作台分组，并在当前分组包含多个工具时通过左侧上下文 navigation 呈现其二级工具，而不是使用宽大的分组左侧一级 navigation 或拥挤的横向文字 tab bar。

#### Scenario: 导航分组可见
- **WHEN** 应用启动
- **THEN** 顶部全局导航显示工作区、数据处理、文本调试、生成工具、AI 和系统设置分组

#### Scenario: Agent Workshop 是 AI 入口
- **WHEN** 用户查看 AI 分组
- **THEN** Agent Workshop 作为 AI 分组下的醒目入口显示，而不是普通未分组工具标签

#### Scenario: 生成器是生成工具入口
- **WHEN** 用户查看生成工具分组
- **THEN** Generator 作为生成工具分组下的入口显示，并在说明中体现 UUID、密码、Lorem 和二维码能力

#### Scenario: 选择导航入口
- **WHEN** 用户选择任意顶部一级分组或左侧二级工具入口
- **THEN** 主内容区切换到对应工具，并保留该工具现有 state model

## ADDED Requirements

### Requirement: 紧凑的窄宽度导航

应用 SHALL 在窄宽度下优先保护主内容区：顶部一级导航可横向查看，左侧上下文 navigation 保持紧凑宽度，并且单工具分组不渲染上下文侧栏。

#### Scenario: 窄宽度优先保护主工作区
- **WHEN** 应用窗口宽度不足，或 DevTools 等外部面板占用横向空间
- **THEN** 顶部全局导航与次要 meta 信息先收缩或滚动，主内容区不会被宽大导航栏挤压到不可用宽度

#### Scenario: 导航入口保持可理解
- **WHEN** 顶部一级导航或左侧上下文导航因可用宽度收缩
- **THEN** 每个入口仍可通过图标、可见 label、title 或 accessible name 获得完整工具名称、说明和快捷键信息
