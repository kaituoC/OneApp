## MODIFIED Requirements

### Requirement: GitHub Release 更新检查

OneApp SHALL let users check the latest public non-draft, non-prerelease GitHub Release from the Settings page, compare it with the running application version determined by the main process, and present a platform-appropriate manual download path.

#### Scenario: 用户检查时已经是最新版本
- **WHEN** 用户在 Settings 中点击“检查更新”，且 latest Release 的 `tag_name` 不高于主进程读取的应用版本
- **THEN** 系统显示检查中状态，完成后通过统一消息弹窗提示“已是最新版本”并包含当前版本号

#### Scenario: 用户检查时存在当前平台安装包
- **WHEN** 用户在 Settings 中点击“检查更新”，latest Release 的 `tag_name` 高于运行版本，且 Release 附件包含当前操作系统与 CPU 架构的受支持安装包
- **THEN** 系统显示检查中状态，完成后通过统一消息弹窗展示最新版本号、发布日期、更新说明摘要和安装包名称，并提供直接下载该安装包的入口

#### Scenario: 用户下载匹配的安装包
- **WHEN** 新版本弹窗显示后用户选择“下载更新”或等价入口，且存在匹配的安装包 URL
- **THEN** 系统使用外部浏览器打开该安装包的 HTTPS 下载 URL

#### Scenario: 当前平台没有匹配安装包
- **WHEN** 发现新版本但 Release 不包含当前操作系统与 CPU 架构的受支持安装包
- **THEN** 系统明确说明未找到匹配安装包，并提供打开 latest Release 页面的入口

#### Scenario: 更新检查失败
- **WHEN** GitHub Release 请求超时、受限流、返回非成功状态、返回数据缺失或版本号无法解析
- **THEN** 系统通过统一消息弹窗展示清晰错误提示，并恢复检查按钮可用状态

## ADDED Requirements

### Requirement: 可选启动更新检查

OneApp SHALL provide a Settings preference for update checks on launch, default it to disabled, and limit successful automatic checks to at most once every 24 hours.

#### Scenario: 默认不在启动时请求更新
- **WHEN** 用户尚未启用启动检查更新偏好
- **THEN** 应用启动后不得自动请求 GitHub Release

#### Scenario: 启用后检查到新版本
- **WHEN** 用户已启用启动检查更新偏好，距离上次成功检查已至少 24 小时，且应用启动后发现新版本
- **THEN** 系统显示与手动检查等价的新版本提示和手动下载入口，并记录本次成功检查时间

#### Scenario: 启用后检查失败或无需提示
- **WHEN** 启动检查请求失败、未发现新版本，或距离上次成功检查不足 24 小时
- **THEN** 系统不得显示错误弹窗或重复的新版本弹窗；仅在成功完成实际检查时记录检查时间
