## Why

OneApp 在 v1.9.0 已完成 workbench shell 焕新，但各功能页内部仍保留多套局部布局与控件样式，导致 Editor、Encode、Time、Agent Workshop 等页面在视觉层级、响应式降级和状态反馈上不够统一。现在继续打磨工具页 surface，可以在不改变核心功能语义的前提下，让应用更专业、更冷静，也更适合长时间作为 developer workbench 使用。

## What Changes

- 统一工具页内部的 panel、header、command control、status chip、empty state、copy feedback 与 segmented control 视觉语言。
- 建立各工具页的响应式降级规则，覆盖正常宽度、DevTools 占用空间和小窗口场景。
- 优化 Editor 工作区：强化文件树可读性和收起策略，减少空内容时 preview 对横向空间的占用，并替换不一致的 emoji/text-only 控件。
- 优化 Encode 工具：统一子工具导航、输入输出面板、JWT/Hash/进制结果展示与复制反馈，使其从旧式表单页升级为一致的工具 surface。
- 优化 JSON、Diff、Regex、Time、Settings 的轻量交互细节：空态、结果态、错误态、按钮主次层级和窄宽度布局。
- 优化 Agent Workshop 的前端信息结构：让 setup、历史/终态、progress 与 timeline 的关系更清晰，但不改变底层 orchestration、runner、IPC 或只读约束。
- 保留现有工具功能结果、快捷键、文件读写与 Agent Workshop workflow，不引入 breaking change。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `tool-surface-refresh`: 补充工具页内部 polish、共享 surface primitives、响应式降级、Editor/Encode/Agent Workshop 页面细节与状态反馈要求。

## Impact

- 主要影响 `src/renderer/components/` 下的工具页组件：`EditorTab.vue`、`JsonTab.vue`、`DiffTab.vue`、`RegexTab.vue`、`EncodeTab.vue`、`TimeTab.vue`、`AgentWorkshopTab.vue`、`SettingsTab.vue`、`FileTree.vue`、`TreeNode.vue`。
- 影响 `src/renderer/styles/main.css` 和可能新增的共享样式/小组件，用于统一 panel、button、chip、empty state 和 responsive token。
- 不修改主进程文件 I/O、PDF 导出、Agent Workshop orchestration、runner、IPC、records 或 release workflow。
- 不新增外部运行时依赖；继续使用已引入的 `lucide-vue-next` 作为 icon library。
