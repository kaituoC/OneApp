## ADDED Requirements

### Requirement: Open file from toolbar
The Markdown editor toolbar SHALL include an "Open File" button that launches a system file picker dialog allowing the user to select and open any `.md` file from any location on the system.

#### Scenario: User opens a file via dialog
- **WHEN** user clicks the "Open File" button and selects a `.md` file in the system dialog
- **THEN** the file content is loaded into the editor
- **THEN** the file's path becomes the current file path

#### Scenario: User cancels the dialog
- **WHEN** user clicks "Open File" but cancels the system dialog without selecting a file
- **THEN** no changes are made to the editor content or current file path

#### Scenario: Opened file is added to recent files
- **WHEN** user opens a file via the dialog
- **THEN** the file is automatically added to the recent files list (via the existing readFile → addRecentFile chain)