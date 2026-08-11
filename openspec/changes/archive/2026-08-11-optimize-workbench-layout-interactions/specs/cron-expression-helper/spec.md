## MODIFIED Requirements

### Requirement: Cron 表达式解释器

时间工具 SHALL provide a standard 5-field Cron expression helper that validates the expression, explains it in readable text, previews the next 5 run times using the local system time zone, and automatically explains the initial valid default expression.

#### Scenario: 默认表达式自动解释
- **WHEN** 用户首次进入 Cron 子工具且默认表达式合法
- **THEN** 系统无需额外点击即可展示人类可读解释和未来 5 次执行时间

#### Scenario: 标准表达式解释
- **WHEN** 用户输入合法的 5 位 Cron 表达式并执行解释
- **THEN** 系统展示人类可读解释和未来 5 次执行时间

#### Scenario: 支持步进和范围
- **WHEN** Cron 字段包含 `*`、列表、范围或步进语法
- **THEN** 系统按标准字段范围解析并计算未来执行时间

#### Scenario: 字段数量错误
- **WHEN** 用户输入的 Cron 表达式不是 5 个字段
- **THEN** 系统展示标准 5 位 Cron 格式错误

#### Scenario: 字段越界或语法错误
- **WHEN** Cron 字段包含越界数值、无效范围或无效步进
- **THEN** 系统展示具体字段的错误原因，并不输出误导性执行时间

#### Scenario: 无法计算未来时间
- **WHEN** 表达式合法但在可计算窗口内无法找到未来 5 次执行时间
- **THEN** 系统展示无法计算的明确错误
