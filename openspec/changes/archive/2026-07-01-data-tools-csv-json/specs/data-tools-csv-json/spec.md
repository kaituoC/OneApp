## ADDED Requirements

### Requirement: CSV 子工具

数据工具 SHALL provide a CSV sub-tool for CSV to JSON conversion, JSON to CSV conversion, and read-only table preview.

#### Scenario: CSV 转 JSON
- **WHEN** 用户输入带表头的有效 CSV 并执行 CSV 转 JSON
- **THEN** 系统输出格式化 JSON 对象数组，每个对象使用表头作为 key

#### Scenario: JSON 转 CSV
- **WHEN** 用户输入 JSON 对象数组并执行 JSON 转 CSV
- **THEN** 系统输出 CSV，字段来自所有对象 key 的并集

#### Scenario: CSV 表格预览
- **WHEN** 用户输入有效 CSV 并执行表格预览
- **THEN** 系统显示只读二维表格，并允许横向滚动查看宽表

#### Scenario: CSV 标准转义
- **WHEN** CSV 包含双引号包裹字段、字段内逗号、字段内换行或双引号转义
- **THEN** 系统正确解析字段值，而不是按原始逗号或换行错误拆列

#### Scenario: CSV 输入错误
- **WHEN** CSV 为空、缺少表头或数据行列数与表头不一致
- **THEN** 系统展示明确错误并不输出误导性 JSON 或表格预览

#### Scenario: JSON 转 CSV 输入错误
- **WHEN** 用户执行 JSON 转 CSV 但输入不是 JSON 对象数组
- **THEN** 系统展示明确错误并不输出 CSV
