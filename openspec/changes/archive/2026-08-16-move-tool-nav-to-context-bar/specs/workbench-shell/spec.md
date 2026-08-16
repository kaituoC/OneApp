## MODIFIED Requirements

### Requirement: 分组 workbench navigation

应用 SHALL 通过顶部全局 navigation 呈现六个一级工作台分组，并在 context-bar 横向导航条中呈现当前分组的工具及其子工具，而不是使用宽大的分组左侧一级 navigation 或拥挤的横向文字 tab bar。

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
- **WHEN** 用户选择任意顶部一级分组或 context-bar 导航条中的工具、子工具入口
- **THEN** 主内容区切换到对应工具，并保留该工具现有 state model

#### Scenario: 单工具分组直达内容
- **WHEN** 用户切换到工作区、生成工具、AI 或系统等单工具分组
- **THEN** 不渲染任何侧栏或空白导航列，工具内容使用完整横向空间

#### Scenario: 子工具在 context-bar 导航条呈现
- **WHEN** 当前工具包含子工具（数据工具、文本处理、编码、生成器、时间）
- **THEN** context-bar 导航条在当前工具之后呈现子工具入口，选择子工具同时激活对应工具并切换到该子工具，页面主体不再出现重复的第三层导航控件

### Requirement: Context shell surface

Workbench shell SHALL 围绕当前工具提供一致的 context 和 status surface。context bar 承载当前分组的工具导航（工具与子工具 chips），工具说明与快捷键信息保留在 chip 悬停 tooltip 中，不重复展示设置页已提供的主题与字号信息。

#### Scenario: 当前工具上下文可见
- **WHEN** 任意一级工具处于激活状态
- **THEN** context bar 的工具导航条以选中 chip 标示当前工具与子工具，当前编辑文件等 context detail 由 status area 展示

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

### Requirement: 紧凑的窄宽度导航

应用 SHALL 在窄宽度下优先保护主内容区：顶部一级导航与 context-bar 工具导航均可横向查看，不渲染左侧导航列。

#### Scenario: 窄宽度优先保护主工作区
- **WHEN** 应用窗口宽度不足，或 DevTools 等外部面板占用横向空间
- **THEN** 顶部全局导航与 context-bar 工具导航先横向滚动收缩，主内容区不会被宽大导航栏挤压到不可用宽度

#### Scenario: 导航入口保持可理解
- **WHEN** 顶部一级导航或 context-bar 工具导航因可用宽度收缩
- **THEN** 每个入口仍可通过图标、可见 label、title 或 accessible name 获得完整工具名称、说明和快捷键信息

## REMOVED Requirements

### Requirement: 可收起 workbench navigation

**Reason**: 左侧 navigation 列已整体移除，收起 / compact 模式失去作用对象；context-bar 工具导航条以横向滚动自适应窄宽度，不再需要独立的收起状态。
**Migration**: 窄宽度下优先保护主内容区的语义由「紧凑的窄宽度导航」requirement 承载；导航入口可理解性由 tooltip 与 accessible name 保证。
