## MODIFIED Requirements

### Requirement: F12 toggles DevTools within the app

开发运行时，应用 SHALL 仅在 OneApp 窗口内响应 F12 切换 DevTools；正式打包应用 SHALL 禁用此入口，保持生产菜单不暴露 Reload/DevTools。

#### Scenario: F12 opens DevTools when closed
- **WHEN** 非打包开发应用处于焦点且 DevTools 已关闭，用户按 F12
- **THEN** DevTools 面板打开

#### Scenario: F12 closes DevTools when open
- **WHEN** 非打包开发应用处于焦点且 DevTools 已打开，用户按 F12
- **THEN** DevTools 面板关闭

#### Scenario: F12 does not trigger when app is not focused
- **WHEN** OneApp 不处于焦点或正在运行正式打包应用
- **THEN** F12 不触发 DevTools
