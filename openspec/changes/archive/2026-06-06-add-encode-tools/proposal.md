## Why

开发者日常高频需要 Base64 / URL 编解码、JWT 解码、Hash 计算、进制转换、Unicode 转义等小工具，目前散落在各类在线网站，离线不可用且有隐私顾虑。OneApp 已具备工具标签的成熟架构（纯 JS Helper + 单元测试 + 标签注册），适合把这些高频编码工具收进一个标签，离线可用、零数据外传。

## What Changes

- 新增「编码」工具标签（位列「正则」与「设置」之间，Ctrl+6 直达，设置顺延为 Ctrl+7），工具标签总数 6 → 7
- 标签内采用**左侧菜单 + 右侧工作区**布局，6 个子工具独立切换：
  - **Base64**：文本 ⇄ Base64，支持 UTF-8（中文/emoji 经 TextEncoder 处理）
  - **URL**：文本 ⇄ URL 编码（`encodeURIComponent` / `decodeURIComponent`）
  - **JWT**：仅解码——拆分 Header / Payload / Signature 三段并格式化展示，`exp` / `iat` / `nbf` 时间戳字段顺带转人类可读时间（不做签名验证）
  - **Hash**：一次性列出 MD5 / SHA-1 / SHA-256 / SHA-512 四种摘要（hex 小写）
  - **进制**：Dec / Hex / Oct / Bin 四框联动，基于 BigInt，仅非负整数
  - **Unicode**：文本 ⇄ 转义，格式下拉三选一（`\u` / `\u{}` / HTML 实体）
- 编解码类工具采用「左源右果 + ⇄ 方向切换」单向交互模型，输入实时计算
- 各工具统一「复制结果」与「就地红字错误提示」
- 新增依赖 `js-md5`（MD5 计算，Web Crypto 不支持 MD5）

## Capabilities

### New Capabilities
- `encode-tools`: 编码工具合集的功能行为——Base64 / URL / JWT 解码 / Hash / 进制 / Unicode 六个子工具的输入输出规则、错误处理与交互模型
- `encode-tab-navigation`: 「编码」标签在主标签栏的注册、数字快捷键（Ctrl+6）、循环切换与状态栏标签名

### Modified Capabilities
<!-- 无现有 spec 的需求发生变更（仅新增标签，正则等既有行为不变） -->

## Impact

- **新增组件**：`src/renderer/components/EncodeTab.vue`（左菜单 + 子工具工作区）
- **新增工具模块**：`src/renderer/utils/encodeHelper.js`（纯 JS，可单测）
- **新增测试**：`tests/encodeHelper.test.js`
- **修改**：`App.vue`（注册标签、Ctrl+1~7 范围）、`Header.vue`（标签项）、`StatusBar.vue`（标签名）、`SettingsTab.vue`（快捷键说明 1~7）
- **新增依赖**：`js-md5`
- **文档**：README / CHANGELOG / CLAUDE.md / ROADMAP 同步
