## ADDED Requirements

### Requirement: Recent files persistence
The system SHALL store recently opened files in electron-store under the `recentFiles` key as an array of objects `{ path: string, timestamp: number }`, sorted by timestamp descending (most recent first), with a maximum of 50 entries.

#### Scenario: File opened successfully
- **WHEN** a user opens a markdown file from any source (file list, recent files, open dialog)
- **THEN** the file's absolute path and current timestamp are added to the recentFiles list
- **THEN** if the file was already in the list, its timestamp is updated and it moves to the top
- **THEN** if the list exceeds 50 entries, the oldest entry is removed

#### Scenario: Retrieve recent files
- **WHEN** the MarkdownTab component mounts or the file list is refreshed
- **THEN** the system reads recentFiles from electron-store and displays them in the recent files section

### Requirement: Recent files display
The Markdown editor SHALL display a "Recent Files" section below the workspace file list in the left sidebar, showing up to 50 recently opened files with their full paths visible.

#### Scenario: Display recent files with full paths
- **WHEN** the user views the recent files section
- **THEN** each entry shows the file name followed by its full directory path
- **THEN** long paths are truncated with ellipsis, with a tooltip showing the full path on hover

#### Scenario: Empty recent files
- **WHEN** the recentFiles list is empty
- **THEN** the recent files section displays "暂无最近打开的文件" (no recently opened files)

### Requirement: File existence validation
When a user clicks a recent file entry, the system SHALL verify the file still exists before opening it.

#### Scenario: File exists and opens
- **WHEN** user clicks a recent file entry and the file exists at the stored path
- **THEN** the file content is loaded into the editor
- **THEN** the file entry's timestamp is updated to the current time

#### Scenario: File no longer exists
- **WHEN** user clicks a recent file entry and the file does not exist
- **THEN** a toast or alert message displays "文件不存在，已从列表中移除"
- **THEN** the entry is removed from the recentFiles list
- **THEN** the UI updates to reflect the removal

### Requirement: Recent files section scrollable
The recent files section SHALL have its own independent vertical scrollbar, separate from the workspace file list section above it.

#### Scenario: Scroll recent files independently
- **WHEN** the recent files list contains more entries than fit in its allocated height
- **THEN** the user can scroll the recent files section without affecting the workspace file list section
