## Context

数据工具当前由 `JsonTab.vue` 承载 JSON / YAML / CSV / SQL / XML 子工具，核心处理逻辑分散在 `src/renderer/utils/*Helper.js` 中，并通过纯函数返回 `{ success, result/message/displayMessage }` 风格结果。JSONPath 查询应沿用这个模式，避免引入新的状态管理或主进程 IPC。

JSONPath 表达式需要可靠解析和执行，手写解析器容易遗漏过滤器、通配符、递归下降等语法细节，因此本次应使用成熟轻量库。

## Goals / Non-Goals

**Goals:**

- 在 JSON 子工具中新增 JSONPath 表达式输入和查询动作。
- 查询逻辑封装为纯函数，便于单测覆盖 JSON 无效、表达式无效、无匹配和多结果。
- 查询输出使用格式化 JSON，保持与现有输出面板和复制能力一致。
- UI 保持轻量，不影响 YAML / CSV / SQL / XML 子工具。

**Non-Goals:**

- 不做 JSON 节点高亮、结果定位、路径列表可视化或查询历史。
- 不做超大 JSON 的流式解析、虚拟化或索引优化。
- 不做文件导入导出或跨文件查询。
- 不新增主进程 IPC 或持久化配置。

## Decisions

1. 使用成熟 JSONPath 库执行表达式。
   - 方案：引入 `jsonpath-plus`，封装到 `jsonPathHelper.js`。
   - 原因：支持常见 JSONPath 语法，体积可控，适合 renderer 纯函数调用。
   - 备选：手写解析器。放弃原因是语法覆盖和错误处理成本高。

2. JSONPath 表达式作为 JSON mode 的附加输入。
   - 方案：仅在 `mode === 'json'` 时展示单行表达式输入和“JSONPath 查询”按钮。
   - 原因：JSONPath 属于 JSON 增强，不应新增一级 tab，也不应打扰其他数据格式子工具。
   - 备选：新增独立 JSONPath mode。放弃原因是输入仍是 JSON，独立 mode 会重复 JSON 操作并增加切换成本。

3. 查询结果统一输出为格式化 JSON。
   - 方案：匹配 0 项返回无匹配状态；匹配 1 项输出该值的 JSON；匹配多项输出数组。
   - 原因：最符合现有输出面板和复制工作流，也避免为标量/对象/数组设计多套 UI。

## Risks / Trade-offs

- JSONPath 库错误信息可能偏英文 → 在 helper 中包一层中文前缀，保留原始解析提示。
- 单行表达式输入会增加 toolbar 下方高度 → 仅在 JSON mode 显示，使用紧凑工具行样式。
- 多匹配结果可能较大 → 本次沿用现有文本输出，不做虚拟化；若后续出现性能问题再单独排期。
- 某些高级 JSONPath 方言差异可能导致用户预期不同 → 文档和占位符使用常见 `$..name` / `$.items[0]` 风格，避免承诺完整方言兼容。

## Migration Plan

1. 新增依赖和 `jsonPathHelper.js`。
2. 在 `JsonTab.vue` 的 JSON mode 增加表达式输入与查询按钮。
3. 新增 helper 单测和必要的 navigation/文档更新。
4. 完成 OpenSpec 归档、版本升级和发布。
