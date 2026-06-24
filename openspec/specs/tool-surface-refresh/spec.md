# tool-surface-refresh Specification

## Purpose

tool-surface-refresh 定义 OneApp 各一级工具页面在 workbench UI refresh 后的共享 surface、响应式布局和状态反馈规则，确保 Editor、JSON、Diff、Regex、Encode、Time、Agent Workshop 与 Settings 在视觉层级、输入输出结构和窄宽度行为上保持一致，同时不改变既有工具语义。

## Requirements

### Requirement: 共享 tool surface pattern

所有一级工具 SHALL 使用共享的 visual pattern 呈现 command bar、panel、form control、status message 和 empty state，同时保留现有行为。

#### Scenario: Tool command bar 保持一致
- **WHEN** 用户查看编辑器、JSON、Diff、Regex、Encode、Time、Agent Workshop 或 Settings
- **THEN** command control 根据工具场景使用一致的 command bar 或 section action 样式

#### Scenario: Panel 层级保持一致
- **WHEN** 工具显示输入、输出、preview、result、settings 或 timeline 区域
- **THEN** 这些区域使用一致的 panel spacing、heading hierarchy、border 和 background surface

#### Scenario: 现有工具语义保持不变
- **WHEN** 用户执行格式化 JSON、比较文本、Regex match、Time 转换、Encode 文本、编辑文件或导出 Agent Workshop record 等现有工具操作
- **THEN** 操作产生的功能结果与视觉刷新前一致

### Requirement: Editor workbench surface

Editor surface SHALL 保留 file tree、editor panel 和 preview panel workflow，同时用更紧凑、更清晰的方式呈现 layout control。

#### Scenario: 空文档首次进入默认隐藏 Preview
- **WHEN** 用户首次切换到 Editor，且当前是未编辑的新建空文档
- **THEN** Editor 默认展示 file tree 和 editor panel，不默认展示 preview panel，以避免初始三栏布局挤压

#### Scenario: Editor panel 可独立显示
- **WHEN** 用户切换 file list、editor area 或 preview area 的可见性
- **THEN** 对应 panel 的可见性发生变化，并且不会丢失当前编辑内容

#### Scenario: File tree 不被压成窄竖条
- **WHEN** file tree 可见且 Editor 横向空间不足
- **THEN** file tree 保持可读最小宽度，或由用户主动收起；系统不得把 file tree 压缩成只剩 icon 的不可读竖条

#### Scenario: Preview 可按内容或用户意图恢复
- **WHEN** 用户打开已有 Markdown/HTML 文件、主动点击 Preview toggle，或当前内容适合预览
- **THEN** Preview panel 可以重新显示，并继续支持滚动同步、Markdown/HTML preview 和导出能力

#### Scenario: 纯文本模式隐藏预览控制
- **WHEN** 当前编辑器模式为纯文本
- **THEN** 刷新后的 command area 隐藏或禁用仅 preview 相关的控件

#### Scenario: Markdown 和 HTML 预览仍可用
- **WHEN** 当前编辑器模式支持预览
- **THEN** 刷新后的 Editor surface 仍允许用户查看 rendered preview 并导出支持的格式

### Requirement: 数据与文本工具使用清晰的 input/output layout

JSON、Diff、Regex 和 Encode 工具 SHALL 使用清晰 label 和一致 status feedback 呈现 input、output、preview 和 result 区域。

#### Scenario: JSON 输入和输出清晰分离
- **WHEN** JSON 工具处于激活状态
- **THEN** input editor、output editor、command control、success state 和 error state 在视觉上清晰区分，便于扫描

#### Scenario: Diff 输入态和结果态清晰
- **WHEN** Diff 工具在对比前或对比后处于激活状态
- **THEN** 刷新后的 UI 清晰区分 editable source input 与 split 或 unified diff result

#### Scenario: Regex 匹配反馈可见
- **WHEN** Regex 工具存在匹配、错误或正在执行匹配
- **THEN** 刷新后的 UI 清晰显示 pattern control、flags、match preview 和 result list 的 status feedback

#### Scenario: Encode 子工具可导航
- **WHEN** Encode 工具处于激活状态
- **THEN** Base64、URL、JWT、Hash、进制转换和 Unicode 子工具仍然可发现并可切换

### Requirement: 多栏工具具备 responsive fallback

双栏或多栏工具 SHALL 在横向空间不足时采用 stack、drawer、compact navigation 或其他 responsive fallback，避免固定宽度侧栏和多 panel 同时挤压主工作区。

#### Scenario: JSON 和 Diff 双栏可降级
- **WHEN** JSON 或 Diff 工具的可用宽度不足以舒适展示两个并排 panel
- **THEN** 输入/输出或原文/新文区域切换为上下 stack，或提供清晰的单 panel 切换方式

#### Scenario: Regex 速查不挤压匹配区域
- **WHEN** Regex 工具打开 quick reference 且横向空间不足
- **THEN** quick reference 使用 drawer、底部区域或 overlay 方式展示，不持续压缩测试文本和匹配预览到不可用宽度

#### Scenario: Encode 子导航不固定抢占空间
- **WHEN** Encode 工具的横向空间不足
- **THEN** 子工具 navigation 可切换为顶部横向 segmented control、compact rail 或其他低占宽模式，主转换区域保持可读

#### Scenario: Agent Workshop 配置栏可适配窄宽度
- **WHEN** Agent Workshop 的左侧配置栏与 timeline 区域在窄宽度下冲突
- **THEN** 配置区可收起、堆叠到顶部或切换为 compact 模式，timeline 和 idea input 不被压到不可用宽度

### Requirement: Time 和 Settings 使用结构化表单

Time 和 Settings SHALL 使用结构化 dashboard 或 settings layout，而不是普通堆叠控件。

#### Scenario: Time dashboard 突出实时值
- **WHEN** Time 工具处于激活状态
- **THEN** 当前 datetime 和 timestamp 在视觉上被强调，并保留 copy action

#### Scenario: 转换表单保持紧凑
- **WHEN** 用户将时间戳转为日期或将日期转为时间戳
- **THEN** 刷新后的 layout 按转换任务分组展示 input、unit、output format、result 和 copy action

#### Scenario: Settings 快捷键说明准确
- **WHEN** Settings 工具显示键盘快捷键帮助
- **THEN** 它说明数字导航覆盖 1 到 8 个工具

### Requirement: Agent Workshop 视觉状态

Agent Workshop SHALL 使用面向 workflow 的 surface，让 setup、ready state、progress、timeline message 和 final state 更易理解。

#### Scenario: 设置状态清晰
- **WHEN** 没有 workshop 正在运行且没有选中 record
- **THEN** repo 选择、agent ready state、moderator agent 选择、调用次数估算、成本提示和 idea input 会被组织成适合启动 workshop 的清晰 layout

#### Scenario: 运行状态清晰
- **WHEN** workshop 正在运行
- **THEN** UI 显示 stage progress、agent call state、禁用后的配置控件和 message timeline，并且不改变运行行为

#### Scenario: 终态清晰
- **WHEN** workshop 处于 succeeded、failed、canceled、resume view 或 unsupported 状态
- **THEN** 刷新后的 UI 显示对应状态，保留可用 message，并在适用时保留 export 或 restart 操作
