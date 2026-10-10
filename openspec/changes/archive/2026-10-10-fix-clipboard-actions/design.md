## Context

动机见 proposal。当前窗口 `secureContents` 拒绝浏览器权限，各复制入口却直接使用浏览器剪贴板 API。`handle()` 已统一校验工作台 sender、main frame 与页面 URL，可承载固定能力。时间结果 disabled 表达式的末项是空错误字符串，Vue 将其作为 Boolean attribute 保留。

## Goals / Non-Goals

**Goals:** 复用现有可信 IPC 策略，统一文本与 PNG 复制路径和可访问反馈；将 #64、#65 纳入同一份规格和回归验证。

**Non-Goals:** 不读取用户剪贴板、不新增依赖、不开放浏览器权限、不更改 Agent 编排/CLI 权限/持久化/订阅、不更改工具计算、CI、Electron runtime 或打包流程。

## Decisions

### 受控 Electron 写入

preload 暴露 `clipboard.writeText(text)` 和 `clipboard.writePng(dataUrl)` 两个固定接口。主进程通过既有 `handle()` 注册固定 channel，并委托独立、可依赖注入的剪贴板模块做数据校验、图片解码和写入，返回 `{ success, error? }`。不提供读接口或任意 invoke。浏览器权限继续全部拒绝；不采用放开 clipboard 权限的方案，避免扩展页面可申请的权限。

文本必须为 string，UTF-8 上限 32 MiB，与既有大型文本约束保持相近；拒绝非法类型而不是主进程隐式转换。PNG 仅接受 `data:image/png;base64,`，校验规范 base64、2 MiB 上限、PNG signature/IHDR 与宽高 1–1024；解码后还检查 nativeImage 非空且实际尺寸合法，再写入。禁止路径、远端 URL 和其他 MIME。

### 一套 renderer 反馈

`useCopyToast` 增加 PNG 写入，与文本共享结果等待、失败捕获及短提示；只调用 preload，不向浏览器 API 回退。接口缺失和结构化失败都返回 false。页面已存在的成功状态仅在 true 时设置。toast 使用 status / aria-live 语义，研讨室接入同一 composable，不改其主进程模块。

时间复制条件显式转换 `tsError` / `dateError` 为 Boolean，计算与结果签名逻辑保留。使用真实 Vue 挂载验证三个 DOM disabled 属性，避免仅匹配源码的测试。

## Risks / Trade-offs

- PNG 解码受不可信输入影响 → 在 nativeImage 解码前限定字节与声明尺寸，解码失败/实际尺寸异常时不写入。
- Electron IPC 写入仍需系统支持 → 捕获异常并展示失败；在生产 file 页面中读取测试写入的文本/图片验证真实结果。
- UI 测试使用 mocked IPC，无法发现系统拒绝 → 额外执行 Electron 真实按钮回归，覆盖深浅主题、时间结果、研讨室合成消息及 QR PNG。
- 所有复制写入会替换系统剪贴板 → 实际回归保留并恢复原格式数据，既有内容仅在测试进程内短暂保存，不输出或持久化。
- Windows/Linux 运行行为未在当前机器实测 → 测试覆盖通用数据校验与接口行为，交付明确平台覆盖边界。

## Migration Plan

没有持久化迁移。一个 patch 版本同时发布两个 Issue 的修复；失败时可通过普通版本回退恢复旧行为，不改写历史或 tag。
