## 1. 共享 Tool Surface 基础

- [x] 1.1 梳理现有工具页重复样式，确认需要保留的全局 token 与共享 primitives。
- [x] 1.2 在 `main.css` 中实现实际被使用的 panel、panel header、segmented control、icon button、status chip、empty state、copy feedback 样式。
- [x] 1.3 替换或删除未使用的共享样式，避免新增 dead CSS。
- [x] 1.4 确保 icon-only control 统一使用 lucide icon，并补齐 `title` / `aria-label`。

## 2. Editor 与 File Tree Polish

- [x] 2.1 优化 Editor command bar 的按钮主次层级、segmented control 和窄宽度换行表现。
- [x] 2.2 将 FileTree / TreeNode 中的 emoji 与文本符号替换为 lucide icon 风格。
- [x] 2.3 调整 Editor 多栏响应式策略，保证 file tree 不被压成不可读竖条，preview 在空内容场景不抢占空间。
- [x] 2.4 回归 Markdown / HTML / 纯文本 mode、预览、滚动同步、保存和导出行为。

## 3. Encode 重点改造

- [x] 3.1 优化 Encode 子工具导航，使宽屏为侧边/清晰列表，中小宽度可降级为顶部低占宽导航。
- [x] 3.2 统一 Base64、URL、Unicode 的输入、方向切换、输出、错误与复制反馈。
- [x] 3.3 优化 JWT decode 输出结构，明确 Header、Payload、Signature、时间字段和未验证提示。
- [x] 3.4 优化 Hash 与进制转换结果布局，让长结果可读并可复制。
- [x] 3.5 回归 Encode 各子工具现有计算结果不变。

## 4. 其他工具页轻量 Polish

- [x] 4.1 优化 JSON 的空态、success/error 状态、输出区和复制反馈。
- [x] 4.2 优化 Diff 的输入态、结果摘要、split/unified 切换和窄宽度 stack 行为。
- [x] 4.3 优化 Regex 的 quick reference、结果列表、高亮联动和复制反馈，保持 Web Worker 行为不变。
- [x] 4.4 优化 Time 的实时值、转换表单、结果和 copy toast 的一致性。
- [x] 4.5 优化 Settings 的最近文件展示和长路径扫描体验。

## 5. Agent Workshop 前端状态 Polish

- [x] 5.1 调整 setup/ready 布局，让 repo、agent 检测、moderator、调用估算和 idea input 层级更清晰。
- [x] 5.2 调整 running/finished/resume view 的 progress、timeline、导出和新研讨入口，不改变底层 workflow。
- [x] 5.3 优化 Agent Workshop 窄宽度布局，避免配置栏挤压 timeline。
- [x] 5.4 确认没有修改 `electron/agentWorkshop/` orchestration、runner、IPC、records 语义。

## 6. 验证与收尾

- [x] 6.1 运行相关单测，至少覆盖 JSON、Diff、Regex、Encode、Time 和 Agent Workshop helper。
- [x] 6.2 运行 `npm test` 和 `npm run build`。
- [x] 6.3 启动应用进行 light/dark、正常宽度、DevTools 占用宽度和 compact 宽度视觉烟测。
- [x] 6.4 运行 `openspec validate polish-tool-surfaces --strict`。
- [x] 6.5 更新必要文档、任务勾选和版本/CHANGELOG（如本次最终改动达到发版标准）。
