## 1. 依赖与 helper

- [x] 1.1 安装 `sql-formatter` 与 `fast-xml-parser` 并锁定依赖
- [x] 1.2 编写 SQL/XML helper 失败优先单测，覆盖格式化、压缩、空输入和 XML 结构错误
- [x] 1.3 实现 SQL/XML helper，让新增单测通过

## 2. 数据工具 UI

- [x] 2.1 将数据工具子工具导航扩展为 JSON / YAML / CSV / SQL / XML
- [x] 2.2 新增 SQL 操作按钮与输出状态，支持格式化和压缩
- [x] 2.3 新增 XML 操作按钮与输出状态，支持格式化、压缩和结构错误提示
- [x] 2.4 更新导航 description/summary 与状态说明，保持 Ctrl/Cmd+2 不变

## 3. 文档、归档与验证

- [x] 3.1 更新 README、ROADMAP、AGENTS、CLAUDE、CHANGELOG 和剩余队列设计文档，版本升级到 1.17.0
- [x] 3.2 同步 OpenSpec 主 specs 并归档 change，运行 `openspec validate --specs --strict`
- [x] 3.3 运行相关单测、`npm test`、`npm run build` 和数据工具 SQL/XML UI smoke test
