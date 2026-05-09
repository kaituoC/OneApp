## Why

当前 Markdown 编辑器只能通过左侧文件列表打开工作目录下的 `.md` 文件，无法直接打开工作目录以外的文件（如其他项目中的文档、临时收到的文件等），限制了使用场景。

## What Changes

- 工具栏新增「打开文件」按钮
- 点击后唤起系统文件选择对话框，过滤 `.md` 文件
- 用户选择文件后立即在编辑器中打开
- 非工作区文件自动加入最近打开列表（通过已有的 `addRecentFile` 机制）
- 已存在于工作区的文件打开行为不变

## Capabilities

### New Capabilities
- `markdown-open-file`: Markdown 编辑器工具栏新增系统文件对话框打开文件的能力

### Modified Capabilities
- 无

## Impact

- `src/renderer/components/MarkdownTab.vue`: 工具栏新增按钮及打开逻辑
- `src/renderer/utils/fileHelper.js`: `openFile()` 函数已存在，无需修改
