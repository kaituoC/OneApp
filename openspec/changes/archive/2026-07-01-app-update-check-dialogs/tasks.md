## 1. Helper 与测试

- [x] 1.1 新增更新检查纯 helper，覆盖版本解析、语义化版本比较、Release 响应归一化和 notes 摘要截断
- [x] 1.2 为 helper 编写失败优先单测，覆盖新版本、无新版、无效版本、缺失 Release 字段和错误状态

## 2. 主进程与 preload IPC

- [x] 2.1 新增主进程统一消息框 handler，注入 OneApp 图标并在图标不可用时安全降级
- [x] 2.2 新增主进程更新检查 handler，请求 GitHub latest Release 并返回结构化检查结果
- [x] 2.3 在 preload 暴露 `showMessageBox` 和 `checkForUpdates` 窄接口，保持不暴露通用 IPC channel

## 3. 渲染层迁移

- [x] 3.1 更新 Settings 检查更新流程，加入 loading 状态、统一弹窗结果展示和打开 Release 页面入口
- [x] 3.2 更新 Agent 研讨室首次成本提示，使用统一消息框替换原生 `confirm` 并保留接受状态记忆

## 4. 文档、归档与验证

- [x] 4.1 更新 README、ROADMAP、AGENTS、CLAUDE、CHANGELOG 等项目文档与版本号
- [x] 4.2 执行 OpenSpec 归档并校验 specs
- [x] 4.3 运行相关单测、`npm test`、`npm run build` 和 UI smoke test
