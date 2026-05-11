## 1. 移除主进程全局快捷键注册

- [x] 1.1 从 `electron/main.js` 中移除 `globalShortcut.register('F12', ...)` 代码块
- [x] 1.2 从 `electron/main.js` 中移除 `globalShortcut.unregisterAll()` 调用
- [x] 1.3 从 `electron/main.js` 的 import 语句中移除 `globalShortcut`（确认无其他用途后）

## 2. 添加 IPC 通道用于切换 DevTools

- [x] 2.1 在 `electron/main.js` 中添加 `ipcMain.handle('toggle-devtools', ...)` handler，调用 `BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools()`
- [x] 2.2 在 `preload.cjs` 中添加 `toggleDevTools: () => ipcRenderer.invoke('toggle-devtools')` 到 `electronAPI`

## 3. 在渲染器中注册 F12 应用内快捷键

- [x] 3.1 在 `src/renderer/App.vue` 的 `keydown` 监听器中添加 F12 按键处理，调用 `window.electronAPI.toggleDevTools()`
- [x] 3.2 验证 `npm run dev` 启动后 F12 能正常切换 DevTools，且应用不在焦点时不响应
