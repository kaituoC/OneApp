## Why

数据工具已经承载 JSON / YAML / CSV / SQL / XML 常用处理，下一步需要补齐对 JSON 结构的定向查询能力，让用户无需离开 OneApp 就能从复杂 JSON 中快速定位字段、数组项或对象片段。

JSONPath 查询属于高频、低风险的 JSON 增强项，适合并入现有数据工具的 JSON 子工具，而不是另起一级入口。

## What Changes

- 在数据工具的 JSON 子工具中新增 JSONPath 查询输入区。
- 用户输入 JSON 内容和 JSONPath 表达式后，可以执行查询并在输出面板查看格式化 JSON 结果。
- 查询结果支持标量、对象、数组等 JSON 可序列化值；多匹配结果以数组形式展示。
- JSON 无效、JSONPath 表达式无效、无匹配时展示明确状态。
- 不做编辑器内节点高亮、查询历史、结果反向定位、文件导入导出或超大 JSON 虚拟化。

## Capabilities

### New Capabilities

- `jsonpath-query`: 数据工具中的 JSONPath 查询能力，包括表达式输入、结果输出和错误/空结果状态。

### Modified Capabilities

- `json-yaml-conversion`: JSON 子工具在保留现有 JSON/YAML 操作的基础上增加 JSONPath 查询入口。

## Impact

- 渲染层：`JsonTab.vue` 新增 JSONPath 表达式控件和查询动作。
- 工具函数：新增 JSONPath helper，保持纯函数并覆盖单测。
- 依赖：引入成熟轻量 JSONPath 库，用于解析和执行表达式。
- 文档与规格：更新 README、ROADMAP、OpenSpec 主规格和剩余功能队列。
