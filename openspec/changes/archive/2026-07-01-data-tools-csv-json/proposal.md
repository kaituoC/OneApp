## Why

现有 JSON / YAML 工具已经承载结构化数据处理入口，但 CSV 是高频数据交换格式，继续新增一级入口会让左侧导航膨胀。将该入口升级为「数据工具」合集，可以保留既有 JSON / YAML 能力，同时把 CSV ⇄ JSON 与表格预览收敛到同一数据工作区。

## What Changes

- 将现有 JSON / YAML 一级入口的 label 升级为「数据工具」，保留原 `json` tab key 与 Ctrl/Cmd+2 快捷键位置。
- `JsonTab.vue` 内部从 JSON/YAML 双模式扩展为 JSON / YAML / CSV 子工具。
- 新增 CSV 子工具：
  - CSV → JSON：按首行表头输出对象数组。
  - JSON → CSV：支持对象数组，字段来自所有对象 key 的并集。
  - 表格预览：只读展示解析后的二维表，支持横向滚动。
- 引入 `papaparse` 作为成熟轻量 CSV 解析/序列化库，覆盖引号、字段内逗号、字段内换行和双引号转义。
- 不做单元格编辑、排序筛选、文件导入导出、大文件虚拟滚动、SQL / XML / JSONPath。

## Capabilities

### New Capabilities

- `data-tools-csv-json`: 数据工具合集一期，定义 CSV ⇄ JSON 和只读表格预览能力。

### Modified Capabilities

- `json-yaml-conversion`: JSON / YAML 工具入口升级为数据工具合集子工具，但原 JSON / YAML 能力保持可用。
- `workbench-shell`: 导航和快捷键说明从 JSON / YAML 更新为数据工具，同时保留 Ctrl/Cmd+2 位置。

## Impact

- 依赖：新增 `papaparse`。
- 渲染层：更新 `JsonTab.vue` 的子工具导航、CSV 面板和表格预览。
- 纯逻辑：新增 `csvHelper.js`，供 UI 与单测复用。
- 导航：更新 `src/renderer/utils/navigation.js` 的 label/description/summary。
- 文档与规格：更新 README、ROADMAP、OpenSpec specs、CHANGELOG 与项目指引。
- 发布：新功能，预计 minor 版本。
