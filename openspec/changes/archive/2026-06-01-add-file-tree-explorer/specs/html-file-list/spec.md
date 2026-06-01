## MODIFIED Requirements

### Requirement: HTML file listing

HTML 编辑器 SHALL 通过侧边栏的懒加载目录树（见 `file-tree-explorer`）浏览并打开 `.html` / `.htm` 文件，取代原先「扫描单一工作目录并平铺列出」的方式。目录树中仅显示文件夹与 `.html` / `.htm` 文件。

#### Scenario: Browse and open HTML files via tree
- **WHEN** 用户在 HTML 编辑器侧边栏的目录树中浏览某文件夹
- **THEN** 系统显示该文件夹下的子文件夹与 `.html` / `.htm` 文件（不含其他扩展名）

#### Scenario: No workDir configured
- **WHEN** 未设置工作目录
- **THEN** 树区域显示提示，引导用户通过「打开文件夹」选择目录
