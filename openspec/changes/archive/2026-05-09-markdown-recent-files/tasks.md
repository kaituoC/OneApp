## 1. Git Branch Setup

- [x] 1.1 Create a new git branch (e.g., `feature/markdown-recent-files`) from `main` and switch to it. All implementation work MUST be done on this branch, never on `main`

## 2. Storage Layer - fileHelper.js

- [x] 2.1 Add `getRecentFiles()` function to read recentFiles from electron-store via `window.electronAPI.getStore()`
- [x] 2.2 Add `addRecentFile(filePath)` function that adds/updates a file entry with timestamp, maintains max 50 entries, sorted by timestamp descending
- [x] 2.3 Add `removeRecentFile(filePath)` function that removes an entry by path and persists the updated list
- [x] 2.4 Integrate `addRecentFile()` into existing `readFile()` wrapper so every file open automatically records to recent files

## 3. UI Layout - MarkdownTab.vue Template

- [x] 3.1 Split the `.file-list` sidebar into two vertically stacked sections
- [x] 3.2 Apply flex layout so both sections share available height with independent `overflow-y: auto` scrolling
- [x] 3.3 Add section headers: "文件列表" for workspace files (existing) and "最近打开" for recent files (new)
- [x] 3.4 Update the toggle button to show/hide both sections together (existing behavior preserved)

## 4. Recent Files Display - MarkdownTab.vue

- [x] 4.1 Load recent files on component mount and display in the lower section, showing filename + full path
- [x] 4.2 Implement path truncation with ellipsis for long file paths, with hover tooltip showing complete path
- [x] 4.3 Display "暂无最近打开的文件" placeholder when recent files list is empty
- [x] 4.4 Style recent file entries to match existing file-item visual style (hover highlight, active state)

## 5. File Existence Check & Open

- [x] 5.1 Implement click handler for recent file entries that attempts to read the file
- [x] 5.2 On read failure (file not found), show alert "文件不存在，已从列表中移除" and call `removeRecentFile()`
- [x] 5.3 On success, load file content into editor, set current file path, and refresh recent files list
- [x] 5.4 Add hover tooltip support for recent file entries (reuse existing tooltip mechanism)

## 6. Styling & Polish

- [x] 6.1 Add CSS for two-section layout with independent scrolling, including section headers and dividers
- [x] 6.2 Ensure both sections render correctly in dark and light themes
- [x] 6.3 Verify minimum heights and overflow behavior for both sections
