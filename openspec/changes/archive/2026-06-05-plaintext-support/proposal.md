## Why

统一编辑器（v1.5.0）完成了 Markdown / HTML 合并，但只支持 `.md`、`.html`、`.htm` 三种后缀。开发者日常频繁查看/编辑 `.txt`、`.css`、`.js`、`.xml` 等纯文本文件，当前只能通过外部编辑器打开，打断工作流。作为 P0 地基的最后一块，扩展纯文本支持使统一编辑器成为真正通用的文本编辑入口。

## What Changes

- 新增 `plaintext` mode：未知后缀文件打开后进入纯文本模式，无预览区、无导出按钮，全屏编辑
- 目录树不再按文件后缀过滤，显示所有非隐藏文件（目录仍正常折叠）
- "新建"下拉菜单增加"新建纯文本"选项，默认文件名 `untitled.txt`，内容为空
- 系统打开文件对话框增加"所有文件"过滤选项

## Capabilities

### New Capabilities
- `plaintext-editing`: 纯文本文件的打开、编辑、保存，无预览模式

### Modified Capabilities
- `unified-editor`: mode 从 `markdown | html` 扩展为 `markdown | html | plaintext`，新建下拉加入纯文本选项
- `file-tree-explorer`: 移除 `editableExtensions` 后缀过滤，显示所有非隐藏文件

## Impact

- `src/renderer/composables/useEditorFile.js`：modeFromPath 逻辑、EDITOR_FILTERS、newFile 处理
- `src/renderer/components/EditorTab.vue`：editableExtensions 移除、工具栏条件渲染、预览区条件渲染、新建菜单
- `src/renderer/components/FileTree.vue`：editableExtensions 为空时不过滤文件
