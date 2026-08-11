## MODIFIED Requirements

### Requirement: 结构化正则输入

正则测试器 SHALL 提供结构化的 pattern 输入：以 `/ [pattern] / [flags]` 形式呈现，pattern 为等宽字体单行输入框，flags（`g` `i` `m` `s` `u` `y`）为可切换的方块，并通过视觉与程序化状态表示是否启用。

#### Scenario: 输入 pattern 与切换 flag
- **WHEN** 用户在 pattern 输入框键入 `\d+` 并点亮 `g` 方块
- **THEN** 系统以 `new RegExp('\\d+', 'g')` 的等价配置执行匹配

#### Scenario: Flag 名称与状态可访问
- **WHEN** 用户通过键盘或辅助技术访问任一 flag
- **THEN** 控件暴露该 flag 的完整含义、当前开启/关闭状态，并可通过 Enter 或 Space 切换

#### Scenario: 非法正则就地报错
- **WHEN** 用户输入语法非法的 pattern（如未闭合分组 `(\d`）
- **THEN** 系统在 pattern 行下方以错误文字显示原因，且不抛出未捕获异常、不冻结界面

## ADDED Requirements

### Requirement: 匹配结果与当前输入快照一致

正则测试器 SHALL 只将匹配位置、高亮和结果列表应用到生成该结果的 pattern、flags 与测试文本快照，不得把旧位置应用到已经变化的新输入。

#### Scenario: Debounce 等待期间输入已变化
- **WHEN** 用户修改测试文本但新一轮 Worker 请求尚未完成
- **THEN** 预览显示当前原文且不套用旧匹配位置，旧结果列表不再表现为当前结果

#### Scenario: 丢弃乱序 Worker 结果
- **WHEN** 早期请求晚于新请求返回
- **THEN** 系统忽略早期结果，并只允许与当前完整输入签名一致的结果更新高亮和列表

#### Scenario: 当前请求完成
- **WHEN** Worker 返回的 generation 和完整输入签名均与当前输入一致
- **THEN** 系统同时更新匹配计数、高亮、捕获组和结果列表

### Requirement: Regex 结果区空间可调

正则测试器 SHALL 允许桌面用户在合理范围内调整测试/预览区与结果列表的空间，并在紧凑宽度下回退为可读的上下结构。

#### Scenario: 指针调整结果区
- **WHEN** 用户拖动测试区与结果区之间的分隔控件
- **THEN** 结果区高度在设定最小值和最大值之间变化，测试输入与 pattern control 保持可用

#### Scenario: 键盘调整与重置
- **WHEN** 键盘用户聚焦分隔控件
- **THEN** 用户可通过方向键调整尺寸，并通过可发现操作恢复默认比例

#### Scenario: 紧凑窗口自然堆叠
- **WHEN** Regex 可用空间不足以维持可调分栏
- **THEN** 测试/预览与结果列表按上下顺序显示，各区域具有可读最小高度且页面不产生不可控横向滚动
