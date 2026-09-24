## Why

现有分组将时间与数据、编码与文本混在一起，工具与子工具同时出现在第二行，入口层级重复。用户已 review 并采纳 HTML 交互方案，要求编辑器优先、目录/编辑/预览三栏及目录双向滚动，且全部现有功能保留。

## What Changes

- 顶层依次为编辑器、数据、文本、编码、时间、生成、研讨室，设置独立；第二行直达具体工具，支持工具搜索。
- 编辑器默认展示目录、编辑与预览；保留面板开关、所有文件模式、保存、导出、联动与快捷键，目录完整文件名可双向滚动。
- 统一页面标题、输入/结果、操作层级与深浅主题；时间转换集中方向切换，研讨准备页集中需求与启动，连接配置按需展开。
- 保留所有现有功能、子工具、算法、IPC 与 Agent 只读/持久化语义；加强切换草稿保留和发送覆盖保护。
- 将已审定 HTML 放入 gitignored 的 doc_local/，同步 AGENTS.md / CLAUDE.md 目录用途。

## Capabilities

### New Capabilities
- `tool-command-search`: 名称与操作关键词搜索、键盘直达。
- `workbench-draft-continuity`: 子工具草稿与结果保留、跨工具输入覆盖保护。

### Modified Capabilities
- `workbench-shell`: 七类任务导航、页面标题与独立主题/设置入口。
- `contextual-tool-navigation`: 七个任务分类，直接工具入口，独立设置。
- `unified-editor`: 默认三栏并保持窄窗口左右结构。
- `file-tree-explorer`: 完整名称与独立双向滚动。
- `tool-surface-refresh`: 与已审定原型一致的页面层级、时间方向切换和研讨准备布局。

## Impact

主要涉及 renderer 导航、布局、工具视图、会话状态、测试与文档。沿用已有依赖，不改 Agent 主进程、IPC、安全边界、发布流程。预计 minor 版本 1.30.0，按完整 OpenSpec 流程验证、归档、提交、PR 合并与 Release。
