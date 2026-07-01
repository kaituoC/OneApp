## ADDED Requirements

### Requirement: GitHub Release 更新检查

OneApp SHALL let users check the latest public GitHub Release from the Settings page and compare it with the running application version.

#### Scenario: 用户检查时已经是最新版本
- **WHEN** 用户在 Settings 中点击“检查更新”，且 latest Release 的 `tag_name` 不高于当前 `__APP_VERSION__`
- **THEN** 系统显示检查中状态，完成后通过统一消息弹窗提示“已是最新版本”并包含当前版本号

#### Scenario: 用户检查时存在新版本
- **WHEN** 用户在 Settings 中点击“检查更新”，且 latest Release 的 `tag_name` 高于当前 `__APP_VERSION__`
- **THEN** 系统显示检查中状态，完成后通过统一消息弹窗展示最新版本号、发布日期和更新说明摘要，并提供打开 Release 页面的入口

#### Scenario: 用户选择打开新版本页面
- **WHEN** 新版本弹窗显示后用户选择“前往下载”或等价入口
- **THEN** 系统使用外部浏览器打开 latest Release 的 URL

#### Scenario: 更新检查失败
- **WHEN** GitHub Release 请求失败、返回数据缺失或版本号无法解析
- **THEN** 系统通过统一消息弹窗展示清晰错误提示，并恢复检查按钮可用状态

### Requirement: 统一应用消息弹窗

OneApp SHALL route app-level information and confirmation dialogs through a narrow preload API backed by Electron `dialog.showMessageBox`.

#### Scenario: 消息框使用应用图标
- **WHEN** 渲染层请求显示应用级消息弹窗，且 OneApp 图标文件可用
- **THEN** 主进程显示系统消息框并注入 OneApp 应用图标

#### Scenario: 图标不可用时安全降级
- **WHEN** 渲染层请求显示应用级消息弹窗，但开发或生产路径下的图标文件不可用
- **THEN** 主进程仍显示消息框，并使用系统默认图标而不是抛出错误

#### Scenario: 渲染层不暴露通用 IPC
- **WHEN** 渲染层需要显示应用级消息或确认
- **THEN** preload 只暴露受限的消息框方法，并且不开放任意 channel 的 IPC 调用能力

#### Scenario: 设置页不使用原生 alert
- **WHEN** 设置页展示更新检查结果或错误
- **THEN** 系统使用统一应用消息弹窗，而不是渲染层原生 `alert`
