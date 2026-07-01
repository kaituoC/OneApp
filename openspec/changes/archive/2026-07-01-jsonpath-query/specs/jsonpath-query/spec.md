## ADDED Requirements

### Requirement: JSONPath 查询
数据工具 SHALL provide JSONPath query capability inside the JSON sub-tool, allowing users to query the current JSON input with a JSONPath expression and view the result in the existing output panel.

#### Scenario: 查询单个对象字段
- **WHEN** 用户输入有效 JSON 和可匹配单个值的 JSONPath 表达式并执行查询
- **THEN** 系统输出该匹配值的格式化 JSON 表示

#### Scenario: 查询多个数组项
- **WHEN** 用户输入有效 JSON 和可匹配多个值的 JSONPath 表达式并执行查询
- **THEN** 系统以数组形式输出所有匹配值，并保持格式化 JSON

#### Scenario: 查询结果为空
- **WHEN** 用户输入有效 JSON 和合法 JSONPath 表达式但没有任何匹配
- **THEN** 系统展示无匹配状态，并不输出误导性数据

#### Scenario: JSON 输入无效
- **WHEN** 用户执行 JSONPath 查询但 JSON 输入无法解析
- **THEN** 系统展示 JSON 解析错误，并不执行查询

#### Scenario: JSONPath 表达式无效
- **WHEN** 用户执行 JSONPath 查询但表达式为空或语法无效
- **THEN** 系统展示明确 JSONPath 错误，并不输出误导性结果
