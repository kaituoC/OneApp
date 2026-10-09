## Why

依据已确认的 macOS 优化方案，修复保存误报、匿名稿替换、普通关闭丢稿与内容呈现边界，改善现有工作台的日常操作。

## What Changes

- R1–R5：可信保存、另存为、匿名 guard、未保存列表、关闭握手、活动 Agent 停止等待、Markdown/IPC/PDF 边界。
- U1–U5：固定核心菜单、最近文件、system 主题与可见窗口恢复、紧凑标题、编辑器分栏与换行、结果错误分离、历史生成结果与一次撤销、键盘与输入名称。
- 保留单工作台、现有计算逻辑、Agent 编排与记录格式，E 保留候选；M1 落实文件授权，M2 完成兼容性评估，runtime 升级形成独立批次，不修改 CI 或发布。
- 用户要求所有修改集中在一条新分支，保留未提交状态，覆盖方案建议的分批分支流程。

## Capabilities

### New Capabilities

- `macos-workbench-reliability`: 当前工作台保存、关闭、安全边界、系统操作与交互优化的补充行为契约。

### Modified Capabilities

## Impact

main/preload、编辑器 composable、共享输入与结果、App/Settings/Generator/FileTree。无新增依赖，不持久化正文。预计 minor 版本；提交/推送由用户处理。
