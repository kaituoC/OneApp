## Context

现有实现由 SettingsTab 将编译期版本号传给 `check-for-updates` IPC，主进程请求 GitHub `releases/latest`，渲染层仅在系统弹窗中提供 Release 页面链接。GitHub 响应中的 `assets` 未被使用，且请求没有超时、限流诊断和成功检查记录。

发布流程会为 macOS、Windows 和 Linux 上传带平台、架构标识的安装包，但不提供 `electron-updater` 所需的元数据；macOS 产物也尚未完成正式签名与 notarization。因此本变更必须维持浏览器下载和用户手动安装。

## Goals / Non-Goals

**Goals:**

- 以主进程的运行版本为唯一版本来源，检查最新正式 GitHub Release。
- 在限定时间内得到可区分的成功、网络、超时、限流、响应和附件不匹配结果。
- 为当前 `process.platform` / `process.arch` 选出安全的 GitHub Release 安装包 URL，并在用户确认后交由系统浏览器下载。
- 支持默认关闭、每日最多一次的启动检查偏好；只在有新版时提示。
- 用纯函数隔离版本、Release 和附件选择逻辑，使各路径可单测。

**Non-Goals:**

- 不引入 `electron-updater`、后台下载、下载进度、校验、重启安装或静默安装。
- 不更改 GitHub Actions 的发布方式、产物名称或签名策略。
- 不请求认证 Token、不采集更新遥测。

## Decisions

### 由主进程确定版本和平台

`check-for-updates` IPC 不再接收渲染进程版本参数；主进程通过 `app.getVersion()` 和 `process.platform` / `process.arch` 形成检查上下文。这样可以避免预加载边界把用于比较的输入暴露给渲染层，也能让匹配逻辑与实际运行包一致。

备选方案是继续传递 `__APP_VERSION__`；它实现更少，但不利于收窄 IPC 输入，也不能保证与 Electron 运行版本一致，因此不采用。

### 用 AbortController 实现有界 GitHub 请求

`appDialogs` 为 fetch 建立有限时长的 AbortController；捕获 AbortError 后返回“请求超时”。非 2xx 响应仍保留状态码，并在 403 且 GitHub 速率限制头表明额度耗尽时给出限流信息。

备选方案是无限等待或重试。手动检查不应长时间卡住设置页；自动重试会放大 GitHub 未认证 API 的限流风险，故不采用。

### 用白名单规则匹配 Release 附件，失败时回退 Release 页面

`updateHelper` 只接受 HTTPS 的 GitHub Release 附件 URL，按当前平台/架构的文件名后缀挑选一个可安装文件：macOS 优先 `.dmg`，Windows `.exe`，Linux `.AppImage`，并要求文件名包含对应平台和架构标识。没有候选项时结果仍表示“存在新版”，但不提供直接下载 URL，UI 显示“查看发布页”。

备选方案是猜测固定文件名或直接取首个 asset。前者会与发版命名演进耦合，后者可能下载错误平台文件，故不采用。

### 仅在用户主动启用后进行每日启动检查

electron-store 保存 `updateCheckOnLaunch` 和 `lastUpdateCheckAt`。应用窗口加载后，主进程仅当偏好开启且距离上次成功检查至少 24 小时时运行检查；仅发现新版时向现有窗口发送受限事件，以显示与手动检查一致的更新提示。失败不弹窗、不更新成功时间，下次到期后再尝试。

备选方案是默认启动检查或每次启动检查。它们会造成意外网络请求和可能的重复打扰，不采用。

## Risks / Trade-offs

- [GitHub 未认证 API 限流或网络不可达] → 手动检查显示具体可理解的错误；启动检查静默失败且不记为成功。
- [Release 缺少当前平台附件或命名异常] → 不猜测下载文件，回退到 Release 页面。
- [用户安装位置或 Gatekeeper 阻止安装] → 不承担安装职责，继续由 Release notes 和系统浏览器引导用户。
- [启动检查事件在窗口未就绪时丢失] → 在 `did-finish-load` 后执行，并只发送新版通知；用户仍随时可手动检查。

## Migration Plan

1. 新增 store 默认值，使既有用户自动获得关闭的启动检查偏好。
2. 发布后，现有设置页按钮继续可用；旧版本不受服务器端变更影响。
3. 若发现附件匹配问题，可回滚到仅打开 Release 页面；不会损坏已下载或已安装的应用。

## Open Questions

- 无。当前 CI 的产物命名模式足以通过受控测试夹具验证；实际找不到附件时的 Release 页面回退覆盖命名偏差。
