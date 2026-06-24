## ADDED Requirements

### Requirement: 共享 tool surface primitives

所有一级工具 SHALL 复用一组实际被模板引用的 tool surface primitives，用于 command bar、panel、panel header、segmented control、icon button、status chip、empty state 和 copy feedback；未被使用的共享样式不得保留为死代码。

#### Scenario: 工具页使用一致 primitives
- **WHEN** 用户查看 Editor、JSON、Diff、Regex、Encode、Time、Agent Workshop 或 Settings
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
- **THEN** JSON、Diff、Regex、Encode 和 Agent Workshop 可保持并排或多栏布局，以支持快速比较和编辑

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

JSON、Diff、Regex、Time 和 Settings SHALL 在现有功能语义不变的前提下，强化空态、结果态、错误态、复制反馈和主次操作层级。

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
