## 1. 依赖与纯逻辑

- [x] 1.1 安装 `papaparse` 并锁定依赖
- [x] 1.2 编写 CSV helper 失败优先单测，覆盖标准转义、CSV → JSON、JSON → CSV、表格预览和错误输入
- [x] 1.3 实现 `csvHelper.js` 纯逻辑，让新增单测通过

## 2. 数据工具 UI

- [x] 2.1 将现有 JSON / YAML 工具 UI 扩展为 JSON / YAML / CSV 子工具，保留原 JSON / YAML 操作
- [x] 2.2 新增 CSV 操作按钮、输出状态和只读表格预览，支持横向滚动
- [x] 2.3 更新导航 label、description、summary 与状态栏文案为「数据工具」

## 3. 文档、规格与发布收尾

- [x] 3.1 更新 README、ROADMAP、AGENTS、CLAUDE、CHANGELOG 和剩余队列设计文档，版本升级到 1.16.0
- [x] 3.2 同步 OpenSpec 主 specs 并归档 change，运行 `openspec validate --specs --strict`
- [x] 3.3 运行相关单测、`npm test`、`npm run build` 和数据工具 UI smoke test
