## Why

F12 当前通过 `globalShortcut.register` 注册为系统级全局快捷键，即使应用不在焦点状态也会触发。这有两个问题：1) 可能与系统或其他应用的全局快捷键冲突；2) 用户预期 F12 只在 OneApp 内有效，不应影响其他应用。改为应用内快捷键可以避免冲突，行为更符合预期。

## What Changes

- 移除 `globalShortcut.register('F12')` 注册
- 移除 `globalShortcut.unregisterAll()` 调用（不再需要管理全局快捷键）
- 在 `App.vue` 的 `keydown` 监听器中添加 F12 切换 DevTools 的逻辑
- 移除 `electron/main.js` 中 `globalShortcut` 的 import（如果无其他用途）

## Capabilities

### New Capabilities
- `f12-shortcut`: F12 快捷键改为应用内监听，仅当 OneApp 窗口处于焦点时触发

### Modified Capabilities
<!-- No existing capabilities whose requirements are changing -->

## Impact

- `electron/main.js`: 移除 globalShortcut 相关代码
- `src/renderer/App.vue`: 添加 F12 keydown 监听
