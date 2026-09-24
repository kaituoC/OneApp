## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: 导航文字与图标协作

应用 SHALL 使用单一 icon library 提升导航和紧凑 command control 的可扫描性。

#### Scenario: 导航与任务标题清晰可辨
- **WHEN** 用户查看主导航
- **THEN** 一级导航入口显示文字 label，当前页面标题提供对应工具 icon；搜索、主题与设置使用可访问的图标按钮

#### Scenario: 紧凑控件仍可理解
- **WHEN** 某个命令主要通过图标表示
- **THEN** 该控件包含 accessible label、title 或相邻文字来说明操作

## REMOVED Requirements

### Requirement: Icon-assisted interaction model

**Reason**: 用户已审定新的交互结构，替换旧布局约定；原有功能继续保留。
**Migration**: 使用「导航文字与图标协作」需求，功能通过新入口继续访问。

