## Context

生成器当前由 `GeneratorTab.vue` 通过左侧子工具导航承载 UUID、随机密码和 Lorem。核心逻辑位于 `generatorHelper.js`，返回统一 `{ success, result/error }` 结构。二维码生成需要异步 PNG data URL，并且复制 PNG 与普通文本复制不同，需要使用 ClipboardItem。

## Goals / Non-Goals

**Goals:**

- 新增二维码子工具，保留生成器现有工具不回退。
- 支持文本 / URL 输入、尺寸设置、纠错级别设置。
- 输出 PNG data URL 供预览、下载和复制。
- 空输入、尺寸越界、纠错级别无效时给出明确错误。

**Non-Goals:**

- 不做 Logo、颜色、圆角等品牌样式。
- 不做扫码解析或图片识别。
- 不做生成历史或批量二维码。

## Decisions

1. 使用 `qrcode` 库生成 PNG data URL。
   - 原因：成熟轻量，浏览器可用，支持纠错级别和宽度配置。
   - 备选：手写二维码编码。放弃原因是编码复杂且容易出错。

2. helper 返回 data URL，UI 负责预览、下载和复制。
   - 原因：helper 保持环境无关，复制 PNG 依赖浏览器 Clipboard API，应留在组件层。

3. 尺寸限制为 128-1024。
   - 原因：覆盖常见分享和下载场景，避免生成过小不可扫或过大占用内存。

## Risks / Trade-offs

- ClipboardItem 在部分环境不可用 → UI 给出复制失败提示，不影响下载 PNG。
- data URL 输出较长 → 二维码工具不使用文本输出编辑器，改用预览区和下载/复制按钮。
- 某些超长文本会生成失败 → 保留库错误信息并加中文提示。
