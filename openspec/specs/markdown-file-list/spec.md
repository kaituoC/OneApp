# markdown-file-list Specification

## Purpose
TBD - created by archiving change markdown-recent-files. Update Purpose after archive.
## Requirements
### Requirement: File list panel layout
The file list panel in the Markdown editor SHALL be divided into two vertically stacked sections: the upper section displays workspace `.md` files (existing behavior), and the lower section displays recently opened files. Both sections SHALL have independent vertical scrolling.

#### Scenario: Two-section file list display
- **WHEN** the user opens the Markdown editor tab
- **THEN** the left sidebar shows workspace files in the upper section and recent files in the lower section
- **THEN** each section scrolls independently when its content overflows its allocated height

#### Scenario: Toggle visibility of sections
- **WHEN** the user toggles the file list visibility via the toolbar button
- **THEN** both the workspace file list and recent files sections are shown or hidden together

