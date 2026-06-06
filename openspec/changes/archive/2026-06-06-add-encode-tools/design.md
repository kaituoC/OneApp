## Context

OneApp 已有成熟的工具标签架构：纯 JS `*Helper.js`（可单元测试）+ Vue 组件 + 在 `App.vue`/`Header.vue`/`StatusBar.vue` 三处注册标签。本次新增「编码」标签，把 6 个高频编码工具收进一个标签内，沿用既有架构，不引入新的工程模式。唯一新增运行时依赖是 `js-md5`（Web Crypto 不提供 MD5）。

## Goals / Non-Goals

**Goals:**
- 6 个子工具（Base64 / URL / JWT 解码 / Hash / 进制 / Unicode）离线可用、零数据外传
- 复用现有 Helper + 单测 + 标签注册模式，纯 JS 逻辑全部可单元测试
- 一致的交互：编解码类「左源右果 + ⇄ 方向」、实时计算、统一复制与错误提示

**Non-Goals:**
- 不做 JWT 签名验证（仅解码展示）
- 不做 Base64 URL-safe 变体开关、不做 `encodeURI`（只 `encodeURIComponent`）
- 不做 Base64 文件/图片 Data URL
- 进制转换不支持负数与小数

## Decisions

### 决策 1：标签内布局 = 左侧菜单 + 右侧工作区
6 个子工具用左侧垂直菜单切换，右侧渲染当前子工具。
- **为何**：子工具数量多且各自需要较大文本区（JWT/Hash），左菜单让每个工具独占全高，导航清晰；与 DevToys 心智一致。
- **替代**：水平标签条（6 个中文名过密）、滚动大卡片（拥挤，工具越多越差）——均放弃。

### 决策 2：编解码交互采用「左源右果 + ⇄ 方向」单向模型
左框为源、右框为结果，一个 ⇄ 按钮切换编码/解码方向，输入实时计算。
- **为何**：心智最简单，与现有正则/Diff 单向模型一致；避免双向实时「谁是源」的歧义。
- **适用**：Base64、URL、Unicode。JWT（单输入多段输出）、Hash（单输入多行输出）、进制（四框联动）是天然例外，各自形态。

### 决策 3：Base64 经 TextEncoder/TextDecoder 处理 UTF-8
`btoa`/`atob` 只支持 Latin-1，中文/emoji 会抛异常。编码走 `TextEncoder → Uint8Array → btoa`，解码走 `atob → Uint8Array → TextDecoder`。
- **为何**：正确支持中文/emoji 是基本盘，否则 `base64Encode("你好")` 直接崩。

### 决策 4：Hash 一次性列出四种算法
输入一次，同时输出 MD5 / SHA-1 / SHA-256 / SHA-512（hex 小写）。
- MD5 由 `js-md5` 同步计算；SHA-* 由 `crypto.subtle.digest()` 异步计算。
- 统一封装为 `hashAll(text) → Promise<{ md5, sha1, sha256, sha512 }>`，MD5 用 `Promise.resolve` 并入，UI 统一 await。
- **为何**：开发者常需对比不同算法；一次性展示省去切换。

### 决策 5：进制转换基于 BigInt
`BigInt(numStr).toString(radix)` 支持任意大整数（如 64 位 hash），规避 JS Number `2^53` 安全整数失真。四框（Dec/Hex/Oct/Bin）任一改动即重算其余三框。
- **为何**：进制工具常用于大整数；`parseInt` + `Number.toString` 会失真。
- **约束**：仅非负整数；非法字符就地红字。

### 决策 6：Unicode 转义格式三选一
下拉切换 `\u`（BMP，JS/JSON）、`\u{}`（ES6，支持增补平面 emoji）、`&#x;`（HTML 实体）。码点用 `codePointAt` / `String.fromCodePoint` 处理，正确支持 emoji 代理对。
- **为何**：三种格式各有场景，下拉比硬选一种更通用；代理对处理避免 emoji 被拆成半字符。

### 决策 7：工具模块结构
`encodeHelper.js` 导出纯函数，每个返回 `{ success, result/error }`（与 jsonHelper/regexHelper 一致）：
`base64Encode/Decode`、`urlEncode/Decode`、`decodeJWT`、`hashAll`、`convertBase`、`unicodeEscape/Unescape`。输入输出多为短文本，**用普通 textarea，不套 EditorWithLineNumbers**（避免过度设计）。

## Risks / Trade-offs

- **`js-md5` 新增依赖** → 选用体积小（~3KB gzip）、维护活跃、零传递依赖的包；仅 MD5 用它，SHA 走原生。
- **`crypto.subtle` 需安全上下文** → Electron 渲染进程满足（`file://`/localhost 视为安全上下文），无风险。
- **BigInt 不支持小数/负数** → 明确为 Non-Goal，输入非法时红字提示而非静默出错。
- **JWT 不验签可能被误解为「已验证」** → Signature 段标注「未验证」，避免误导。
- **标签数 6→7，Header 文字变密** → 7 个中文短名（编辑/JSON/对比/时间/正则/编码/设置）在常规窗宽下可容纳；沿用既有标签栏样式。
