## Context

数据工具当前在 `JsonTab.vue` 内以子工具模式提供 JSON / YAML / CSV。后续还会加入 JSONPath，因此本次继续保留组件文件名和 `json` tab key，只扩展子工具集合。SQL 与 XML 都是纯文本格式，本需求只做轻量格式化与压缩，不连接外部系统。

## Goals / Non-Goals

**Goals:**

- 新增 SQL 子工具，支持格式化和压缩。
- 新增 XML 子工具，支持格式化、压缩和明显结构错误提示。
- 使用成熟库处理主要格式边界，避免手写 SQL parser 或 XML parser。
- 复用现有输入/输出双栏、状态提示和复制结果体验。

**Non-Goals:**

- 不做 SQL 方言语义校验、执行计划或数据库连接。
- 不做 XML Schema / DTD 校验。
- 不做 XPath 查询或 XML 树编辑。

## Decisions

1. **新增 `formatHelper.js`**

   SQL 和 XML 共享“格式化/压缩/错误归一化”的结构，但逻辑不属于 JSON/YAML/CSV 任一 helper。新增独立 helper 让 UI 保持薄层，并方便后续 SQL/XML 单测扩展。

2. **SQL 使用 `sql-formatter`**

   `sql-formatter` 提供稳定的 whitespace formatter。压缩功能使用格式化库前后的字符串规范化策略：移除无意义换行与多余空白，保留字符串字面量原始内容的边界由库和简单 token 扫描共同约束。

3. **XML 使用 `fast-xml-parser` 验证，再用轻量 pretty-printer 输出**

   `fast-xml-parser` 的 `XMLValidator.validate` 用于识别明显结构问题。格式化阶段在验证通过后按标签边界缩进，不引入 DOM 依赖；压缩阶段去除标签间空白，保留文本节点内容。

## Risks / Trade-offs

- [Risk] SQL 压缩不是完整 SQL minifier → Mitigation：仅承诺轻量压缩，不做方言语义重写，不改变 token 内容。
- [Risk] XML pretty-printer 无法覆盖所有 XML 边界 → Mitigation：先用 XMLValidator 拦截明显结构问题，并保守处理 CDATA、注释和自闭合标签。
- [Risk] 数据工具按钮过多 → Mitigation：继续使用子工具切换，每个子工具只显示本格式相关按钮。
