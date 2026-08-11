## ADDED Requirements

### Requirement: 工具页采用统一工作流模板

一级工具 SHALL 按任务性质采用双栏转换器、配置 + 结果或任务流模板，并共享 command bar、panel、empty state、status 与 responsive primitive。

#### Scenario: 双栏转换器模板
- **WHEN** 用户打开 Data Tools、Diff、Text Processing、Encode 或 Regex
- **THEN** 页面以清晰的输入、主操作和结果关系呈现，宽屏可并排，紧凑宽度可堆叠或切换单 panel

#### Scenario: 配置与结果模板
- **WHEN** 用户打开 Generator
- **THEN** 配置区根据实际控件内容确定尺寸，结果区获得剩余可用空间，并且空结果说明下一步可执行操作

#### Scenario: 任务流模板
- **WHEN** 用户打开 Agent Workshop
- **THEN** 页面根据当前状态突出准备、运行或结果阶段，并只显示该阶段必要的主要操作与上下文

### Requirement: Command bar 保持单行操作层级

工具页 SHALL 区分当前模式的主要操作、次级操作和结果操作，紧凑宽度不得仅依靠按钮自动换成多行来维持全部功能。

#### Scenario: 宽屏显示主要与常用次级操作
- **WHEN** command bar 有足够宽度
- **THEN** 当前模式的一个主要操作与常用次级操作按稳定顺序显示，复制和清空等结果操作靠近对应 panel

#### Scenario: 窄屏收纳低频操作
- **WHEN** command bar 的可用宽度不足
- **THEN** 一个主要操作保持可见，低频操作进入带明确名称的更多菜单，command bar 不因多行换行持续挤压内容高度

#### Scenario: 收纳不改变功能结果
- **WHEN** 用户从更多菜单触发原有格式化、校验、转换或清理操作
- **THEN** 产生的结果、错误和状态更新与宽屏直接按钮一致

### Requirement: Editor 面板控制与新建菜单语义明确

Editor SHALL 将可并存的文件列表、编辑区和预览区呈现为独立显示开关，并提供完整键盘可操作的新建菜单。

#### Scenario: 面板开关可并存
- **WHEN** 用户查看或操作列表、编辑、预览控制
- **THEN** 控件明确表达每个 panel 的显示/隐藏状态，而不是表现为只能选择一项的互斥 segmented control

#### Scenario: 新建菜单键盘操作
- **WHEN** 用户通过键盘打开 Editor 新建菜单
- **THEN** 用户可以移动到 Markdown、HTML 或纯文本选项、执行选中项、按 Escape 关闭，并在关闭后将焦点返回触发按钮

### Requirement: Data Tools 操作与反馈收敛

Data Tools SHALL 根据 JSON、YAML、CSV、SQL、XML 当前模式突出一个主要操作，并避免输出空态、panel chip 与页面状态条表达同一信息。

#### Scenario: JSON 操作主次清晰
- **WHEN** JSON 模式处于激活状态
- **THEN** 格式化作为主要操作保持可见，压缩、校验、去除转义、转 YAML 与 JSONPath 查询作为分组后的次级操作可访问

#### Scenario: 输出操作归属结果面板
- **WHEN** 页面显示输出或等待输出
- **THEN** 复制结果与清空操作位于输出 panel 上下文或明确的结果操作区，不与格式处理动作混成同一无层级按钮组

#### Scenario: 空状态不重复
- **WHEN** 输入为空且尚无处理结果
- **THEN** 页面只显示一处主要的可执行空态提示，不同时出现同义的“待处理”和“等待输入”反馈

### Requirement: Diff 空态与禁用状态可区分

Diff SHALL 在保持显式对比和可逆编辑流程的前提下，让不可执行操作与尚未生成结果的状态清晰可见。

#### Scenario: 空输入主操作不可用
- **WHEN** 文本 A 或文本 B 不满足对比条件
- **THEN** 对比按钮的 disabled 视觉和语义与可执行的 primary button 明显不同

#### Scenario: 尚未比较时切换结果视图
- **WHEN** 用户尚未生成结果并查看并排/统一视图控制
- **THEN** 控件被禁用或页面明确提示需要先执行对比，不产生无反馈的状态切换

### Requirement: Text Processing 结果密度匹配任务

Text Processing SHALL 根据统计与文本转换任务采用不同的结果密度，并避免重复状态反馈。

#### Scenario: 统计模式使用指标卡
- **WHEN** 用户选择文本统计
- **THEN** 字符数、字节数、单词数、行数等结果以紧凑、易扫描的指标卡使用可用空间

#### Scenario: 转换模式保留输入输出关系
- **WHEN** 用户选择大小写、命名风格、排序或去重
- **THEN** 页面继续显示清晰的输入/输出关系和结果相关错误，不额外显示与全局 status bar 重复的空状态条

### Requirement: Encode 转换方向清晰

Encode SHALL 分离“当前转换方向”和“执行切换方向”两种含义，并为尚无输出的页面提供可执行提示。

#### Scenario: 双向工具显示当前方向
- **WHEN** 用户使用 Base64、URL 或 Unicode
- **THEN** 控件以文字与状态语义说明当前是编码还是解码，并提供独立的方向切换动作

#### Scenario: 空输出提供下一步
- **WHEN** 当前子工具尚无输出
- **THEN** 输出 panel 显示与当前子工具和方向相关的输入提示或示例，而不是只有大面积空白

### Requirement: Generator 配置区按内容适配

Generator SHALL 让配置区尺寸匹配 UUID、密码、Lorem 或二维码当前子工具的实际配置量，并让生成动作与空结果保持清晰。

#### Scenario: 少量配置不占满整页
- **WHEN** UUID 等子工具只有少量配置项
- **THEN** 配置 panel 使用内容驱动的高度或宽度，不以固定整页尺寸挤压结果区

#### Scenario: 紧凑窗口配置与结果堆叠
- **WHEN** 可用宽度不足以并排显示配置和结果
- **THEN** 两区按“配置、生成、结果”顺序堆叠，主要生成动作在配置完成后可见

### Requirement: Time 使用子工具导航

Time SHALL 将当前时间、时间转换、Cron 和多时区组织为四个可切换子工具，而不是在一个长页面中同时堆叠全部任务。

#### Scenario: 默认显示当前时间概览
- **WHEN** 用户打开 Time
- **THEN** 当前时间与时间戳作为默认概览突出显示，并提供复制操作及四个子工具入口

#### Scenario: 切换子工具保留输入
- **WHEN** 用户在转换、Cron 与时区之间切换后返回
- **THEN** 各子工具在本次页面生命周期内保留已有输入、选项和有效结果

#### Scenario: 紧凑高度首屏可操作
- **WHEN** Time 在 800×600 窗口显示任一子工具
- **THEN** 当前任务的输入、主要操作和主要结果在首屏可访问，不必经过其他不相关工具段落

### Requirement: Agent Workshop 前端采用三阶段布局

Agent Workshop SHALL 将现有状态映射为准备、运行和结果三阶段，保持当前阶段主要操作可见并消除重复入口，同时不改变后端行为。

#### Scenario: 准备阶段主操作可见
- **WHEN** 用户配置 repository、agents、moderator 和 idea
- **THEN** 准备信息按任务顺序呈现，开始研讨操作固定在当前阶段的可见区域，不被长配置推到不可发现位置

#### Scenario: 运行阶段突出进度和停止
- **WHEN** discussion 正在运行
- **THEN** timeline 成为主要内容，阶段进度和停止操作清晰可见，已冻结配置不形成独立竞争滚动区

#### Scenario: 结果阶段动作不重复
- **WHEN** 用户查看 completed、failed、canceled 或 restored record
- **THEN** 新研讨、导出和查看 timeline 各保留一个明确入口，不在配置区与结果 banner 重复出现同一主要动作

#### Scenario: 前端重排不改变研讨边界
- **WHEN** 用户启动、停止、恢复查看或导出 discussion
- **THEN** orchestration、runner、IPC payload、只读约束、事件订阅和记录持久化语义与变更前一致

### Requirement: Settings 使用紧凑分区

Settings SHALL 将高频界面设置、最近文件、快捷键和关于信息组织为可快速扫描的紧凑分区。

#### Scenario: 界面设置集中显示
- **WHEN** 用户打开 Settings
- **THEN** 主题与字号等高频界面设置在同一紧凑区域可见并继续即时生效

#### Scenario: 最近文件使用稳定行结构
- **WHEN** Settings 显示多个长路径最近文件
- **THEN** 每项使用稳定行布局、可识别的截断与完整路径提示，而不是不等宽 chip 无序换行

#### Scenario: 次要信息可直接访问
- **WHEN** 用户需要快捷键或关于信息
- **THEN** 用户可通过二级分段或折叠区访问，且不必滚过全部最近文件内容

### Requirement: 页面状态反馈按作用域呈现

工具页 SHALL 由全局 status bar 承载当前工具与短反馈，由 panel 内状态承载结果相关的 error、warning、running 和 ready 信息。

#### Scenario: 短反馈进入全局状态区
- **WHEN** 用户完成格式化、生成、转换或清理等短操作
- **THEN** 全局 status area 可以显示简短反馈，页面不再额外永久占用一行重复状态条

#### Scenario: 结果错误留在对应 panel
- **WHEN** 当前输入产生错误或结果需要警告
- **THEN** error 或 warning 显示在对应输入/输出 panel 的上下文中，不仅依赖全局状态文字

### Requirement: 默认与最小窗口均保持核心任务可用

全部一级工具 SHALL 在 1200×800 默认窗口和 800×600 最小窗口保持主要任务可见、可操作，并支持深浅主题及 14px/18px 字号。

#### Scenario: 默认窗口无竞争滚动
- **WHEN** 工具页以 1200×800 和 14px 字号显示
- **THEN** 页面主要结构无不必要的嵌套纵向滚动、横向溢出或重复主操作

#### Scenario: 最小窗口保护主要内容
- **WHEN** 工具页以 800×600 显示
- **THEN** navigation 和次要区域按统一策略收起或重排，主要输入、结果或 timeline 不被固定侧栏与多行 command bar 挤压到不可用

#### Scenario: 放大字号不破坏操作
- **WHEN** 用户在深色或浅色主题使用 18px 编辑字号
- **THEN** 控件 label、panel 标题、状态和核心内容保持可读，不发生页面级不可控横向滚动
