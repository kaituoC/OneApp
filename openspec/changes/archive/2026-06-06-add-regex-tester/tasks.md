## 1. 纯逻辑层 regexHelper

- [x] 1.1 新建 `src/renderer/utils/regexHelper.js`：`runRegex(pattern, flags, text)` 编译正则并执行匹配，返回 `{ success, matches/error }`
- [x] 1.2 匹配结果结构携带每处匹配的 `index/end/match` 与各捕获组 `{ value, index, end, name? }`，含 `count` 与是否截断标记
- [x] 1.3 处理边界：空 pattern 视为无匹配、非法 pattern 返回 error、global 零宽匹配推进 lastIndex 防死循环
- [x] 1.4 对命中数设渲染上限常量，超量时截断并在结果中标记
- [x] 1.5 新建 `tests/regexHelper.test.js`：覆盖普通匹配、捕获组、命名组、非法 pattern、空 pattern、零宽匹配、global 多命中、截断

## 2. Web Worker 匹配执行

- [x] 2.1 新建 `src/renderer/workers/regex.worker.js`：接收 `{ pattern, flags, text }`，import `regexHelper.runRegex`，postMessage 回传结果
- [x] 2.2 在 RegexTab 中以 `new Worker(new URL('../workers/regex.worker.js', import.meta.url), { type: 'module' })` 创建 Worker，封装「发起匹配 + 超时(约1.5s)定时器 + 收到结果清除定时器」（抽为 `composables/useRegexMatcher.js`）
- [x] 2.3 超时未返回则 `worker.terminate()`、提示「正则过于复杂，已中止」、重建待命 Worker；组件卸载时 terminate 释放
- [x] 2.4 `npm run build` 验证 Worker 正确打包为独立 chunk（`regex.worker-*.js`）并能 import regexHelper

## 3. RegexTab 组件与交互

- [x] 3.1 新建 `src/renderer/components/RegexTab.vue`，顶部结构化 pattern 行：`/ [pattern] / [g][i][m][s][u][y]`，flags 为可点击方块
- [x] 3.2 pattern 非法时在 pattern 行下方红字就地报错
- [x] 3.3 测试文本左右双区：左用 `EditorWithLineNumbers` 编辑，右只读高亮预览区按位置切分文本并 `<mark>` 染色
- [x] 3.4 多捕获组多颜色：整体匹配与各捕获组使用可区分配色
- [x] 3.5 实时匹配：pattern/flags/text 变化经 debounce(~250ms) 触发 Worker 匹配并刷新视图
- [x] 3.6 底部匹配结果列表：序号、位置区间、匹配值、各捕获组值、匹配总数；含「复制全部」
- [x] 3.7 结果列表 ↔ 预览高亮双向 hover 联动
- [x] 3.8 测试文本字符计数与长度上限提示（接近/超限变样式）
- [x] 3.9 海量匹配渲染保护：超上限仅渲染前 N 条并提示

## 4. 速查抽屉

- [x] 4.1 右侧可收起速查抽屉（展开不遮挡主区域），📖 入口切换
- [x] 4.2 「常用模式」节：邮箱/URL/IP/手机号等，点击填入 pattern 并触发匹配
- [x] 4.3 「语法元字符」节：`\d \w \s [] () | ^ $` 等，点击插入 pattern 光标处
- [x] 4.4 「flags 说明」节：g/i/m/s/u/y 逐项说明

## 5. 标签导航接入

- [x] 5.1 `Header.vue` 的 `tabs` 数组新增 `{ key: 'regex', label: '正则' }`（时间与设置之间）
- [x] 5.2 `App.vue` 注册 `RegexTab`（`v-show="activeTab === 'regex'"`），并入 tabs 顺序数组
- [x] 5.3 快捷键：Ctrl+5 直达 regex（设置顺延 Ctrl+6），Ctrl+Tab 循环范围覆盖 6 个标签
- [x] 5.4 `StatusBar.vue` 的 `tabNames` 新增 `regex: '正则'`

## 6. 自测、文档与版本

- [x] 6.1 `npm test` 全部通过（含 regexHelper 12 用例；1 失败为 timeHelper 时区 flaky，与本次无关）
- [x] 6.2 `npm run build` 编译通过（沙箱外执行）
- [x] 6.3 `npm run dev` 手动核对：实时匹配/高亮/捕获组配色/结果列表/hover 联动/速查抽屉/灾难性回溯不冻结/超时提示与恢复
- [x] 6.4 更新 README、CHANGELOG、CLAUDE.md（新增正则工具与 RegexTab/regexHelper/worker 架构小节，标签数 5→6、Ctrl+1-6）
- [x] 6.5 升级 `package.json` 版本号 1.5.1 → 1.6.0（新功能 → 中间版本 Y）并同步 CHANGELOG
