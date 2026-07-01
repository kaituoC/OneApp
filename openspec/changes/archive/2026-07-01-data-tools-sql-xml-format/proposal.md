## Why

数据工具已经收敛 JSON / YAML / CSV 能力，SQL 和 XML 是同一类高频结构化文本格式。把 SQL / XML 轻量格式化加入数据工具，可以补齐常见“读得懂、压得小、能复制”的日常处理场景，而不膨胀一级导航。

## What Changes

- 在数据工具内新增 SQL 子工具：
  - SQL 格式化。
  - SQL 压缩。
- 在数据工具内新增 XML 子工具：
  - XML 格式化。
  - XML 压缩。
  - 明显结构问题提示，例如标签不闭合。
- 引入成熟轻量库：`sql-formatter` 与 `fast-xml-parser`。
- 不做 SQL 方言语义校验、数据库连接、XML Schema / DTD 校验或 XPath。

## Capabilities

### New Capabilities

- `data-tools-sql-xml-format`: 数据工具内的 SQL / XML 轻量格式化、压缩和基础错误提示能力。

### Modified Capabilities

- `data-tools-csv-json`: 数据工具合集从 JSON / YAML / CSV 扩展为 JSON / YAML / CSV / SQL / XML 子工具集合。
- `workbench-shell`: 数据工具导航描述从 JSON / YAML / CSV 更新为更宽泛的数据格式工具说明，快捷键保持 Ctrl/Cmd+2。

## Impact

- 依赖：新增 `sql-formatter` 与 `fast-xml-parser`。
- 渲染层：扩展 `JsonTab.vue` 子工具导航、按钮和状态。
- 纯逻辑：新增 `formatHelper.js` 或等价 helper，封装 SQL/XML 格式化、压缩和错误归一化。
- 测试：新增 SQL/XML helper 单测，并保持 JSON/YAML/CSV 既有测试通过。
- 发布：新功能，预计 minor 版本。
