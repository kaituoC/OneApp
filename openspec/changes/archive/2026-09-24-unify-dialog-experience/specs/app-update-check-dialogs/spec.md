## MODIFIED Requirements

### Requirement: GitHub Release 更新检查

OneApp SHALL let users check the latest public non-draft, non-prerelease GitHub Release from the Settings page, compare it with the running application version determined by the main process, and present a platform-appropriate manual download path.

#### Scenario: 用户检查时已经是最新版本
- **WHEN** 用户在 Settings 中点击“检查更新”，且 latest Release 的 `tag_name` 不高于主进程读取的应用版本
- **THEN** 系统显示检查中状态，完成后通过统一消息弹窗提示“已是最新版本”并包含当前版本号

#### Scenario: 用户检查时存在当前平台安装包
- **WHEN** 用户在 Settings 中点击“检查更新”，latest Release 的 `tag_name` 高于运行版本，且 Release 附件包含当前操作系统与 CPU 架构的受支持安装包
- **THEN** 系统显示检查中状态，完成后通过应用内详情弹窗展示最新版本号、发布日期、完整格式化更新说明和安装包信息，并提供直接下载该安装包的入口

#### Scenario: 用户下载匹配的安装包
- **WHEN** 新版本弹窗显示后用户选择“下载更新”或等价入口，且存在匹配的安装包 URL
- **THEN** 系统使用外部浏览器打开该安装包的 HTTPS 下载 URL

#### Scenario: 当前平台没有匹配安装包
- **WHEN** 发现新版本但 Release 不包含当前操作系统与 CPU 架构的受支持安装包
- **THEN** 系统明确说明未找到匹配安装包，并提供打开 latest Release 页面的入口

#### Scenario: 更新检查失败
- **WHEN** GitHub Release 请求超时、受限流、返回非成功状态、返回数据缺失或版本号无法解析
- **THEN** 系统通过统一消息弹窗展示清晰错误提示，并恢复检查按钮可用状态

### Requirement: 统一应用消息弹窗

OneApp SHALL 使用系统消息框展示简短信息与费用确认；更新详情、语法帮助、发送确认与工具搜索使用统一应用内详情弹窗。系统能力仍经窄 preload API 访问。

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
- **WHEN** 设置页展示无需更新或检查失败等短结果
- **THEN** 系统使用统一应用消息弹窗，而不是渲染层原生 `alert`
