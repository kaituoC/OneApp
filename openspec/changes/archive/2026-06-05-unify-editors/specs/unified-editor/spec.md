## ADDED Requirements

### Requirement: Single editor tab
应用 SHALL 以单一「编辑器」标签提供 Markdown 与 HTML 文件的编辑，取代原先分立的「Markdown」与「HTML」两个标签，一次编辑一个文件。

#### Scenario: Switch to editor tab
- **WHEN** 用户切换到「编辑器」标签
- **THEN** 显示统一编辑器（工具栏、目录树侧栏、编辑器、预览区）

#### Scenario: Legacy active tab normalized
- **WHEN** 持久化的 `activeTab` 为旧值 `markdown` 或 `html`
- **THEN** 启动时归一为 `editor`，显示统一编辑器而非空白

### Requirement: File type drives editing mode
统一编辑器 SHALL 根据当前文件后缀确定编辑模式 `mode`：`.md` → `markdown`，`.html`/`.htm` → `html`；无文件时默认 `markdown`。`mode` SHALL 驱动预览组件、滚动同步策略、工具栏专属按钮、目录树可编辑类型、新建模板与保存默认扩展名。

#### Scenario: Open markdown file sets markdown mode
- **WHEN** 用户打开 `.md` 文件
- **THEN** `mode` 为 `markdown`，预览使用 Markdown 渲染，目录树显示 `.md`

#### Scenario: Open html file sets html mode
- **WHEN** 用户打开 `.html` 或 `.htm` 文件
- **THEN** `mode` 为 `html`，预览使用 iframe 沙箱，目录树显示 `.html`/`.htm`

#### Scenario: Default mode without file
- **WHEN** 编辑器无当前文件
- **THEN** `mode` 默认 `markdown`

### Requirement: Open file from toolbar dialog
工具栏 SHALL 提供「打开文件」按钮，弹出系统文件选择器并按当前可编辑类型过滤。

#### Scenario: User opens a file via dialog
- **WHEN** 用户点击「打开文件」并在系统对话框中选中文件
- **THEN** 文件内容载入编辑器，其路径成为当前文件路径，`mode` 按后缀更新

#### Scenario: User cancels the dialog
- **WHEN** 用户点击「打开文件」但取消对话框未选文件
- **THEN** 编辑器内容与当前文件路径不变

### Requirement: Create new file by type
工具栏「新建」SHALL 提供「新建 Markdown」与「新建 HTML」两项，分别载入对应模板、清空当前文件路径并设置对应 `mode`。

#### Scenario: New markdown file
- **WHEN** 用户选择「新建 Markdown」
- **THEN** 编辑器载入 Markdown 模板，`mode` 为 `markdown`，当前文件路径清空

#### Scenario: New html file
- **WHEN** 用户选择「新建 HTML」
- **THEN** 编辑器载入 HTML5 模板，`mode` 为 `html`，当前文件路径清空

### Requirement: Save file
统一编辑器 SHALL 支持保存当前文件；已有文件写回原路径，新文件弹出保存对话框且默认扩展名随 `mode`（markdown → `.md`，html → `.html`），保存后刷新目录树。

#### Scenario: Save existing file
- **WHEN** 用户编辑已有文件并点击「保存」
- **THEN** 内容写回原路径，状态显示「已保存」，目录树刷新

#### Scenario: Save new file
- **WHEN** 用户编辑新文件并点击「保存」
- **THEN** 弹出保存对话框，默认扩展名随 `mode`，用户确认后写入并记录为当前文件

### Requirement: Toggle list, editor and preview
工具栏 SHALL 允许分别显示/隐藏文件列表、编辑器与预览区。

#### Scenario: Toggle editor visibility
- **WHEN** 用户点击「隐藏编辑」/「显示编辑」
- **THEN** 编辑器区域隐藏或显示

#### Scenario: Toggle preview visibility
- **WHEN** 用户点击「隐藏预览」/「显示预览」
- **THEN** 预览区域隐藏或显示

#### Scenario: Toggle file list visibility
- **WHEN** 用户点击「隐藏列表」/「显示列表」
- **THEN** 目录树侧栏隐藏或显示

### Requirement: Polymorphic preview by mode
预览区 SHALL 按 `mode` 挂载对应预览组件：`markdown` 使用 marked 渲染的 DOM 预览，`html` 使用 iframe 沙箱预览。

#### Scenario: Markdown preview renders DOM
- **WHEN** `mode` 为 `markdown` 且预览可见
- **THEN** 编辑器内容经 Markdown 渲染后显示在 DOM 预览区

#### Scenario: HTML preview uses sandbox
- **WHEN** `mode` 为 `html` 且预览可见
- **THEN** 编辑器内容通过 iframe 沙箱渲染，脚本与样式不泄漏到应用

### Requirement: Scroll sync by mode
滚动同步策略 SHALL 随 `mode`：`markdown` 模式编辑器与预览双向按比例同步；`html` 模式编辑器向 iframe 单向按比例同步。

#### Scenario: Markdown bidirectional scroll
- **WHEN** `mode` 为 `markdown`，用户在编辑器或预览中滚动
- **THEN** 另一侧按相同比例滚动

#### Scenario: HTML one-way scroll
- **WHEN** `mode` 为 `html`，用户在编辑器中滚动
- **THEN** iframe 预览按相同比例滚动

### Requirement: Context-aware toolbar
工具栏 SHALL 仅在 `markdown` 模式额外显示「导出 HTML」「导出 PDF」「语法介绍」；`html` 模式不显示这些按钮。

#### Scenario: Markdown shows export and syntax help
- **WHEN** `mode` 为 `markdown`
- **THEN** 工具栏显示「导出 HTML」「导出 PDF」「语法介绍」

#### Scenario: HTML hides markdown-only buttons
- **WHEN** `mode` 为 `html`
- **THEN** 工具栏不显示上述 markdown 专属按钮

### Requirement: Markdown export
`markdown` 模式 SHALL 支持将内容导出为 HTML 文件与 PDF 文件。

#### Scenario: Export HTML
- **WHEN** 用户在 markdown 模式点击「导出 HTML」
- **THEN** 内容经 Markdown 渲染并弹出保存对话框写出 `.html` 文件

#### Scenario: Export PDF
- **WHEN** 用户在 markdown 模式点击「导出 PDF」
- **THEN** 内容经渲染后导出为 `.pdf` 文件

### Requirement: Directory tree sidebar without recent files
侧栏 SHALL 仅包含懒加载目录树（见 `file-tree-explorer`），不包含「最近打开文件」区。

#### Scenario: Sidebar shows only tree
- **WHEN** 用户显示文件列表侧栏
- **THEN** 侧栏只显示目录树，没有「最近打开」区块

### Requirement: Save/new keyboard shortcuts
统一编辑器 SHALL 绑定 Ctrl/Cmd+S 保存、Ctrl/Cmd+N 新建快捷键，并 SHALL 在组件挂载时绑定、卸载时解绑，避免监听泄漏与重复触发。

#### Scenario: Save shortcut
- **WHEN** 用户按下 Ctrl/Cmd+S
- **THEN** 触发保存当前文件

#### Scenario: Listener cleaned up on unmount
- **WHEN** 用户离开编辑器标签使组件卸载
- **THEN** 键盘监听被解绑，不再重复触发
