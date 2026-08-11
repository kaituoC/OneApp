# tool-surface-refresh Specification

## Purpose

tool-surface-refresh 定义 OneApp 各一级工具页面在 workbench UI refresh 后的共享 surface、响应式布局和状态反馈规则，确保 Editor、JSON、Diff、Text Processing、Regex、Encode、Time、Agent Workshop 与 Settings 在视觉层级、输入输出结构和窄宽度行为上保持一致，同时不改变既有工具语义。
## Requirements
### Requirement: 共享 tool surface pattern

所有一级工具 SHALL 使用共享的 visual pattern 呈现 command bar、panel、form control、status message 和 empty state，同时保留现有行为。

#### Scenario: Tool command bar 保持一致
- **WHEN** 用户查看编辑器、JSON、Diff、Text Processing、Regex、Encode、Time、Agent Workshop 或 Settings
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

JSON、Diff、Text Processing、Regex 和 Encode 工具 SHALL 使用清晰 label 和一致 status feedback 呈现 input、output、preview 和 result 区域。

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

### Requirement: Diff 对比支持可逆编辑流程

Diff 工具 SHALL 允许用户在输入态与结果态之间往返，并在返回编辑时保留未明确清空的源文本。

#### Scenario: 从结果返回编辑
- **WHEN** 用户已生成差异结果并点击“编辑内容”
- **THEN** 系统显示文本 A 和文本 B 的可编辑输入区
- **AND** 两侧内容与本次对比使用的源文本保持一致

#### Scenario: 清空单侧内容
- **WHEN** 用户在输入态清空文本 A 或文本 B 的单侧内容
- **THEN** 系统只清空目标侧并保留另一侧文本
- **AND** 系统将输入焦点移动到被清空的编辑器

#### Scenario: 修改后重新对比
- **WHEN** 用户返回输入态并修改任意一侧内容后点击“对比”
- **THEN** 系统基于两侧当前内容重新生成 split、unified 和摘要结果
- **AND** 系统进入结果态

#### Scenario: 结果态加载文件
- **WHEN** 用户在结果态为任意一侧加载新文件
- **THEN** 系统保留另一侧内容并使用新文件内容刷新当前差异结果
- **AND** 刷新后的摘要与 split、unified 结果均对应当前两侧源文本

#### Scenario: 结果态交换文本
- **WHEN** 用户在结果态交换文本 A 与文本 B
- **THEN** 系统交换两侧源文本并刷新当前差异结果
- **AND** 结果中的新增与删除方向反映交换后的文本顺序

#### Scenario: 清空全部内容
- **WHEN** 用户点击“清空全部”
- **THEN** 系统清空文本 A、文本 B 和已有差异结果
- **AND** 系统返回可编辑输入态

### Requirement: Diff 重新计算采用显式触发

Diff 工具 SHALL 仅在用户发起对比或结果态下的明确源文本操作完成后重新计算差异，不得在输入态每次键入时自动执行完整差异计算。

#### Scenario: 输入过程不自动计算
- **WHEN** 用户在输入态键入或粘贴文本
- **THEN** 系统更新对应输入内容但不生成或刷新差异结果

#### Scenario: 切换结果视图不重复计算
- **WHEN** 用户在已有结果上切换并排视图与统一视图
- **THEN** 系统使用本次对比已生成的结果切换展示
- **AND** 系统不因视图切换再次执行文本差异计算

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

### Requirement: Text processing tool surface

Text Processing SHALL follow the shared tool surface pattern used by other first-level tools.

#### Scenario: Text processing uses shared surface
- **WHEN** the Text Processing tool is active
- **THEN** the system displays a command area, input panel, output or statistics panel, status feedback, and copy feedback using the shared tool surface styles

#### Scenario: Text processing adapts to narrow width
- **WHEN** the Text Processing tool does not have enough horizontal space for two comfortable panels
- **THEN** the input and output panels stack vertically while remaining readable and operable

### Requirement: Generator tool surface

Generator SHALL follow the shared tool surface pattern used by other first-level tools while presenting UUID, password, and Lorem sub-tools as a compact generation workflow.

#### Scenario: Generator uses shared surface
- **WHEN** the Generator tool is active
- **THEN** the system displays a command area, sub-tool selector, configuration panel, output panel, status feedback, and copy feedback using the shared tool surface styles

#### Scenario: Generator sub-tools are navigable
- **WHEN** the Generator tool is active
- **THEN** UUID、随机密码和 Lorem 子工具可发现、可切换，并且切换不会丢失无关一级工具状态

#### Scenario: Generator adapts to narrow width
- **WHEN** the Generator tool does not have enough horizontal space for a comfortable configuration and output layout
- **THEN** configuration and output areas stack vertically while remaining readable and operable

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
- **THEN** 它说明数字导航覆盖 1 到 9 和 0 号工具

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

### Requirement: 共享 tool surface primitives

所有一级工具 SHALL 复用一组实际被模板引用的 tool surface primitives，用于 command bar、panel、panel header、segmented control、icon button、status chip、empty state 和 copy feedback；未被使用的共享样式不得保留为死代码。

#### Scenario: 工具页使用一致 primitives
- **WHEN** 用户查看 Editor、JSON、Diff、Text Processing、Regex、Encode、Time、Agent Workshop 或 Settings
- **THEN** 页面中的主要 command、panel、status、empty state 和 copy feedback 使用一致的视觉 token、间距、边框、focus style 与语义状态

#### Scenario: 无死 CSS primitives
- **WHEN** 新增共享 `.tool-*` 样式或共享 UI pattern
- **THEN** 至少一个实际模板引用该样式或 pattern，否则不得将其保留在代码中

#### Scenario: Icon-only control 可理解
- **WHEN** 工具页使用 icon-only button 表达操作
- **THEN** 该控件使用 lucide icon，并包含 `title`、`aria-label` 或相邻文字说明操作含义

### Requirement: 统一响应式 workspace 策略

多栏或带侧栏的工具 SHALL 在横向空间不足时按统一 responsive workspace 策略降级，优先保证主输入、主结果或 timeline 可读；除代码/文本编辑内容自身可横向滚动外，页面整体不得依赖不可控的横向滚动维持可用性。

#### Scenario: Wide 宽度保留高效并排
- **WHEN** 主工作区宽度充足
- **THEN** JSON、Diff、Text Processing、Regex、Encode 和 Agent Workshop 可保持并排或多栏布局，以支持快速比较和编辑

#### Scenario: Medium 宽度收起次级区域
- **WHEN** DevTools 或窗口尺寸导致横向空间减少
- **THEN** 工具页优先收起或转移次级导航、quick reference、preview、配置栏等辅助区域，而不是把主输入或主结果压缩到不可读宽度

#### Scenario: Compact 宽度改为上下结构
- **WHEN** 可用宽度不足以舒适展示两个主要 panel
- **THEN** 对应工具切换为上下 stack、顶部 segmented 子导航或单 panel 切换，主要内容区域保持可读和可操作

### Requirement: Editor 文件工作区 polish

Editor SHALL 在不改变文件打开、保存、mode 推断、预览和导出语义的前提下，优化 file tree、editor panel 和 preview panel 的视觉与空间管理，使空文档和窄宽度场景更可用。

#### Scenario: 空内容不默认占用 Preview 空间
- **WHEN** 用户进入 Editor 且当前内容为空或仅为默认新建模板
- **THEN** preview panel 默认不抢占横向空间，用户仍可通过显式 Preview control 打开

#### Scenario: File tree 工具栏使用专业图标
- **WHEN** 用户查看 file tree toolbar 或 tree node
- **THEN** 打开目录、显示隐藏项、刷新、文件夹和文件等视觉元素使用与应用一致的 icon-assisted style，而不是 emoji 或难以理解的文本符号

#### Scenario: File tree 保持可读
- **WHEN** Editor 同时显示 file tree、editor 和 preview 且横向空间不足
- **THEN** file tree 保持可读最小宽度或进入明确的收起状态，不得被压缩成只剩图标的竖条

### Requirement: Encode 工具结构化 polish

Encode 工具 SHALL 将 Base64、URL、JWT、Hash、进制和 Unicode 子工具呈现为一致的结构化转换 surface，保留现有计算结果，并改善子导航、输入输出、错误状态与复制反馈。

#### Scenario: 子工具导航低占宽且清晰
- **WHEN** 用户打开 Encode 工具
- **THEN** 六个子工具入口可发现、可切换，并在中小宽度下转为顶部 segmented 或低占宽导航，不持续挤压转换区

#### Scenario: 双向转换面板一致
- **WHEN** 用户使用 Base64、URL 或 Unicode 子工具
- **THEN** 输入、方向切换、输出、错误和复制操作以一致 panel layout 呈现

#### Scenario: JWT 和 Hash 输出结构化
- **WHEN** JWT decode 或 Hash 计算产生结果
- **THEN** Header/Payload/Signature、时间字段和多算法 hash 结果使用结构化 output row/card 呈现，并为可复制内容提供一致反馈

### Requirement: 工具结果与反馈 polish

JSON、Diff、Text Processing、Regex、Time 和 Settings SHALL 在现有功能语义不变的前提下，强化空态、结果态、错误态、复制反馈和主次操作层级。

#### Scenario: JSON 空态和错误态清晰
- **WHEN** JSON 输入为空、处理成功或处理失败
- **THEN** 输入/输出区域和 status surface 分别显示清晰的空态、success 或 error 反馈

#### Scenario: Diff 结果导航和摘要清晰
- **WHEN** Diff 完成文本对比
- **THEN** 页面显示差异摘要，并提供清晰入口帮助用户理解 split 或 unified result

#### Scenario: Regex 结果列表可定位
- **WHEN** Regex 存在匹配结果
- **THEN** 用户可以通过结果列表理解位置、捕获组和高亮关系，且 quick reference 在窄宽度下不遮挡主要编辑任务

#### Scenario: Time 转换结果易复制
- **WHEN** Time 工具生成 datetime 或 timestamp 结果
- **THEN** 结果与 copy action 使用一致的结构化反馈，复制成功或失败有明确提示

#### Scenario: Settings 最近文件更易扫描
- **WHEN** Settings 显示最近文件
- **THEN** 最近文件列表在路径较长时仍易扫描，并保留清除记录能力

### Requirement: Agent Workshop 前端状态 polish

Agent Workshop SHALL 优化 setup、ready、running、finished、failed、canceled、resume view 和 unsupported 状态的前端表达，但不得改变底层 agent workflow、IPC 参数、只读执行约束或记录持久化语义。

#### Scenario: 历史记录状态明确
- **WHEN** Agent Workshop 打开并恢复上次 completed、failed、canceled 或 interrupted record
- **THEN** UI 明确显示这是历史/终态记录，并提供新研讨、导出或查看 timeline 的清晰操作

#### Scenario: Running progress 不被配置挤压
- **WHEN** workshop 正在运行且窗口宽度不足
- **THEN** progress 和 timeline 保持可读，配置区可堆叠或收起，运行状态和停止操作仍清晰可见

#### Scenario: 不改变底层 workflow
- **WHEN** 用户启动、停止、导出或查看 Agent Workshop discussion
- **THEN** 底层 orchestration、runner、IPC、只读模式、message persistence 和 event subscription 行为与 polish 前一致
