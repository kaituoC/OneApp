## Why

当前一级分组只有六项，却以宽大的左侧栏呈现；同时其二级入口又占据顶部一整行。界面在生成器等轻量工具中产生明显空白，并挤压编辑器和结果区的可用宽度。

## What Changes

- 将六个一级分组迁移到应用顶部的全局导航，使用紧凑、可滚动且具备明确 active state 的入口。
- 将当前一级分组中的多个工具迁移到左侧上下文导航；仅含一个工具的分组不显示空白上下文导航。
- 保留数字直达、`Ctrl+Tab` 循环切换和“回到该分组上次所选工具”的行为，使指针和键盘入口保持同步。
- 移除旧的可收起一级左栏及顶部二级 chip 行；工具内部的三级选择继续在各工具内容区内呈现。
- 优化编辑器文件树的宽度与层级视觉，让文件夹、缩进和当前选择更容易扫描。

## Capabilities

### New Capabilities

- `contextual-tool-navigation`: 在顶级分组与工具内容区之间提供按分组变化的二级导航与最近工具记忆。

### Modified Capabilities

- `workbench-shell`: 将一级导航从左侧工作台栏迁移到顶部，并更新窄宽度下的空间保护方式。
- `file-tree-explorer`: 提升树节点的缩进、展开与当前文件层级表达。

## Impact

- 影响 `src/renderer/App.vue`、`src/renderer/components/Header.vue`、`ToolMenu.vue`、编辑器文件树及相关样式。
- 复用现有 `navigation.js` 的分组、快捷键和持久化状态，不新增外部依赖，也不修改主进程、IPC 或 Agent Workshop 逻辑。
