## MODIFIED Requirements

### Requirement: 键盘导航兼容性

应用 SHALL 在 shell 刷新后保留全部一级工具的数字直达和循环切换能力。

#### Scenario: 数字快捷键覆盖全部工具
- **WHEN** 用户按下 Ctrl+1 到 Ctrl+9，或在 macOS 上按下 Cmd+1 到 Cmd+9
- **THEN** 应用分别切换到 Editor、JSON / YAML、Diff、Text Processing、Time、Regex、Encode、Agent Workshop 和 Settings

#### Scenario: 循环切换覆盖全部工具
- **WHEN** 用户使用 Ctrl+Tab 或 Ctrl+Shift+Tab，或在 macOS 上使用对应 Cmd 快捷键
- **THEN** 应用在全部 9 个一级工具之间正向或反向循环，并且不会跳过 Text Processing 或 AI 入口
