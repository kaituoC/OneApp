## MODIFIED Requirements

### Requirement: 分组 workbench navigation

应用 SHALL 通过顶部全局 navigation 呈现六个一级工作台分组，并对全部分组恒定渲染左侧上下文 navigation，呈现当前分组的工具及其子工具，而不是使用宽大的分组左侧一级 navigation 或拥挤的横向文字 tab bar。

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

#### Scenario: 单工具分组恒定显示左侧导航
- **WHEN** 用户切换到工作区、生成工具、AI 或系统等单工具分组
- **THEN** 左侧上下文 navigation 仍然渲染并显示该分组唯一的工具入口，主内容区宽度不因侧栏出现或消失而跳变

#### Scenario: 子工具在左侧导航呈现
- **WHEN** 当前工具包含子工具（数据工具、文本处理、编码、生成器、时间）
- **THEN** 左侧上下文 navigation 在该工具条目下呈现子工具入口，选择子工具同时激活对应工具并切换到该子工具，页面主体不再出现重复的第三层导航控件

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

### Requirement: Context shell surface

Workbench shell SHALL 围绕当前工具提供一致的 context 和 status surface。context bar 只承载工具名称、上下文描述与快捷键提示，不重复展示设置页已提供的主题与字号信息。

#### Scenario: 当前工具上下文可见
- **WHEN** 任意一级工具处于激活状态
- **THEN** shell 显示当前工具名称，以及当前编辑文件或工具状态等可用 context detail

#### Scenario: Context bar 不重复设置项
- **WHEN** 用户查看 context bar
- **THEN** context bar 不显示主题或字号 chip，主题与字号仍可在设置页查看和即时调整

#### Scenario: Context bar 在窄宽度下保持可读
- **WHEN** 当前文件路径、工具说明或快捷键提示与可用宽度冲突
- **THEN** context bar 保留当前工具名称和关键 context，将低优先级信息隐藏、收缩或移入 tooltip，避免与内容重叠

#### Scenario: Status bar 覆盖全部工具
- **WHEN** Agent Workshop 或任意其他一级工具处于激活状态
- **THEN** status area 显示该工具的人类可读 label，并且不会显示空值或 undefined

#### Scenario: 时间工具摘要包含 Cron 和多时区能力
- **WHEN** 用户查看时间工具导航说明或上下文摘要
- **THEN** 系统可体现时间工具除日期与时间戳转换外，还包含 Cron 表达式解释和多时区对照能力

### Requirement: 紧凑的窄宽度导航

应用 SHALL 在窄宽度下优先保护主内容区：顶部一级导航可横向查看，左侧上下文 navigation 保持紧凑宽度并恒定渲染。

#### Scenario: 窄宽度优先保护主工作区
- **WHEN** 应用窗口宽度不足，或 DevTools 等外部面板占用横向空间
- **THEN** 顶部全局导航与次要 meta 信息先收缩或滚动，主内容区不会被宽大导航栏挤压到不可用宽度

#### Scenario: 导航入口保持可理解
- **WHEN** 顶部一级导航或左侧上下文导航因可用宽度收缩
- **THEN** 每个入口仍可通过图标、可见 label、title 或 accessible name 获得完整工具名称、说明和快捷键信息
