## MODIFIED Requirements

### Requirement: Type-isolated recent file lists

系统 SHALL 为 Markdown 和 HTML 编辑器维护独立的最近文件列表。Markdown 编辑器只记录 `.md` 文件，HTML 编辑器只记录 `.html`/`.htm` 文件。

#### Scenario: Markdown editor records only .md files
- **WHEN** 用户在 Markdown 编辑器中打开 `.md` 文件
- **THEN** 该文件仅添加到 Markdown 的最近文件列表，不出现在 HTML 编辑器的最近文件列表中

#### Scenario: HTML editor records only .html files
- **WHEN** 用户在 HTML 编辑器中打开 `.html` 或 `.htm` 文件
- **THEN** 该文件仅添加到 HTML 的最近文件列表，不出现在 Markdown 编辑器的最近文件列表中

#### Scenario: Wrong-type file not rendered in wrong editor
- **WHEN** 用户在 HTML 编辑器中点击最近文件列表（应只显示 `.html`/`.htm`）
- **THEN** 文件在 HTML 预览器中正确渲染，不会出现渲染失败
