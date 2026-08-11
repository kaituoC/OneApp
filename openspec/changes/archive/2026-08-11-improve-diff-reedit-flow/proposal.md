## Why

文本对比在进入结果态后会用只读差异视图替换两侧输入框，用户若要调整或只替换一侧内容，只能清空全部并重新输入。需要补齐可逆的编辑流程，让用户保留另一侧文本并连续完成多轮对比。

## What Changes

- 在差异结果态提供明确的“编辑内容”入口，返回输入态时保留文本 A 和文本 B。
- 在两侧输入面板分别提供“清空此侧”操作，只移除目标侧内容并保留另一侧内容。
- 调整加载文件、交换和清空操作在输入态与结果态之间的行为，避免展示与当前源文本不一致的过期结果。
- 保持并排/统一视图、差异摘要、文件加载和同步滚动能力不变。
- 将重新对比保持为显式操作，避免现有行级 LCS 算法在每次输入时自动执行。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `tool-surface-refresh`: 扩展 Diff 输入态与结果态的交互要求，使结果可返回编辑、支持单侧清空并保证结果与源文本状态一致。

## Impact

- 主要影响 `src/renderer/components/DiffTab.vue` 的工具栏、面板操作和状态切换逻辑。
- 复用 `src/renderer/components/EditorWithLineNumbers.vue` 已暴露的 textarea 引用，在单侧清空后聚焦目标编辑器。
- 更新 `openspec/specs/tool-surface-refresh/spec.md` 对 Diff 工作流的行为约束。
- 不改变 `diffHelper.js` 的差异算法，不新增运行时依赖，不涉及 Electron IPC 或文件写入行为。
