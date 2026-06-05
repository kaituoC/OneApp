## ADDED Requirements

### Requirement: Plaintext mode for unknown extensions

统一编辑器 SHALL 将非 `.md`、`.html`、`.htm` 后缀的文件识别为 `plaintext` mode。

#### Scenario: Open a .txt file
- **WHEN** 用户打开 `.txt` 文件
- **THEN** `mode` 为 `plaintext`，编辑器全屏显示，无预览区

#### Scenario: Open a .js file
- **WHEN** 用户打开 `.js` 文件
- **THEN** `mode` 为 `plaintext`，编辑器全屏显示，无预览区

#### Scenario: Open a file without extension
- **WHEN** 用户打开无后缀文件
- **THEN** `mode` 为 `plaintext`

### Requirement: No preview in plaintext mode

统一编辑器 SHALL 在 `plaintext` mode 下隐藏预览区，编辑器占满内容区宽度。工具栏 SHALL NOT 显示"显示/隐藏预览"、"导出 HTML"、"导出 PDF"、"语法介绍"按钮。

#### Scenario: Toolbar in plaintext mode
- **WHEN** `mode` 为 `plaintext`
- **THEN** 工具栏仅显示：显示/隐藏列表、显示/隐藏编辑、打开文件、新建、保存

#### Scenario: Editor full width in plaintext mode
- **WHEN** `mode` 为 `plaintext` 且编辑器可见
- **THEN** 编辑器占满内容区（无预览分栏）

### Requirement: Create new plaintext file

"新建"下拉菜单 SHALL 包含"新建纯文本"选项，创建默认文件名 `untitled.txt`、内容为空的新文件。

#### Scenario: User creates new plaintext file
- **WHEN** 用户点击"新建 ▾"并选择"新建纯文本"
- **THEN** 编辑器内容清空，`mode` 设为 `plaintext`，默认保存文件名为 `untitled.txt`

### Requirement: Open file dialog includes all files

系统文件对话框 SHALL 提供"所有文件"过滤选项，允许用户打开任意类型文件。

#### Scenario: Open dialog shows all files filter
- **WHEN** 用户点击"打开文件"
- **THEN** 对话框过滤列表包含"所有文件 (*)"选项
