# workbench-shell Specification

## Purpose

workbench-shell 定义 OneApp 刷新后的应用壳结构：通过顶部分组 navigation、context-bar 工具导航条、status bar、icon-assisted controls 和共享 theme token 承载全部一级工具，让核心入口更醒目，同时在窄宽度或 DevTools 占用空间时优先保护主工作区。

## Requirements

### Requirement: 分组 workbench navigation

应用 SHALL 通过顶部全局 navigation 呈现七个一级任务分组，并提供独立设置入口，并在 context-bar 横向导航条中呈现当前分组的具体任务入口，而不是使用宽大的分组左侧一级 navigation 或拥挤的横向文字 tab bar。

#### Scenario: 导航分组可见
- **WHEN** 应用启动
- **THEN** 顶部全局导航显示编辑器、数据、文本、编码、时间、生成、研讨室；设置通过独立按钮进入

#### Scenario: Agent Workshop 是 AI 入口
- **WHEN** 用户查看研讨室入口
- **THEN** Agent Workshop 通过研讨室一级入口直接进入

#### Scenario: 生成器是生成工具入口
- **WHEN** 用户查看生成工具分组
- **THEN** Generator 作为生成工具分组下的入口显示，并在说明中体现 UUID、密码、Lorem 和二维码能力

#### Scenario: 选择导航入口
- **WHEN** 用户选择任意顶部一级分组或 context-bar 导航条中的工具、子工具入口
- **THEN** 主内容区切换到对应工具，并保留该工具现有 state model

#### Scenario: 单工具分组直达内容
- **WHEN** 用户切换到编辑器、研讨室或设置等单工具分组
- **THEN** 不渲染任何侧栏或空白导航列，工具内容使用完整横向空间

#### Scenario: 子工具在 context-bar 导航条呈现
- **WHEN** 当前工具包含子工具（数据工具、编码、生成器、时间）
- **THEN** context-bar 导航条直接呈现子工具入口，不重复父工具；文本处理操作通过页内模式选择器访问，选择子工具同时激活对应工具并切换到该子工具，页面主体不再出现重复的第三层导航控件

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

Workbench shell SHALL 围绕当前工具提供一致的 context 和 status surface。context bar 承载当前分组的工具导航（工具与子工具 chips），页面标题呈现当前任务、说明与快捷键，chip tooltip 补充入口说明；顶栏提供独立主题按钮，字号在设置页调整。

#### Scenario: 当前工具上下文可见
- **WHEN** 任意一级工具处于激活状态
- **THEN** 页面标题标示当前任务，多任务分类的工具导航条以选中 chip 标示具体任务，当前编辑文件等 context detail 由 status area 展示

#### Scenario: Context bar 不重复设置项
- **WHEN** 用户查看 context bar
- **THEN** context bar 不显示主题或字号 chip，主题与字号仍可在设置页查看和即时调整

#### Scenario: Context bar 在窄宽度下保持可读
- **WHEN** 导航 chips 与可用宽度冲突
- **THEN** context bar 导航条允许横向滚动，工具说明与快捷键信息保留在 chip tooltip 中，避免与内容重叠

#### Scenario: Status bar 覆盖全部工具
- **WHEN** Agent Workshop 或任意其他一级工具处于激活状态
- **THEN** status area 显示该工具的人类可读 label，并且不会显示空值或 undefined

#### Scenario: 时间工具摘要包含 Cron 和多时区能力
- **WHEN** 用户查看时间工具导航说明或上下文摘要
- **THEN** 系统可体现时间工具除日期与时间戳转换外，还包含 Cron 表达式解释和多时区对照能力

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

应用 SHALL 在窄宽度下优先保护主内容区：顶部一级导航与 context-bar 工具导航均可横向查看，不渲染左侧导航列。

#### Scenario: 窄宽度优先保护主工作区
- **WHEN** 应用窗口宽度不足，或 DevTools 等外部面板占用横向空间
- **THEN** 顶部全局导航与 context-bar 工具导航先横向滚动收缩，主内容区不会被宽大导航栏挤压到不可用宽度

#### Scenario: 导航入口保持可理解
- **WHEN** 顶部一级导航或 context-bar 工具导航因可用宽度收缩
- **THEN** 每个入口仍可通过图标、可见 label、title 或 accessible name 获得完整工具名称、说明和快捷键信息

### Requirement: 导航文字与图标协作

应用 SHALL 使用单一 icon library 提升导航和紧凑 command control 的可扫描性。

#### Scenario: 导航与任务标题清晰可辨
- **WHEN** 用户查看主导航
- **THEN** 一级导航入口显示文字 label，当前页面标题提供对应工具 icon；搜索、主题与设置使用可访问的图标按钮

#### Scenario: 紧凑控件仍可理解
- **WHEN** 某个命令主要通过图标表示
- **THEN** 该控件包含 accessible label、title 或相邻文字来说明操作
