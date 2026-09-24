## Why

更新说明被压成单段并截断，长内容无法阅读；盘点还发现语法帮助缺少 modal 焦点/Esc、发送预览静默截断，以及搜索可能叠加其他弹窗。需要统一详情类弹窗的布局和交互。

## What Changes

- 保留完整 Release Markdown，使用应用内更新详情展示分段、列表、安装信息与固定操作区。
- 语法帮助、发送确认与工具搜索复用对话框容器，统一尺寸、滚动、关闭、焦点恢复及避免叠层。
- 发送确认保留完整可滚动文本；短消息和研讨费用确认继续使用系统消息框。
- 文档明确详情类弹窗例外，保持检查频率、下载选择、外链约束与 Agent 行为。

## Capabilities

### New Capabilities
- `structured-app-dialogs`: 详情类弹窗的统一滚动和键盘行为。

### Modified Capabilities
- `app-update-check-dialogs`: 新版本用完整结构化说明展示，短结果继续使用系统弹窗。

## Impact

影响 renderer 详情类弹窗和更新结果中的说明字段；无新依赖，不调整主进程权限或 Agent 编排。分支 fix/unify-dialog-experience，patch 1.30.1，沿用自动推进的验证、提交、PR 与发布流程。
