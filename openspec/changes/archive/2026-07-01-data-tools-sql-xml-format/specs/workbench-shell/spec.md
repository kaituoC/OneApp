## MODIFIED Requirements

### Requirement: 键盘导航兼容性

应用 SHALL 在 shell 刷新后保留全部一级工具的数字直达和循环切换能力。

#### Scenario: 数字快捷键覆盖全部工具
- **WHEN** 用户按下 Ctrl+1 到 Ctrl+9 或 Ctrl+0，或在 macOS 上按下 Cmd+1 到 Cmd+9 或 Cmd+0
- **THEN** 应用通过 Ctrl/Cmd+1~9 保持切换到 Editor、Data Tools、Diff、Text Processing、Time、Regex、Encode、Agent Workshop 和 Settings，并通过 Ctrl/Cmd+0 切换到 Generator

#### Scenario: 循环切换覆盖全部工具
- **WHEN** 用户使用 Ctrl+Tab 或 Ctrl+Shift+Tab，或在 macOS 上使用对应 Cmd 快捷键
- **THEN** 应用在全部 10 个一级工具之间正向或反向循环，并且不会跳过 Text Processing、Generator 或 AI 入口
