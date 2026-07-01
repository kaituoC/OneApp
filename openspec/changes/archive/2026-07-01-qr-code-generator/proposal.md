## Why

生成器已覆盖 UUID、随机密码和 Lorem，占位与随机生成场景基本完整；二维码是开发者在调试链接、分享本地地址、移动端扫码验证时常用的生成能力，适合并入同一生成工具。

本次聚焦文本 / URL 到 PNG 二维码的基础生成、预览、下载和复制，避免品牌化样式和扫码解析等更重能力。

## What Changes

- 在生成器中新增「二维码」子工具。
- 支持输入文本或 URL，生成二维码 PNG 预览。
- 支持设置尺寸和纠错级别。
- 支持下载 PNG 和复制 PNG。
- 空输入时不生成并展示明确提示。
- 不做 Logo、颜色、圆角、图片识别或扫码解析。

## Capabilities

### New Capabilities

- `qr-code-generator`: 生成器中的二维码 PNG 生成、预览、下载和复制能力。

### Modified Capabilities

- `generator-tools`: 生成器工具集合新增二维码子工具。
- `workbench-shell`: 生成器导航摘要体现二维码能力。

## Impact

- 依赖：引入 `qrcode` 生成 PNG data URL。
- 渲染层：`GeneratorTab.vue` 新增二维码配置、预览、下载和复制 PNG。
- 工具函数：`generatorHelper.js` 新增二维码生成纯异步 helper。
- 测试与文档：新增 helper 单测，更新 README、ROADMAP、OpenSpec、AGENTS / CLAUDE 和 CHANGELOG。
