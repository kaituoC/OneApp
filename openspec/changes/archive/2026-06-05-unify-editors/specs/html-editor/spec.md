## REMOVED Requirements

### Requirement: HTML file editing
**Reason**: Markdown 与 HTML 编辑器合并为统一编辑器，HTML 文件的打开/新建/保存行为迁移至 `unified-editor`。
**Migration**: 见 `unified-editor` spec 的 "Open file from toolbar dialog"、"Create new file by type"、"Save file" 需求。

### Requirement: Editor/preview toggle
**Reason**: 合并后由统一编辑器统一提供列表/编辑/预览显隐切换。
**Migration**: 见 `unified-editor` spec 的 "Toggle list, editor and preview" 需求。

### Requirement: File list and recent files
**Reason**: 合并后侧栏统一为目录树且移除「最近打开文件」功能。
**Migration**: 文件浏览见 `file-tree-explorer`；目录树侧栏见 `unified-editor` 的 "Directory tree sidebar without recent files"；最近文件功能已移除（见 `recent-files-tracking` 的移除说明）。
