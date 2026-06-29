## 1. 导航目标模型

- [x] 1.1 为 Agent Workshop 纯逻辑层添加消息导航目标推导测试
- [x] 1.2 实现从 timeline messages 推导 `phase + agentId` 导航目标的纯函数

## 2. 渲染层交互

- [x] 2.1 将进度 chip 根据导航目标切换为可点击按钮或只读状态
- [x] 2.2 为 timeline 消息注册 DOM ref，实现滚动定位与短时高亮
- [x] 2.3 补充 hover、focus 和高亮样式，保持深浅主题兼容

## 3. 收尾验证

- [x] 3.1 运行相关单测验证导航目标推导
- [x] 3.2 运行完整测试与生产构建
- [x] 3.3 执行本地 UI smoke test，确认 Agent 研讨室记录导航交互可用
