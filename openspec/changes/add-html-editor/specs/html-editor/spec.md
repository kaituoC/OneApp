## ADDED Requirements

### Requirement: HTML file editing

系统 SHALL 提供 HTML 文件编辑功能，允许用户打开、新建、编辑和保存 `.html` 和 `.htm` 文件。

#### Scenario: Open HTML file from dialog
- **WHEN** 用户点击"打开文件"按钮并选择 `.html` 或 `.htm` 文件
- **THEN** 文件内容加载到编辑器中，文件路径显示在状态栏

#### Scenario: Create new HTML file
- **WHEN** 用户点击"新建"按钮
- **THEN** 编辑器显示标准 HTML5 模板，当前文件路径清空

#### Scenario: Save existing HTML file
- **WHEN** 用户编辑已有 HTML 文件并点击"保存"
- **THEN** 文件内容写入原路径，状态栏显示"已保存"

#### Scenario: Save new HTML file
- **WHEN** 用户编辑新 HTML 文件并点击"保存"
- **THEN** 弹出保存对话框，默认扩展名为 `.html`，用户确认后写入文件

### Requirement: Editor/preview toggle

系统 SHALL 允许用户分别显示/隐藏编辑器和预览区域。

#### Scenario: Toggle editor visibility
- **WHEN** 用户点击"隐藏编辑"/"显示编辑"按钮
- **THEN** 编辑器区域显示或隐藏

#### Scenario: Toggle preview visibility
- **WHEN** 用户点击"隐藏预览"/"显示预览"按钮
- **THEN** 预览区域显示或隐藏

### Requirement: File list and recent files

系统 SHALL 在侧边栏显示工作目录中的 HTML 文件列表和最近打开的 HTML 文件列表。

#### Scenario: Display HTML file list
- **WHEN** 用户在设置中指定工作目录
- **THEN** 侧边栏列出该目录下的 `.html` 和 `.htm` 文件

#### Scenario: Open file from list
- **WHEN** 用户点击文件列表中的文件名
- **THEN** 文件内容加载到编辑器中
