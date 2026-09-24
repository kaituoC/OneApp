## MODIFIED Requirements

### Requirement: 顶部全局分组导航

应用 SHALL 在 workbench 顶部使用一行全局导航呈现编辑器、数据、文本、编码、时间、生成、研讨室七个一级分组，设置由独立按钮进入。

#### Scenario: 顶部一级入口可识别
- **WHEN** 用户启动应用并查看 workbench 顶部
- **THEN** 每个一级分组显示文字名称和当前分组的程序化 active state

#### Scenario: 顶部空间不足
- **WHEN** 应用窗口的宽度不足以同时容纳所有一级分组文字
- **THEN** 导航保留可访问名称并允许横向查看，且不会挤压主工具内容到不可用宽度

### Requirement: 分组选择与快捷键状态同步

应用 SHALL 用统一的工具激活状态同步顶部一级入口、context-bar 工具导航条、数字快捷键与循环快捷键。

#### Scenario: 返回分组恢复最近工具
- **WHEN** 用户通过顶部一级入口返回一个包含多个工具的分组
- **THEN** 应用切换到该分组最后一次激活的工具；没有记录时切换到第一个工具

#### Scenario: 快捷键更新最近工具
- **WHEN** 用户通过数字直达或 Ctrl+Tab / Ctrl+Shift+Tab 切换工具
- **THEN** 对应一级分组和工具导航条中的工具、子工具入口更新 active state，并记录该分组最近工具

### Requirement: 导航 chip 信息密度与可达性

工具与子工具 chips SHALL 常驻显示名称，完整说明与快捷键信息 SHALL 保留在悬停 tooltip 中；chips SHALL 支持键盘导航并保留完整的 accessible name。

#### Scenario: chip 不显示摘要与快捷键徽章
- **WHEN** 用户查看 context-bar 工具导航条
- **THEN** 工具与子工具 chip 显示名称，均不显示摘要文字或快捷键徽章

#### Scenario: 悬停显示完整信息
- **WHEN** 用户将指针悬停在任一工具 chip 上
- **THEN** tooltip 显示该工具名称、说明与快捷键的完整信息

#### Scenario: 键盘导航
- **WHEN** 键盘用户聚焦具体工具行的任一 chip 并按方向键或 Home / End
- **THEN** 焦点在同一行 chips 间按现有 segmented control 行为移动，chips 保留 accessible name

### Requirement: 导航条窄宽度收缩

应用 SHALL 在横向空间不足时让 context-bar 导航条横向滚动收缩，优先保护主内容区可用宽度。

#### Scenario: 窄窗口下导航条横向查看
- **WHEN** 应用窗口宽度不足以同时容纳全部导航 chips
- **THEN** 导航条允许横向滚动查看全部入口，主内容区不被挤压到不可用宽度，chips 保留 title 或 accessible name

## ADDED Requirements

### Requirement: context-bar 直达任务导航

应用 SHALL 在 context-bar 一行直接呈现当前分类的具体工具；仅有编辑器、研讨室或设置时不显示重复入口。数据、编码、时间、生成分类直接显示子工具；文本分类显示文本处理、文本对比和正则，文本处理内部操作通过模式选择器访问。

#### Scenario: 具体工具直达
- **WHEN** 用户进入数据分类
- **THEN** 第二行直接显示 JSON、YAML、CSV、SQL、XML，不重复显示数据工具父入口

#### Scenario: 单工具直达
- **WHEN** 用户进入编辑器、研讨室或设置
- **THEN** 直接显示内容，不占用空导航行

#### Scenario: 保留全部文本处理能力
- **WHEN** 用户进入文本处理
- **THEN** 可以访问大小写、命名风格、排序、去重，统计始终可见

#### Scenario: 子工具选择会话级记忆
- **WHEN** 同一会话中切走再返回某分类
- **THEN** 上次选中的工具和子工具保持激活

## REMOVED Requirements

### Requirement: context-bar 横向工具导航

**Reason**: 用户已审定新的交互结构，替换旧布局约定；原有功能继续保留。
**Migration**: 使用「context-bar 直达任务导航」需求，功能通过新入口继续访问。

