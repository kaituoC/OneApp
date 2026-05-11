## Context

F12 快捷键当前在 `electron/main.js` 中通过 `globalShortcut.register` 注册为系统级全局快捷键。该快捷键用于切换 DevTools 的打开/关闭状态。`globalShortcut` 模块在 `app.whenReady()` 时注册，在 `window-all-closed` 时全部注销。

`App.vue` 已经有一个 `document.addEventListener('keydown', ...)` 用于处理 `Ctrl/Cmd + 1~5` 和 `Ctrl/Cmd + Tab` 的标签切换。

## Goals / Non-Goals

**Goals:**
- 将 F12 快捷键从系统全局改为应用内监听
- 只在 OneApp 窗口处于焦点时响应 F12
- 保持现有功能：切换 DevTools 的打开/关闭

**Non-Goals:**
- 不改变 DevTools 的打开/关闭逻辑
- 不涉及其他快捷键的改动

## Decisions

1. **在 App.vue 的 keydown 监听中添加 F12 处理**，而不是在其他组件中添加。理由：App.vue 已经是应用内快捷键的集中管理位置，避免分散。

2. **通过 IPC 调用主进程的 `webContents.toggleDevTools()`**，而不是在渲染器直接调用。理由：渲染器是 web 环境，没有直接访问 Electron API 的能力。需要先检查 preload 是否已暴露相关 API，如果没有则需要添加。

3. **保留 `globalShortcut` import 但移除 `register`/`unregisterAll` 调用**，如果该 import 在 main.js 中只有这一个用途，则一并移除 import 语句。

## Risks / Trade-offs

- **[风险]** 如果渲染器没有暴露 toggleDevTools 的 IPC 接口，需要新增 IPC 通道。→ **缓解**: 检查 preload.cjs 和 main.js，如需要则添加最小化的 IPC handler。
- **[权衡]** 应用内快捷键在窗口失去焦点时不响应，与之前全局行为不同。→ 这是预期行为变更，非问题。
