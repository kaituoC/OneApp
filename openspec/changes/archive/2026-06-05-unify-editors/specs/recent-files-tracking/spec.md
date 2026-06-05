## REMOVED Requirements

### Requirement: Recent files persistence
**Reason**: 编辑器侧栏「最近打开文件」功能（功能①）整体移除。注意本能力描述的是编辑器侧栏最近文件（`recentMdFiles`/`recentHtmlFiles`），不影响设置页基于顶层 `recentFiles` 的最近文件列表（功能②，保留）。
**Migration**: 无替代；如需查看最近文件，使用设置页保留的最近文件列表。

### Requirement: Recent files display
**Reason**: 编辑器侧栏「最近打开文件」区块随功能①移除。
**Migration**: 无替代；侧栏改为仅含目录树（见 `unified-editor` 的 "Directory tree sidebar without recent files"）。

### Requirement: File existence validation
**Reason**: 该校验仅服务于编辑器侧栏最近文件项的点击打开，随功能①移除。
**Migration**: 无替代。

### Requirement: Recent files section scrollable
**Reason**: 侧栏最近文件区已移除，独立滚动需求不再适用。
**Migration**: 无替代。

### Requirement: Type-isolated recent file lists
**Reason**: 按类型隔离的 Markdown/HTML 最近文件列表随功能①整体移除。
**Migration**: 无替代。
