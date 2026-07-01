## MODIFIED Requirements

### Requirement: 分组 workbench navigation

应用 SHALL 通过分组左侧 workbench navigation 呈现一级工具，而不是使用拥挤的横向文字 tab bar。

#### Scenario: 导航分组可见
- **WHEN** 应用启动
- **THEN** 主导航显示工作区编辑、数据处理、文本调试、生成工具、AI 和系统设置分组

#### Scenario: Agent Workshop 是 AI 入口
- **WHEN** 用户查看主导航
- **THEN** Agent Workshop 作为 AI 分组下的醒目入口显示，而不是普通未分组工具标签

#### Scenario: 生成器是生成工具入口
- **WHEN** 用户查看主导航
- **THEN** Generator 作为生成工具分组下的入口显示，而不是塞入数据处理或文本调试分组

#### Scenario: 选择导航入口
- **WHEN** 用户选择任意主导航入口
- **THEN** 主内容区切换到对应工具，并保留该工具现有 state model

### Requirement: 键盘导航兼容性

应用 SHALL 在 shell 刷新后保留全部一级工具的数字直达和循环切换能力。

#### Scenario: 数字快捷键覆盖全部工具
- **WHEN** 用户按下 Ctrl+1 到 Ctrl+9 或 Ctrl+0，或在 macOS 上按下 Cmd+1 到 Cmd+9 或 Cmd+0
- **THEN** 应用通过 Ctrl/Cmd+1~9 保持切换到 Editor、JSON / YAML、Diff、Text Processing、Time、Regex、Encode、Agent Workshop 和 Settings，并通过 Ctrl/Cmd+0 切换到 Generator

#### Scenario: 循环切换覆盖全部工具
- **WHEN** 用户使用 Ctrl+Tab 或 Ctrl+Shift+Tab，或在 macOS 上使用对应 Cmd 快捷键
- **THEN** 应用在全部 10 个一级工具之间正向或反向循环，并且不会跳过 Text Processing、Generator 或 AI 入口
