## MODIFIED Requirements

### Requirement: File type drives editing mode

统一编辑器 SHALL 根据当前文件后缀确定编辑模式 `mode`：`.md` → `markdown`，`.html`/`.htm` → `html`，其他后缀或无后缀 → `plaintext`；无文件时默认 `markdown`。`mode` SHALL 驱动预览组件（plaintext 无预览）、滚动同步策略、工具栏专属按钮、目录树可编辑类型、新建模板与保存默认扩展名。

#### Scenario: Open markdown file sets markdown mode
- **WHEN** 用户打开 `.md` 文件
- **THEN** `mode` 为 `markdown`，预览使用 Markdown 渲染

#### Scenario: Open html file sets html mode
- **WHEN** 用户打开 `.html` 或 `.htm` 文件
- **THEN** `mode` 为 `html`，预览使用 iframe 沙箱

#### Scenario: Open plaintext file sets plaintext mode
- **WHEN** 用户打开非 `.md`/`.html`/`.htm` 后缀的文件
- **THEN** `mode` 为 `plaintext`，无预览区

#### Scenario: Default mode without file
- **WHEN** 编辑器无当前文件
- **THEN** `mode` 默认 `markdown`

### Requirement: Create new file by type

工具栏「新建」SHALL 提供「新建 Markdown」、「新建 HTML」与「新建纯文本」三项，分别载入对应模板（纯文本为空内容）、清空当前文件路径并设置对应 `mode`。

#### Scenario: New markdown file
- **WHEN** 用户选择「新建 Markdown」
- **THEN** 编辑器载入 Markdown 模板，`mode` 为 `markdown`，当前文件路径清空

#### Scenario: New html file
- **WHEN** 用户选择「新建 HTML」
- **THEN** 编辑器载入 HTML5 模板，`mode` 为 `html`，当前文件路径清空

#### Scenario: New plaintext file
- **WHEN** 用户选择「新建纯文本」
- **THEN** 编辑器内容清空，`mode` 为 `plaintext`，当前文件路径清空，默认保存为 `.txt`

### Requirement: Save file

统一编辑器 SHALL 支持保存当前文件；已有文件写回原路径，新文件弹出保存对话框且默认扩展名随 `mode`（markdown → `.md`，html → `.html`，plaintext → `.txt`），保存后刷新目录树。

#### Scenario: Save existing file
- **WHEN** 用户编辑已有文件并点击「保存」
- **THEN** 内容写回原路径，状态显示「已保存」，目录树刷新

#### Scenario: Save new file
- **WHEN** 用户编辑新文件并点击「保存」
- **THEN** 弹出保存对话框，默认扩展名随 `mode`，用户确认后写入并记录为当前文件
