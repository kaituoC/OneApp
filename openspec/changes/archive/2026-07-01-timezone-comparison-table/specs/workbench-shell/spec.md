## MODIFIED Requirements

### Requirement: Context shell surface
Workbench shell SHALL 围绕当前工具提供一致的 context 和 status surface。

#### Scenario: 当前工具上下文可见
- **WHEN** 任意一级工具处于激活状态
- **THEN** shell 显示当前工具名称，以及当前编辑文件或工具状态等可用 context detail

#### Scenario: Context bar 在窄宽度下保持可读
- **WHEN** 当前文件路径、工具说明或 meta chip 与可用宽度冲突
- **THEN** context bar 保留当前工具名称和关键 context，将低优先级 meta chip 隐藏、收缩或移入 tooltip，避免与内容重叠

#### Scenario: Status bar 覆盖全部工具
- **WHEN** Agent Workshop 或任意其他一级工具处于激活状态
- **THEN** status area 显示该工具的人类可读 label，并且不会显示空值或 undefined

#### Scenario: 时间工具摘要包含时区能力
- **WHEN** 用户查看时间工具导航说明或上下文摘要
- **THEN** 系统可体现时间工具包含日期、时间戳、Cron 和多时区对照能力
