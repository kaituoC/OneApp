# accessible-workbench-interactions Specification

## Purpose
TBD - created by archiving change optimize-workbench-layout-interactions. Update Purpose after archive.
## Requirements
### Requirement: 选择状态具有程序化语义

Workbench navigation、子工具导航、segmented control、toggle 和 Regex flags SHALL 使用与其真实行为匹配的原生或 ARIA 状态语义，不只依赖 `.active` 视觉样式。

#### Scenario: 当前页面导航可识别
- **WHEN** 一级导航或子工具入口处于当前页面
- **THEN** 控件通过 `aria-current`、tab selection 或等价原生语义暴露当前状态

#### Scenario: 独立开关可识别
- **WHEN** 面板显示开关或 Regex flag 被开启或关闭
- **THEN** 控件通过 `aria-pressed`、checkbox 或等价原生语义暴露名称与开关状态

#### Scenario: 互斥选择可识别
- **WHEN** 主题、字号、转换方向或结果视图只能选择一项
- **THEN** 控件使用 radio、tab 或等价互斥选择语义，并暴露选中项

### Requirement: 菜单支持完整键盘操作

Workbench 中的下拉菜单和更多操作菜单 SHALL 使用可聚焦控件并支持一致的打开、移动、执行与关闭行为。

#### Scenario: 键盘打开并执行菜单项
- **WHEN** 用户聚焦菜单触发按钮并按 Enter 或 Space
- **THEN** 菜单打开、焦点进入可用项，用户可通过方向键移动并按 Enter 执行选中项

#### Scenario: 关闭菜单恢复焦点
- **WHEN** 用户按 Escape、点击菜单外部或执行菜单项
- **THEN** 菜单关闭，并在适用时把焦点返回触发按钮

#### Scenario: 禁用菜单项不可执行
- **WHEN** 某个菜单操作在当前状态不可用
- **THEN** 该项通过 disabled/ARIA 状态暴露不可用，且键盘与指针均不能触发该操作

### Requirement: 控件名称与状态不依赖视觉猜测

Icon-only control、单字母 flag、缩略 label 和状态颜色 SHALL 提供可访问名称与必要的文字状态信息。

#### Scenario: Icon-only 控件有名称
- **WHEN** 控件只显示图标
- **THEN** 控件具有准确的 `aria-label`，并通过 title 或相邻说明帮助指针用户理解操作

#### Scenario: Regex flag 说明完整
- **WHEN** 用户聚焦 `g`、`i`、`m`、`s`、`u` 或 `y` flag
- **THEN** 辅助技术可以获得 flag 的完整含义及当前开启/关闭状态

#### Scenario: 状态不只依赖颜色
- **WHEN** 页面显示 success、error、warning、running、selected 或 disabled 状态
- **THEN** 状态同时通过文字、图标、边框或程序化属性表达，不以颜色作为唯一线索

### Requirement: 文本对比度与焦点可见

深色和浅色主题 SHALL 为小号正文、placeholder、行号、快捷键和次要说明提供足够对比度，并保持一致的键盘焦点样式。

#### Scenario: 小号文字达到最低对比度
- **WHEN** 小于大文本阈值的必要文字显示在默认 surface 上
- **THEN** 前景与背景对比度至少达到 4.5:1；纯装饰内容可以不受此要求约束

#### Scenario: 键盘焦点跨主题可见
- **WHEN** 用户通过 Tab 或方向键聚焦任一可操作控件
- **THEN** 深色和浅色主题都显示不被裁切、与相邻背景清晰区分的 focus indicator

#### Scenario: Disabled 状态仍可理解
- **WHEN** primary 或 secondary action 被禁用
- **THEN** 控件与可执行状态具有清晰差异，同时 label 仍保持可读

### Requirement: 滚动区域可预测且可通过键盘使用

工具页 SHALL 避免相邻或嵌套的竞争性纵向滚动，并为必要的内部滚动区提供可聚焦名称或明确上下文。

#### Scenario: 键盘用户识别内部结果区
- **WHEN** code、table、result list 或 timeline 需要独立滚动
- **THEN** 滚动区可以获得键盘焦点并具有可访问名称或由可见 heading 标记

#### Scenario: 最小窗口滚动目标明确
- **WHEN** 用户在 800×600 窗口通过 Page Up、Page Down 或方向键浏览工具页
- **THEN** 页面不会因多个无名称的同向滚动容器导致焦点与滚动位置不可预测

