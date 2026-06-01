## MODIFIED Requirements

### Requirement: File list panel layout
The file list panel in the Markdown editor SHALL display a lazy-loaded directory tree (see `file-tree-explorer`) as its primary area, replacing the former flat single-directory `.md` listing. The recently opened files list SHALL be relocated to a collapsible section at the bottom of the sidebar, collapsed by default, so the directory tree occupies the main body. The tree section and the recent files section SHALL each have independent vertical scrolling.

#### Scenario: Tree-based file list display
- **WHEN** the user opens the Markdown editor tab
- **THEN** the left sidebar shows a directory tree as the primary area
- **THEN** the recent files list appears as a collapsed section at the bottom

#### Scenario: Recent files section collapsed by default
- **WHEN** the user opens the Markdown editor tab
- **THEN** the recent files section is collapsed
- **WHEN** the user clicks the recent files section header
- **THEN** the recent files list expands

#### Scenario: Toggle visibility of file list
- **WHEN** the user toggles the file list visibility via the toolbar button
- **THEN** both the directory tree and the recent files section are shown or hidden together
