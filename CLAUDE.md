# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OneApp is an Electron + Vue 3 desktop application providing developer tools: Markdown editor, JSON formatter, text diff comparison, and time conversion utilities.

## Commands

```bash
npm run dev        # Start development mode with hot reload
npm run build      # Build for production (outputs to out/)
npm run preview    # Preview production build
npm run dist       # Package distributable (DMG/ZIP for Mac)
npm test           # Run unit tests
npm run test:watch # Run tests in watch mode
npm test -- tests/jsonHelper.test.js  # Run single test file
```

## Architecture

### Process Separation

- **Main process** (`electron/main.js`): Node.js environment, handles file I/O, dialogs, PDF export, global shortcuts (F12 for DevTools), and app configuration via electron-store
- **Preload script** (`preload.cjs`): CommonJS module that bridges main/renderer via contextBridge, exposing `window.electronAPI`
- **Renderer process** (`src/renderer/`): Vue 3 SPA with Composition API, web environment only

### IPC Communication Pattern

Renderer calls main process through `preload.cjs` exposed API:
```js
// Renderer (fileHelper.js)
const result = await window.electronAPI.readFile(filePath)

// Preload (preload.cjs)
readFile: (filePath) => ipcRenderer.invoke('read-file', filePath)

// Main (main.js)
ipcMain.handle('read-file', async (event, filePath) => { ... })
```

All IPC handlers return `{ success, content/error }` pattern for consistent error handling.

**fileHelper.js** wraps IPC calls with additional logic (path validation, recent files tracking).

### Utility Modules

Core utility functions in `src/renderer/utils/` are pure JavaScript and unit-testable:
- **jsonHelper.js**: formatJSON, minifyJSON, validateJSON, unescapeJSON - all return `{ success, result/error }` with line/column error positions
- **diffHelper.js**: diffTextUnified (git-style), diffTextSplit (side-by-side), diffStats - uses diff-match-patch library
- **timeHelper.js**: formatDate, parseDate, timestampToDate, dateToTimestamp - pure date/timestamp conversion
- **fileHelper.js**: IPC wrapper with recent files tracking and path validation

### Build System

electron-vite builds three separate bundles:
- `out/main/main.js` - Main process (ESM)
- `out/preload/preload.mjs` - Preload script
- Renderer served via Vite dev server or built to `out/renderer/`

Assets (`electron/assets/icon.*`) are copied to `out/main/assets/` during build via custom plugin in `electron.vite.config.js`.

### Key Components

- **App.vue**: Root component managing tab state, theme, font size, recent files, and keyboard shortcuts (Ctrl+1-5, Ctrl+Tab)
- **EditorWithLineNumbers.vue**: Reusable textarea with synced line-number column
- **MarkdownTab.vue**: File management, editor/preview toggle, scroll sync, PDF/HTML export
- **DiffTab.vue**: Split/unified diff views with scroll sync, uses diff-match-patch library
- **SettingsTab.vue**: Platform-aware shortcuts (Cmd vs Ctrl), electron-store persistence

### App Configuration

electron-store defaults (main.js):
```js
workDir: '',      // Default working directory
theme: 'dark',    // Theme preference
fontSize: 14,     // Editor font size
recentFiles: []   // Recent file history
```

### PDF Export Mechanism

PDF export creates a hidden BrowserWindow to render HTML content, then uses `printToPDF()` API. This ensures proper styling and layout before generating the PDF file.

### Styling

CSS variables in `main.css` support dark/light themes via `[data-theme="light"]`. Theme applied by setting `data-theme` attribute on `<html>` element via JS in App.vue.

### Window Configuration

Mac-specific: `titleBarStyle: 'hiddenInset'` with 78px left padding on header for traffic light buttons. Dock icon set via `app.dock.setIcon()` and app name via `app.setName('OneApp')`.