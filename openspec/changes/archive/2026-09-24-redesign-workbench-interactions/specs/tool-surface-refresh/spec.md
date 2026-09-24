## MODIFIED Requirements

### Requirement: Agent Workshop 前端采用三阶段布局

Agent Workshop SHALL 将现有状态映射为准备、运行和结果三阶段，保持当前阶段主要操作可见并消除重复入口，同时不改变后端行为。

#### Scenario: 准备阶段主操作可见
- **WHEN** 用户配置 repository、agents、moderator 和 idea
- **THEN** 仓库、想法与开始研讨集中在主区域，Agent/主持配置在辅助区，代理配置按需展开；所有连接检测和配置能力保留

#### Scenario: 运行阶段突出进度和停止
- **WHEN** discussion 正在运行
- **THEN** timeline 成为主要内容，阶段进度和停止操作清晰可见，已冻结配置不形成独立竞争滚动区

#### Scenario: 结果阶段动作不重复
- **WHEN** 用户查看 completed、failed、canceled 或 restored record
- **THEN** 新研讨、导出和查看 timeline 各保留一个明确入口，不在配置区与结果 banner 重复出现同一主要动作

#### Scenario: 前端重排不改变研讨边界
- **WHEN** 用户启动、停止、恢复查看或导出 discussion
- **THEN** orchestration、runner、IPC payload、只读约束、事件订阅和记录持久化语义与变更前一致

### Requirement: Time 和 Settings 使用结构化表单

Time 和 Settings SHALL 使用结构化 dashboard 或 settings layout，而不是普通堆叠控件。

#### Scenario: Time dashboard 突出实时值
- **WHEN** Time 的时间转换子任务处于激活状态
- **THEN** 当前 datetime 和 timestamp 在视觉上被强调，并保留 copy action

#### Scenario: 转换表单保持紧凑
- **WHEN** 用户将时间戳转为日期或将日期转为时间戳
- **THEN** 刷新后的 layout 按转换任务分组展示 input、unit、output format、result 和 copy action

#### Scenario: Settings 快捷键说明准确
- **WHEN** Settings 工具显示键盘快捷键帮助
- **THEN** 它说明数字导航覆盖 1 到 9 和 0 号工具

### Requirement: 统一响应式 workspace 策略

编辑器在支持的最小窗口维持三栏且允许用户手动收起面板；其他多栏或带侧栏的工具 SHALL 在横向空间不足时按统一 responsive workspace 策略降级，优先保证主输入、主结果或 timeline 可读；除代码/文本编辑内容自身可横向滚动外，页面整体不得依赖不可控的横向滚动维持可用性。

#### Scenario: Wide 宽度保留高效并排
- **WHEN** 主工作区宽度充足
- **THEN** JSON、Diff、Text Processing、Regex、Encode 和 Agent Workshop 可保持并排或多栏布局，以支持快速比较和编辑

#### Scenario: Medium 宽度收起次级区域
- **WHEN** 编辑器以外的工具因 DevTools 或窗口尺寸导致横向空间减少
- **THEN** 工具页优先收起或转移次级导航、quick reference、preview、配置栏等辅助区域，而不是把主输入或主结果压缩到不可读宽度

#### Scenario: Compact 宽度改为上下结构
- **WHEN** 编辑器以外的工具可用宽度不足以舒适展示两个主要 panel
- **THEN** 对应工具切换为上下 stack、顶部 segmented 子导航或单 panel 切换，主要内容区域保持可读和可操作

### Requirement: 多栏工具具备 responsive fallback

编辑器 SHALL 在支持的 800px 最小窗口保留目录、编辑、预览左右三栏及独立开关。其他双栏或多栏工具 SHALL 在横向空间不足时采用 stack、drawer、compact navigation 或其他 responsive fallback，避免固定宽度侧栏和多 panel 同时挤压主工作区。

#### Scenario: JSON 和 Diff 双栏可降级
- **WHEN** JSON 或 Diff 工具的可用宽度不足以舒适展示两个并排 panel
- **THEN** 输入/输出或原文/新文区域切换为上下 stack，或提供清晰的单 panel 切换方式

#### Scenario: Regex 速查不挤压匹配区域
- **WHEN** Regex 工具打开 quick reference 且横向空间不足
- **THEN** quick reference 使用 drawer、底部区域或 overlay 方式展示，不持续压缩测试文本和匹配预览到不可用宽度

#### Scenario: Encode 子导航不固定抢占空间
- **WHEN** Encode 工具的横向空间不足
- **THEN** 子工具 navigation 由 context-bar 横向导航条承载并支持横向滚动，主转换区域保持可读

#### Scenario: Agent Workshop 配置栏可适配窄宽度
- **WHEN** Agent Workshop 的左侧配置栏与 timeline 区域在窄宽度下冲突
- **THEN** 配置区可收起、堆叠到顶部或切换为 compact 模式，timeline 和 idea input 不被压到不可用宽度

## ADDED Requirements

### Requirement: Editor 默认三栏工作区

Editor surface SHALL 保留 file tree、editor panel 和 preview panel workflow，同时用更紧凑、更清晰的方式呈现 layout control。

#### Scenario: 默认文档首次进入显示 Preview
- **WHEN** 用户首次切换到 Editor，且当前是默认 Markdown 文档
- **THEN** Editor 默认从左到右展示 file tree、editor panel 和 preview panel，各栏可独立滚动

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

### Requirement: Time 独立任务与转换方向

Time SHALL 提供时间转换、Cron、多时区三个独立子任务；所有宽度均仅呈现当前任务。时间转换通过方向选择切换时间戳转日期或日期转时间戳，保留当前时间概览、秒/毫秒、全部日期格式与复制能力。

#### Scenario: 时间转换方向
- **WHEN** 用户切换转换方向
- **THEN** 显示对应输入与结果，各方向已有输入与结果保留

#### Scenario: 子任务隔离
- **WHEN** 用户选择 Cron 或多时区
- **THEN** 仅显示该任务，保留原有解释、未来五次、城市增删与对照能力

#### Scenario: 时间转换页常驻当前时间概览
- **WHEN** 用户选择时间转换
- **THEN** 页面顶部显示实时日期与时间戳，保留秒/毫秒切换和复制

#### Scenario: 切换子工具保留输入
- **WHEN** 用户在时间转换、Cron 和时区之间切换后返回
- **THEN** 本次页面生命周期内各工具输入、选项与有效结果保持

#### Scenario: 紧凑高度可操作
- **WHEN** 时间工具以 800×600 窗口显示
- **THEN** 当前任务主要操作可访问，不必经过不相关工具段落

#### Scenario: 宽屏输入结果并排
- **WHEN** 时间转换拥有足够宽度
- **THEN** 输入与结果并排显示，Cron 和多时区仍由独立入口访问


### Requirement: Editor 文件工作区可读性

Editor SHALL 在不改变文件打开、保存、mode 推断、预览和导出语义的前提下，优化 file tree、editor panel 和 preview panel 的视觉与空间管理，使空文档和窄宽度场景更可用。

#### Scenario: 空内容保留预览入口
- **WHEN** 用户进入 Editor 且当前内容为空或仅为默认新建模板
- **THEN** Markdown/HTML 默认保留三栏结构，用户可通过独立 Preview control 收起或恢复预览

#### Scenario: File tree 工具栏使用专业图标
- **WHEN** 用户查看 file tree toolbar 或 tree node
- **THEN** 打开目录、显示隐藏项、刷新、文件夹和文件等视觉元素使用与应用一致的 icon-assisted style，而不是 emoji 或难以理解的文本符号

#### Scenario: File tree 保持可读
- **WHEN** Editor 同时显示 file tree、editor 和 preview 且横向空间不足
- **THEN** file tree 保持可读最小宽度或进入明确的收起状态，不得被压缩成只剩图标的竖条

## REMOVED Requirements

### Requirement: Editor workbench surface

**Reason**: 用户已审定新的交互结构，替换旧布局约定；原有功能继续保留。
**Migration**: 使用「Editor 默认三栏工作区」需求，功能通过新入口继续访问。

### Requirement: Time 使用子工具导航

**Reason**: 用户已审定新的交互结构，替换旧布局约定；原有功能继续保留。
**Migration**: 使用「Time 独立任务与转换方向」需求，功能通过新入口继续访问。

### Requirement: Editor 文件工作区 polish

**Reason**: 用户已审定新的交互结构，替换旧布局约定；原有功能继续保留。
**Migration**: 使用「Editor 文件工作区可读性」需求，功能通过新入口继续访问。

