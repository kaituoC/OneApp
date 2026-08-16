## REMOVED Requirements

### Requirement: 左侧上下文工具导航

**Reason**: 固定宽度全高侧栏在单工具分组下产生大面积空白，空间性价比低；二级工具入口迁移至 context-bar 横向导航条，主内容区宽度净增 184px。
**Migration**: 见本变更 ADDED 的「context-bar 横向工具导航」requirement；工具切换、子工具选择与状态同步行为由新入口承接。

## MODIFIED Requirements

### Requirement: 分组选择与快捷键状态同步

应用 SHALL 用统一的工具激活状态同步顶部一级入口、context-bar 工具导航条、数字快捷键与循环快捷键。

#### Scenario: 返回分组恢复最近工具
- **WHEN** 用户通过顶部一级入口返回一个包含多个工具的分组
- **THEN** 应用切换到该分组最后一次激活的工具；没有记录时切换到第一个工具

#### Scenario: 快捷键更新最近工具
- **WHEN** 用户通过数字直达或 Ctrl+Tab / Ctrl+Shift+Tab 切换工具
- **THEN** 对应一级分组和工具导航条中的工具、子工具入口更新 active state，并记录该分组最近工具

## ADDED Requirements

### Requirement: context-bar 横向工具导航

应用 SHALL 在 context-bar 横条内呈现当前一级分组的工具导航：固定段渲染该分组全部工具的图标与名称 chips，分隔符后的动态段渲染当前激活工具的子工具名称 chips。

#### Scenario: 多工具分组显示工具 chips
- **WHEN** 用户激活数据处理或文本调试等包含多个工具的分组
- **THEN** context-bar 固定段显示该分组全部工具的图标与名称 chip，当前工具为选中态

#### Scenario: 激活工具的子工具跟随显示
- **WHEN** 当前工具在 `SUB_TOOLS` 中定义了子工具
- **THEN** 固定段之后的动态段显示该工具全部子工具名称 chip，当前子工具为选中态；切换工具时动态段整体替换为新工具的子工具

#### Scenario: 单工具分组直达内容
- **WHEN** 用户激活工作区、生成工具、AI 或系统等只包含一个工具的分组
- **THEN** 不渲染任何侧栏或空白导航列，工具内容使用完整横向空间，context-bar 仅呈现该工具入口

#### Scenario: 子工具选择会话级记忆
- **WHEN** 用户在同一会话中从一个工具切走再切回
- **THEN** 该工具上次选中的子工具保持选中状态；会话内未选择过时使用第一个子工具

### Requirement: 导航 chip 信息密度与可达性

工具与子工具 chips SHALL 仅常驻显示图标与名称，完整说明与快捷键信息 SHALL 保留在悬停 tooltip 中；chips SHALL 支持键盘导航并保留完整的 accessible name。

#### Scenario: chip 不显示摘要与快捷键徽章
- **WHEN** 用户查看 context-bar 工具导航条
- **THEN** 工具 chip 仅显示图标与名称，子工具 chip 仅显示名称，均不显示摘要文字或快捷键徽章

#### Scenario: 悬停显示完整信息
- **WHEN** 用户将指针悬停在任一工具 chip 上
- **THEN** tooltip 显示该工具名称、说明与快捷键的完整信息

#### Scenario: 键盘导航
- **WHEN** 键盘用户聚焦固定段或动态段的任一 chip 并按方向键或 Home / End
- **THEN** 焦点在同段 chips 间按现有 segmented control 行为移动，chips 保留 accessible name

### Requirement: 导航条窄宽度收缩

应用 SHALL 在横向空间不足时让 context-bar 导航条横向滚动收缩，优先保护主内容区可用宽度。

#### Scenario: 窄窗口下导航条横向查看
- **WHEN** 应用窗口宽度不足以同时容纳全部导航 chips
- **THEN** 导航条允许横向滚动查看全部入口，主内容区不被挤压到不可用宽度，chips 保留 title 或 accessible name
