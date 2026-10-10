## Why

OneApp v1.31.0 在 Electron 生产页面中拒绝浏览器剪贴板请求，导致多个工具的文本及二维码复制失败，研讨室还缺少失败反馈（GitHub #64）。时间转换的三个结果按钮将空错误字符串绑定为 disabled，成功转换后仍无法点击（#65）。统一修复使用户能可靠复制已有结果。

## What Changes

- 新增只写文本及 PNG 的固定 preload API，由主进程校验可信来源和参数后写入系统剪贴板。
- 所有已有复制入口使用受控写入与一致成功/失败反馈，包括研讨室消息和二维码 PNG。
- 时间转换的三个结果按钮使用 Boolean 禁用条件，保留无结果、错误及结果过期的保护。
- 补真实 DOM 按钮状态、IPC 安全边界及 Electron 生产页面复制的回归验证。

## Capabilities

### New Capabilities

- `clipboard-actions`：跨工具文本/PNG 复制、写入反馈、可信接口边界及时间结果复制可用性。

### Modified Capabilities

无；既有生成器、时间计算及研讨行为保持原有要求，本规格补充共享复制契约。

## Impact

涉及 `electron/main.js`、独立剪贴板支撑模块、`preload.cjs`、`useCopyToast`、`TimeTab`、`GeneratorTab`、`AgentWorkshopTab` 与相关测试。沿用现有 IPC 来源验证，浏览器权限继续默认拒绝；不提供读取剪贴板、通用 IPC、路径或远端图片能力。不更改 Agent 编排、CLI 权限、记录持久化、事件订阅、CI 或依赖。预计 patch：1.31.0 → 1.31.1。
