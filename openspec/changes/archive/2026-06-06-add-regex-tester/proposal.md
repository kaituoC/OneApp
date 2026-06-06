## Why

开发者日常高频需要测试正则表达式——验证 pattern、查看匹配范围与捕获组。当前需切到浏览器或外部网站（如 regex101），离线、隐私、上下文切换都不理想。OneApp 已具备「纯前端离线工具集」的定位与一致的 `*Tab + *Helper` 架构，正则测试器是 ROADMAP P1 的首项，落地成本低、契合度高。

## What Changes

- 新增「正则」工具标签（位列时间工具与设置之间，使标签总数达 6 项：编辑器/JSON/对比/时间/正则/设置），Ctrl+5 直达，设置顺延为 Ctrl+6
- 结构化 pattern 输入：`/ [pattern] / [g][i][m][s][u][y]`，flags 为可点击方块
- 实时匹配（debounce ~250ms），正则非法时就地红字提示错误
- 测试文本「编辑区 / 高亮预览区」左右分栏，匹配片段染色，多个捕获组用不同颜色
- 底部匹配结果列表：逐条显示匹配序号、位置区间、整体匹配值、各捕获组值；结果列表 ↔ 预览高亮双向 hover 联动
- 右侧可收起「速查」抽屉，三节：常用模式（点击填入 pattern）、语法元字符（点击插入光标处）、flags 说明
- **正则匹配在 Web Worker 中执行**，主线程设超时（1~2s）兜底，超时即 `terminate()` 并提示「正则过于复杂，已中止」，彻底杜绝灾难性回溯（catastrophic backtracking）冻结 UI
- 测试文本区显示字符计数与长度上限提示

## Capabilities

### New Capabilities
- `regex-testing`: 正则表达式测试工具的全部行为——pattern/flags 输入、实时匹配与高亮、捕获组展示、匹配结果列表、速查抽屉、Worker 超时防护
- `regex-tab-navigation`: 「正则」标签的注册与导航（tab 列表、Ctrl+6 快捷键、Ctrl+Tab 循环纳入、状态栏标签名）

### Modified Capabilities
<!-- 无既有能力的需求变更；tab 导航作为新能力单列，不修改 unified-editor 等现有 spec -->

## Impact

- **新增组件**：`src/renderer/components/RegexTab.vue`、右侧速查抽屉（可内联于 RegexTab 或抽成子组件）
- **新增纯逻辑**：`src/renderer/utils/regexHelper.js`（编译正则 + 执行匹配的纯函数，返回 `{ success, matches/error }`，可单元测试）
- **新增 Worker**：`src/renderer/workers/regex.worker.js`，引用 `regexHelper` 跑匹配
- **修改**：`Header.vue`（tabs 加「正则」）、`App.vue`（注册 RegexTab + Ctrl+6 + Ctrl+Tab 循环范围）、`StatusBar.vue`（tabNames 加 regex）
- **复用**：`EditorWithLineNumbers.vue` 作为测试文本编辑区
- **测试**：新增 `tests/regexHelper.test.js`
- **依赖**：无新增第三方依赖（原生 `RegExp` + Web Worker）
- **构建**：需确认 electron-vite 对 `new Worker(new URL(...), { type: 'module' })` 的打包正确
