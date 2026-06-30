## 1. 依赖与纯逻辑

- [x] 1.1 安装 `yaml` runtime 依赖并更新 lockfile
- [x] 1.2 为 JSON → YAML、YAML → JSON、YAML 校验、多文档报错和日期字符串保留添加单元测试
- [x] 1.3 实现 YAML 相关 helper，并保持现有 JSON helper 行为不变

## 2. UI 集成

- [x] 2.1 将 JSON 工具导航文案升级为 JSON / YAML
- [x] 2.2 在 `JsonTab.vue` 增加 JSON / YAML 模式切换和模式化操作按钮
- [x] 2.3 调整输入/输出标题、placeholder、状态文案和错误展示
- [x] 2.4 保持双栏 layout、复制结果、清空和窄宽度响应式行为可用

## 3. 文档、版本与验证

- [x] 3.1 更新 README、ROADMAP、CHANGELOG 和版本号
- [x] 3.2 运行相关单测、完整 `npm test` 和 `npm run build`
- [x] 3.3 执行本地 UI smoke test，覆盖 JSON → YAML、YAML → JSON 和多文档报错
- [x] 3.4 归档 OpenSpec change，并运行 `openspec validate --specs --strict`
