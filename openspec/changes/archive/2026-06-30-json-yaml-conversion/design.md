## Context

当前 JSON 工具由 `JsonTab.vue` 与 `jsonHelper.js` 组成，已经具备双栏输入/输出、状态栏、错误输出、复制结果和响应式堆叠布局。新增 YAML ⇆ JSON 转换时，最小改动路径是复用这个工具 surface，并把它升级成 JSON / YAML 模式化工具，而不是新增一级入口。

YAML 语法包含缩进、注释、anchors、aliases、多文档、schema 类型解析等复杂规则；手写 parser 风险高，也不符合本项目“核心逻辑优先用成熟库”的工程约定。因此本次引入 `yaml` 作为 runtime 依赖，业务逻辑仍通过纯 helper 函数封装，便于单测覆盖。

## Goals / Non-Goals

**Goals:**

- JSON 工具升级为 JSON / YAML 工具，并保留原有 JSON 格式化、压缩、校验和去除转义行为。
- JSON 模式新增 JSON → YAML 转换。
- YAML 模式支持 YAML 校验和 YAML → JSON 转换。
- YAML → JSON 仅支持单文档 YAML；多文档明确报错。
- YAML → JSON 对日期采用保守策略，输出 JSON 中日期样式值保持字符串。
- 错误反馈继续通过右侧输出和底部状态栏呈现，尽量包含行列。

**Non-Goals:**

- 不新增一级导航工具。
- 不支持 YAML 多文档 stream。
- 不承诺保留 YAML 注释或原始排版。
- 不做 YAML schema 校验、anchors / aliases 可视化解释、自动格式识别或一键交换方向。
- 不增加 JSON 输出缩进、YAML quote style、key 排序等高级选项。

## Decisions

### 1. 在 `JsonTab.vue` 内做模式切换

保留现有双栏布局和复制/清空行为，顶部增加 `JSON` / `YAML` segmented control。JSON 模式展示「格式化 / 压缩 / 校验 / 去除转义 / 转 YAML」，YAML 模式展示「校验 / 转 JSON」。这样用户仍从原 JSON 入口进入，但可以明确选择当前输入格式，避免自动识别误判。

备选方案是新增一级「YAML」工具。它会增加导航复杂度，并复制大量输入/输出 surface；当前功能与 JSON 工具高度相邻，合并更符合 OneApp 的工具密度。

### 2. 使用 `yaml` 包并在 helper 中封装边界

新增 `yaml` 依赖，由 helper 暴露 `yamlToJSON`、`jsonToYAML`、`validateYAML` 等纯函数。UI 不直接依赖 parser 细节，只消费 `{ success, result/message/displayMessage }` 风格结果，延续现有 JSON helper contract。

备选方案是手写轻量 parser 或只支持 key-value 子集。该方案短期看起来小，但会在缩进数组、嵌套对象、引号和特殊值上迅速变脆。

### 3. 单文档 YAML only

解析前检测 YAML 文档分隔符；允许文件开头的单个 `---`，但检测到第二个文档分隔符或多个 document 时返回“不支持多文档”错误。这样不会静默丢弃后续文档，也不会把多文档隐式转成数组造成语义猜测。

### 4. 日期保持字符串

YAML → JSON 使用保守 schema / custom tag 处理，确保 `2026-06-30` 这类日期样式值输出为字符串。布尔、数字、null 仍保持自然 JSON 类型。这样避免不同环境下 Date 序列化带来的时区变化和意外格式变化。

## Risks / Trade-offs

- [Risk] `yaml` 对 anchors / aliases 会正常解析但不会解释来源 → Mitigation: 第一版不提供可视化解释，文档和 spec 明确非目标。
- [Risk] YAML stringify 不保留注释 → Mitigation: JSON → YAML 是生成目标格式，不承诺 round-trip 保留注释。
- [Risk] 多文档检测误伤文档开头 `---` → Mitigation: 允许开头单个 document marker，只在出现后续 document marker 或 parser 返回多个 document 时报错。
- [Risk] 导航命名变更影响用户习惯 → Mitigation: 保留原 `json` tab key 和 Ctrl/Cmd+2 快捷键，只更新显示文案。
