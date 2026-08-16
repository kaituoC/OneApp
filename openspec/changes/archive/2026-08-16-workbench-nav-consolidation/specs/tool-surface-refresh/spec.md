## MODIFIED Requirements

### Requirement: Data Tools 操作与反馈收敛

Data Tools SHALL 根据 JSON、YAML、CSV、SQL、XML 当前模式将该模式的高频操作平铺为一排可直接执行的主操作按钮，并避免输出空态、panel chip 与页面状态条表达同一信息。

#### Scenario: JSON 高频操作平铺
- **WHEN** JSON 模式处于激活状态
- **THEN** 格式化、压缩、校验、去除转义与转 YAML 均作为一排主操作按钮直接可见，不将上述高频操作收纳进「更多」菜单

#### Scenario: 其他子工具主操作平铺
- **WHEN** YAML、CSV、SQL 或 XML 子工具处于激活状态
- **THEN** 该子工具的核心转换与校验操作作为一排主操作按钮直接可见，command bar 不再嵌套子工具切换控件

#### Scenario: 输出操作归属结果面板
- **WHEN** 页面显示输出或等待输出
- **THEN** 复制结果与清空操作位于输出 panel 上下文或明确的的结果操作区，不与格式处理动作混成同一无层级按钮组

#### Scenario: 空状态不重复
- **WHEN** 输入为空且尚无处理结果
- **THEN** 页面只显示一处主要的可执行空态提示，不同时出现同义的“待处理”和“等待输入”反馈

#### Scenario: JSONPath 查询按需展开
- **WHEN** 用户打开数据工具 JSON 子工具
- **THEN** JSONPath 查询区域默认折叠为一个可展开入口，展开后显示表达式输入与查询动作；查询成功、无匹配、JSON 无效与表达式无效的结果反馈行为保持与折叠前一致

### Requirement: Time 使用子工具导航

Time SHALL 将当前时间、时间转换、Cron 和多时区组织为四个可切换子任务，宽宽度下以双列 grid 并排呈现全部任务区，窄宽度下一次呈现一个子任务，而不是在一个长页面中无序堆叠全部任务。

#### Scenario: 默认显示当前时间概览
- **WHEN** 用户打开 Time
- **THEN** 当前时间与时间戳作为默认概览突出显示，并提供复制操作及可通过左侧导航访问的四个子任务入口

#### Scenario: 切换子工具保留输入
- **WHEN** 用户在转换、Cron 与时区之间切换后返回
- **THEN** 各子工具在本次页面生命周期内保留已有输入、选项和有效结果

#### Scenario: 紧凑高度首屏可操作
- **WHEN** Time 在 800×600 窗口显示任一子工具
- **THEN** 当前任务的输入、主要操作和主要结果在首屏可访问，不必经过其他不相关工具段落

#### Scenario: 宽屏双列并排
- **WHEN** Time 可用内容宽度不小于约 1100px
- **THEN** 当前时间、时间转换、Cron 与多时区四个任务区以双列 grid 并排呈现，页面不出现大面积空白或不必要的整页滚动

#### Scenario: 窄屏单列切换
- **WHEN** Time 可用内容宽度小于约 1100px
- **THEN** 页面一次仅显示当前选中的子任务区，切换子任务不丢失各区已有输入与结果

### Requirement: Encode 工具结构化 polish

Encode 工具 SHALL 将 Base64、URL、JWT、Hash、进制和 Unicode 子工具呈现为一致的结构化转换 surface，保留现有计算结果，并改善子导航、输入输出、错误状态与复制反馈。

#### Scenario: 子工具导航由左侧导航承载
- **WHEN** 用户打开 Encode 工具
- **THEN** 六个子工具入口在左侧上下文 navigation 中可发现、可切换，页面主体不再重复子导航控件，转换区不被持续挤压

#### Scenario: 双向转换面板一致
- **WHEN** 用户使用 Base64、URL 或 Unicode 子工具
- **THEN** 输入、方向切换、输出、错误和复制操作以一致 panel layout 呈现

#### Scenario: JWT 和 Hash 输出结构化
- **WHEN** JWT decode 或 Hash 计算产生结果
- **THEN** Header/Payload/Signature、时间字段和多算法 hash 结果使用结构化 output row/card 呈现，并为可复制内容提供一致反馈

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
- **THEN** 子工具 navigation 由左侧上下文 navigation 承载并在窄宽度下随之收窄，主转换区域保持可读

#### Scenario: Agent Workshop 配置栏可适配窄宽度
- **WHEN** Agent Workshop 的左侧配置栏与 timeline 区域在窄宽度下冲突
- **THEN** 配置区可收起、堆叠到顶部或切换为 compact 模式，timeline 和 idea input 不被压到不可用宽度

### Requirement: Generator tool surface

Generator SHALL follow the shared tool surface pattern used by other first-level tools while presenting UUID, password, Lorem and QR-code sub-tools through the left contextual navigation as a compact generation workflow.

#### Scenario: Generator uses shared surface
- **WHEN** the Generator tool is active
- **THEN** the system displays a command area, configuration panel, output panel, status feedback, and copy feedback using the shared tool surface styles, with sub-tool switching provided by the left contextual navigation

#### Scenario: Generator sub-tools are navigable
- **WHEN** the Generator tool is active
- **THEN** UUID、随机密码、Lorem 和二维码子工具在左侧导航可发现、可切换，并且切换不会丢失无关一级工具状态

#### Scenario: Generator adapts to narrow width
- **WHEN** the Generator tool does not have enough horizontal space for a comfortable configuration and output layout
- **THEN** configuration and output areas stack vertically while remaining readable and operable
