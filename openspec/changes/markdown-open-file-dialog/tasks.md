## 1. Git Branch Setup

- [x] 1.1 Create a new git branch from `main` (e.g., `feature/markdown-open-file-dialog`) for this work

## 2. Toolbar Button

- [x] 2.1 Import `openFile` from `fileHelper.js` in MarkdownTab.vue
- [x] 2.2 Add "打开文件" button in the toolbar, positioned after the layout toggle buttons
- [x] 2.3 Implement click handler: call `openFile(props.workDir)` → get path → call `readFile(path)` → update `editorContent` and `currentFilePath`
- [x] 2.4 Handle cancel scenario: if `openFile` returns `null`, do nothing
- [x] 2.5 Emit `file-open` event with the opened file path after successful open
