## Why

当前“检查更新”只能发现 GitHub Release 并打开网页；用户仍需自行在多个附件中判断适合自己设备的安装包。网络超时、GitHub 限流和附件缺失等情况也缺乏可操作的提示，无法形成可靠的手动更新闭环。

## What Changes

- 更新检查由主进程读取运行中应用版本，并为 GitHub 请求增加超时与可诊断的错误结果。
- 解析最新正式 Release 的附件，并按当前操作系统和 CPU 架构选择可下载的安装包。
- 设置页在有新版时展示匹配的安装包；用户可直接用系统浏览器下载，找不到匹配附件时仍可打开 Release 页面。
- 记录最近一次成功检查的时间，并提供默认关闭的“启动时检查更新”偏好；启用后每天最多自动检查一次，发现新版才提示。
- 不引入 `electron-updater`、后台下载、静默安装或重启安装。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `app-update-check-dialogs`: 将更新检查从仅打开 Release 页面扩展为平台适配的直接下载、可选启动检查和更明确的故障提示。

## Impact

- 受影响代码包括 `electron/appDialogs.js`、`electron/main.js`、`preload.cjs`、`SettingsTab.vue` 和 `updateHelper.js`，以及对应单元测试。
- 增加少量 `electron-store` 更新偏好和最近检查状态；不新增运行时依赖，也不改变 GitHub Actions 发布方式。
