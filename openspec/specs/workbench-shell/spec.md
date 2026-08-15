# workbench-shell Specification

## Purpose

workbench-shell 定义 OneApp 刷新后的应用壳结构：通过分组左侧 navigation、context bar、status bar、icon-assisted controls 和共享 theme token 承载全部一级工具，让核心入口更醒目，同时在窄宽度或 DevTools 占用空间时优先保护主工作区。
## Requirements
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

### Requirement: 可收起 workbench navigation

应用 SHALL 允许用户在完整导航和 compact navigation 之间切换，并在可用工作区进入窄宽度时默认收起导航，避免左侧 navigation 持续占用过多宽度。

#### Scenario: Navigation 可以收起
- **WHEN** 用户触发 navigation collapse control
- **THEN** 左侧 navigation 切换为 compact 模式，仅保留品牌/工具 icon、active state 和必要的快捷键提示

#### Scenario: Compact navigation 仍可理解
- **WHEN** navigation 处于 compact 模式
- **THEN** 每个工具入口仍可通过 icon、title 或 tooltip 获得完整工具名称、说明和快捷键信息

#### Scenario: 完整说明不被硬截断成不可理解文本
- **WHEN** navigation 处于完整模式且工具说明过长
- **THEN** 可见说明使用短文案，完整说明通过 title、tooltip 或顶部 context bar 可访问，而不是显示类似「Markdown / HTML / 纯...」的不可理解截断

#### Scenario: 窄宽度自动收起导航
- **WHEN** 应用可用工作区不大于约 900px 且用户尚未在当前会话中手动覆盖导航状态
- **THEN** workbench navigation 自动进入 compact 模式，主内容区保留可用宽度

#### Scenario: 用户可以覆盖自动状态
- **WHEN** navigation 因窄宽度自动收起后用户主动点击展开，或用户在宽屏主动点击收起
- **THEN** 用户选择在当前应用会话中优先于自动状态生效，并且控件的 label、tooltip 与实际状态一致

#### Scenario: 窄宽度优先保护主工作区
- **WHEN** 应用窗口宽度不足，或 DevTools 等外部面板占用横向空间
- **THEN** workbench shell 优先缩减或收起 navigation 和次要 meta 信息，主内容区不会被 navigation 挤压到不可用宽度

### Requirement: 键盘导航兼容性

应用 SHALL 保留全部一级工具的数字直达和循环切换能力，并只展示操作系统能够可靠交付给应用的组合键。

#### Scenario: 数字快捷键覆盖全部工具
- **WHEN** 用户按下 Windows/Linux 的 Ctrl+1 到 Ctrl+9 或 Ctrl+0，或在 macOS 上按下 Cmd+1 到 Cmd+9 或 Cmd+0
- **THEN** 应用通过对应数字快捷键切换到 Editor、Data Tools、Diff、Text Processing、Time、Regex、Encode、Agent Workshop、Settings 和 Generator

#### Scenario: 循环切换覆盖全部工具
- **WHEN** 用户在任意支持的平台按下 Ctrl+Tab 或 Ctrl+Shift+Tab
- **THEN** 应用在全部 10 个一级工具之间正向或反向循环，并且不会跳过 Text Processing、Generator 或 AI 入口

#### Scenario: macOS 保留系统应用切换快捷键
- **WHEN** 用户在 macOS 按下 Cmd+Tab 或 Cmd+Shift+Tab
- **THEN** OneApp 不将该组合键声明或显示为内部工具循环快捷键

#### Scenario: 快捷键帮助与实际绑定一致
- **WHEN** Settings 或 context surface 展示工具导航快捷键
- **THEN** 文案来自与键盘处理逻辑相同的快捷键定义，并按当前平台显示正确修饰键

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

#### Scenario: 时间工具摘要包含 Cron 和多时区能力
- **WHEN** 用户查看时间工具导航说明或上下文摘要
- **THEN** 系统可体现时间工具除日期与时间戳转换外，还包含 Cron 表达式解释和多时区对照能力

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

### Requirement: Workbench 主要滚动所有权

Workbench shell SHALL 为每个一级工具定义唯一的主要纵向滚动区域，并固定 shell 的 context bar 与全局 status bar。

#### Scenario: 普通工具页纵向滚动
- **WHEN** 普通表单或设置页面的内容超过可用高度
- **THEN** 页面根内容区作为主要纵向滚动容器，shell 与 navigation 不随页面内容滚动

#### Scenario: 固定工作区纵向滚动
- **WHEN** 编辑器、结果列表或 timeline 使用固定高度工作区
- **THEN** 最主要的内容区域承担纵向滚动，配置栏与页面根不得再形成竞争性的同向滚动

#### Scenario: 深浅主题滚动条一致
- **WHEN** 任一允许滚动的区域显示滚动条
- **THEN** 滚动条颜色、宽度和 hover 状态使用当前主题 token，不出现与主题冲突的浏览器默认亮色槽

### Requirement: 紧凑的窄宽度导航

应用 SHALL 在窄宽度下优先保护主内容区：顶部一级导航可横向查看，左侧上下文 navigation 保持紧凑宽度，并且单工具分组不渲染上下文侧栏。

#### Scenario: 窄宽度优先保护主工作区
- **WHEN** 应用窗口宽度不足，或 DevTools 等外部面板占用横向空间
- **THEN** 顶部全局导航与次要 meta 信息先收缩或滚动，主内容区不会被宽大导航栏挤压到不可用宽度

#### Scenario: 导航入口保持可理解
- **WHEN** 顶部一级导航或左侧上下文导航因可用宽度收缩
- **THEN** 每个入口仍可通过图标、可见 label、title 或 accessible name 获得完整工具名称、说明和快捷键信息
