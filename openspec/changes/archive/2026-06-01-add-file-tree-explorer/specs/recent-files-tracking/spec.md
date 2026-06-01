## MODIFIED Requirements

### Requirement: Recent files display
The editor SHALL display a "Recent Files" section as a collapsible area at the bottom of the left sidebar, below the directory tree, collapsed by default. When expanded it shows up to 50 recently opened files with their full paths visible.

#### Scenario: Recent files collapsed by default
- **WHEN** the user opens the editor tab
- **THEN** the recent files section is rendered collapsed at the bottom of the sidebar

#### Scenario: Expand to display recent files with full paths
- **WHEN** the user expands the recent files section
- **THEN** each entry shows the file name followed by its full directory path
- **THEN** long paths are truncated with ellipsis, with a tooltip showing the full path on hover

#### Scenario: Empty recent files
- **WHEN** the recentFiles list is empty and the section is expanded
- **THEN** the recent files section displays "暂无最近打开的文件" (no recently opened files)
