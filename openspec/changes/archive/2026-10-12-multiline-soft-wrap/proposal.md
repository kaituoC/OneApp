## Why

数据工具关闭输入换行，粘贴单行或格式错误的长内容时只能横向拖动查看。统一多行文本区域的视觉软换行，可以让输入与结果直接可读，同时保留原文语义。关联 GitHub issue #67。

## What Changes

- 数据工具的文本输入与输出默认软换行，增加共用的“自动换行”开关，并按子工具保留会话偏好。
- 复用带行号编辑器，统一文本与测量镜像的排版，确保长串、空行、Tab、字号及尺寸变化下的逻辑行号对齐。
- 普通多行 textarea 统一软换行并允许无空格长串折行；核对文本、编码、正则、生成器和研讨描述。
- 保留文档编辑器开关、文本对比输入行为；单行字段、CSV 表格、diff 结果及 Agent 主进程边界不变。

## Capabilities

### New Capabilities

- `multiline-text-wrapping`: 多行文本区域的默认软换行、原文不变、逻辑行号对齐，以及数据工具的会话换行开关。

### Modified Capabilities

无。

## Impact

涉及 Renderer 的 EditorWithLineNumbers、JsonTab 和多行 textarea 共享样式、相关测试、AGENTS.md 与版本日志。不新增依赖，不改变文件 I/O、IPC、研讨编排、CI 或发布配置；完整 OpenSpec 流程，预计 patch 1.31.2。
