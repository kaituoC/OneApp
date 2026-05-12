## ADDED Requirements

### Requirement: HTML file listing

系统 SHALL 扫描工作目录并列出 `.html` 和 `.htm` 文件。

#### Scenario: List HTML files in directory
- **WHEN** 工作目录被设置
- **THEN** 系统列出该目录下所有 `.html` 和 `.htm` 文件（不含其他扩展名）

#### Scenario: Empty directory handling
- **WHEN** 工作目录中没有 HTML 文件
- **THEN** 显示"目录中暂无 .html 文件"提示
