## MODIFIED Requirements

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

## ADDED Requirements

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
