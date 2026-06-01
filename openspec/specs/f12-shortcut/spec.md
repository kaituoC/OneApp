# f12-shortcut Specification

## Purpose
TBD - created by archiving change f12-app-level-shortcut. Update Purpose after archive.

## Requirements
### Requirement: F12 toggles DevTools within the app

当用户在 OneApp 窗口内按下 F12 键时，应用 SHALL 切换 DevTools 的打开/关闭状态。此快捷键仅在应用窗口处于焦点时生效，不响应系统全局的 F12 按键事件。

#### Scenario: F12 opens DevTools when closed
- **WHEN** 用户在 OneApp 窗口内按下 F12 且 DevTools 当前已关闭
- **THEN** DevTools 面板打开

#### Scenario: F12 closes DevTools when open
- **WHEN** 用户在 OneApp 窗口内按下 F12 且 DevTools 当前已打开
- **THEN** DevTools 面板关闭

#### Scenario: F12 does not trigger when app is not focused
- **WHEN** OneApp 窗口不在焦点状态（用户正在使用其他应用）
- **THEN** 按下 F12 不触发任何 DevTools 操作
