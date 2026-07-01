# workbench-shell Specification

## Purpose

workbench-shell 定义 OneApp 刷新后的应用壳结构：通过分组左侧 navigation、context bar、status bar、icon-assisted controls 和共享 theme token 承载全部一级工具，让核心入口更醒目，同时在窄宽度或 DevTools 占用空间时优先保护主工作区。

## Requirements

### Requirement: 分组 workbench navigation

应用 SHALL 通过分组左侧 workbench navigation 呈现一级工具，而不是使用拥挤的横向文字 tab bar。

#### Scenario: 导航分组可见
- **WHEN** 应用启动
- **THEN** 主导航显示工作区编辑、数据处理、文本调试、AI 和系统设置分组

#### Scenario: Agent Workshop 是 AI 入口
- **WHEN** 用户查看主导航
- **THEN** Agent Workshop 作为 AI 分组下的醒目入口显示，而不是普通未分组工具标签

#### Scenario: 选择导航入口
- **WHEN** 用户选择任意主导航入口
- **THEN** 主内容区切换到对应工具，并保留该工具现有 state model

### Requirement: 可收起 workbench navigation

应用 SHALL 允许用户在完整导航和 compact navigation 之间切换，避免左侧 navigation 在横向空间不足时持续占用过多宽度。

#### Scenario: Navigation 可以收起
- **WHEN** 用户触发 navigation collapse control
- **THEN** 左侧 navigation 切换为 compact 模式，仅保留品牌/工具 icon、active state 和必要的快捷键提示

#### Scenario: Compact navigation 仍可理解
- **WHEN** navigation 处于 compact 模式
- **THEN** 每个工具入口仍可通过 icon、title 或 tooltip 获得完整工具名称、说明和快捷键信息

#### Scenario: 完整说明不被硬截断成不可理解文本
- **WHEN** navigation 处于完整模式且工具说明过长
- **THEN** 可见说明使用短文案，完整说明通过 title、tooltip 或顶部 context bar 可访问，而不是显示类似「Markdown / HTML / 纯...」的不可理解截断

#### Scenario: 窄宽度优先保护主工作区
- **WHEN** 应用窗口宽度不足，或 DevTools 等外部面板占用横向空间
- **THEN** workbench shell 优先缩减或收起 navigation 和次要 meta 信息，主内容区不会被 navigation 挤压到不可用宽度

### Requirement: 键盘导航兼容性

应用 SHALL 在 shell 刷新后保留全部一级工具的数字直达和循环切换能力。

#### Scenario: 数字快捷键覆盖全部工具
- **WHEN** 用户按下 Ctrl+1 到 Ctrl+9，或在 macOS 上按下 Cmd+1 到 Cmd+9
- **THEN** 应用分别切换到 Editor、JSON / YAML、Diff、Text Processing、Time、Regex、Encode、Agent Workshop 和 Settings

#### Scenario: 循环切换覆盖全部工具
- **WHEN** 用户使用 Ctrl+Tab 或 Ctrl+Shift+Tab，或在 macOS 上使用对应 Cmd 快捷键
- **THEN** 应用在全部 9 个一级工具之间正向或反向循环，并且不会跳过 Text Processing 或 AI 入口

### Requirement: Context shell surface

Workbench shell SHALL 围绕当前工具提供一致的 context 和 status surface。

#### Scenario: 当前工具上下文可见
- **WHEN** 任意一级工具处于激活状态
- **THEN** shell 显示当前工具名称，以及当前编辑文件或工具状态等可用 context detail

#### Scenario: Context bar 在窄宽度下保持可读
- **WHEN** 当前文件路径、工具说明或 meta chip 与可用宽度冲突
- **THEN** context bar 保留当前工具名称和关键 context，将低优先级 meta chip 隐藏、收缩或移入 tooltip，避免与内容重叠

#### Scenario: Status bar 覆盖全部工具
- **WHEN** Agent Workshop 或任意其他一级工具处于激活状态
- **THEN** status area 显示该工具的人类可读 label，并且不会显示空值或 undefined

### Requirement: Icon-assisted interaction model

应用 SHALL 使用单一 icon library 提升导航和紧凑 command control 的可扫描性。

#### Scenario: 导航入口包含图标
- **WHEN** 用户查看主导航
- **THEN** 每个一级导航入口都显示可识别 icon 和文字 label

#### Scenario: 紧凑控件仍可理解
- **WHEN** 某个命令主要通过图标表示
- **THEN** 该控件包含 accessible label、title 或相邻文字来说明操作

### Requirement: 专业 theme system

刷新后的 shell SHALL 使用共享 design token，为 dark/light theme 提供一致的 surface、text、border、focus 和 semantic state。

#### Scenario: Dark theme 使用精致表面
- **WHEN** dark theme 处于激活状态
- **THEN** shell 和 tool surface 使用分层中性色背景、克制 border、可读 text contrast 和一致 accent 处理

#### Scenario: Light theme 保持精致
- **WHEN** light theme 处于激活状态
- **THEN** shell 和 tool surface 使用匹配的 light mode token，而不是 browser-default 控件

#### Scenario: Focus 可见
- **WHEN** 键盘用户聚焦某个交互控件
- **THEN** 被聚焦控件具有跨刷新 UI 一致的可见 focus style
