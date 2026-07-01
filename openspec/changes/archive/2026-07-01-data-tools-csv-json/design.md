## Context

当前 `JsonTab.vue` 提供 JSON / YAML 双模式，导航 key 为 `json`，位于数据处理分组并绑定 Ctrl/Cmd+2。剩余路线图要求后续 SQL / XML / JSONPath 都进入数据类合集，因此本次需要先把入口命名和组件结构升级为可扩展的「数据工具」，同时新增 CSV 子工具。

## Goals / Non-Goals

**Goals:**

- 保留现有 `json` tab key、快捷键位置和 JSON / YAML 操作能力。
- 在同一工具内新增 CSV 子工具，支持 CSV → JSON、JSON → CSV 和只读表格预览。
- 使用 `papaparse` 处理标准 CSV 规则，避免手写解析器。
- 新增纯 helper 与单测，UI 只负责状态和展示。
- 表格预览可横向滚动，适合字段较多的小中型 CSV。

**Non-Goals:**

- 不做单元格编辑、排序筛选、文件导入导出。
- 不做大文件虚拟滚动或 streaming UI。
- 不做 SQL / XML / JSONPath，它们由后续独立需求进入数据工具。

## Decisions

1. **保留 `JsonTab.vue` 文件与 `json` tab key**

   导航标签改为「数据工具」，但代码层暂不重命名组件，避免在同一需求里制造大量无行为价值的文件移动。后续如果 SQL/XML/JSONPath 继续加入，可再评估重命名为 `DataTab.vue`。

   备选方案是立即整体重命名组件和 tab key。语义更完整，但会放大改动范围，并影响现有快捷键、测试和用户习惯。

2. **CSV 逻辑放入 `csvHelper.js`**

   `csvToJson`、`jsonToCsv`、`previewCsvTable` 都由纯函数提供，返回 `{ success, result/error/displayMessage }` 风格，和现有 JSON/YAML helper 保持一致。UI 面板只消费这些结果。

3. **使用 PapaParse**

   PapaParse 在浏览器环境成熟可用，支持引号、字段内逗号、字段内换行和双引号转义，并提供 JSON unparse。相比手写解析器，更容易覆盖 CSV 边界。

4. **CSV 子工具使用独立输入/输出与预览状态**

   JSON/YAML 的输入输出文本继续保持原双栏体验。CSV 模式复用左输入右输出，并在底部或右栏内展示只读表格预览；切换子工具时清空输出/状态，避免跨模式误读。

## Risks / Trade-offs

- [Risk] PapaParse 会容忍部分不规则 CSV → Mitigation：开启 `header: true` 后检查 `FieldMismatch` 等错误，列数不一致时返回明确错误。
- [Risk] 空 CSV 或空表头产生误导性对象 → Mitigation：helper 显式拒绝空输入和空表头。
- [Risk] JSON → CSV 的对象字段不一致 → Mitigation：按对象出现顺序收集所有 key 的并集，空缺字段输出为空。
- [Risk] 表格预览过宽影响布局 → Mitigation：预览容器横向滚动，不做虚拟滚动。
