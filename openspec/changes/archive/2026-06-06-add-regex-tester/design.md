## Context

OneApp 是纯前端离线开发工具集，每个工具为一个 `*Tab.vue`，纯逻辑下沉到 `src/renderer/utils/*Helper.js`（返回 `{ success, result/error }`，可单元测试），tab 通过 `Header.vue` 的 `tabs` 数组 + `App.vue` 的 `v-show` + Ctrl 快捷键注册。现有 5 个 tab（编辑器/JSON/对比/时间/设置），正则测试器为第 6 个。

正则测试器的核心技术难点不是 UI，而是**灾难性回溯（catastrophic backtracking）**：JS 正则在主线程同步执行且无法从外部中断，形如 `(a+)+$` 配几十字符的文本即可让 CPU 跑数十秒，冻结整个渲染进程。实时匹配（每次输入触发）会放大该风险。探索阶段已确认必须从架构上根治，而非靠输入长度限制（长度对回溯几乎无效）。

## Goals / Non-Goals

**Goals:**
- 提供 regex101 级别的核心体验：结构化 pattern/flags 输入、实时匹配高亮、捕获组可视、匹配结果列表、速查
- **UI 永不被正则引擎冻结**：任何 pattern × 文本组合下主线程都保持响应
- 纯前端离线、零新增第三方依赖、纯逻辑可单元测试
- 与现有 `*Tab + *Helper` 架构、`EditorWithLineNumbers` 复用保持一致

**Non-Goals:**
- 不做正则的可视化解释图（railroad diagram）/ AI 解释
- 不做替换（replace）功能（留作后续增量）
- 不做匹配历史持久化、不接 electron-store
- 不支持非 JS 正则方言（PCRE/Python 等）——仅原生 `RegExp`

## Decisions

### D1. 高亮方式：编辑/预览分离（B 方案），不做就地 overlay
左编辑（`EditorWithLineNumbers`）/ 右只读高亮预览（`<div>` 渲染 `<mark>`）。与 `EditorTab`、`JsonTab` 的双区布局同构，心智一致、实现可控。
- **备选**：透明 textarea + 底层高亮 div 的 overlay 就地高亮（regex101 式）。否决：两层像素级对齐（字体/行高/padding/滚动）出名地难维护，收益不抵成本。

### D2. 匹配执行放在 Web Worker，主线程超时 terminate 兜底
```
主线程 (RegexTab)                    regex.worker.js
─────────────────                   ────────────────
pattern+flags+text ──postMessage──►  调用 regexHelper 跑匹配
   │ 启动 1500ms 超时定时器              │ 产出 matches[]
   │ ◄────────── postMessage ────────  │
   │ 清除定时器 → 渲染高亮
   └ 超时未回 → worker.terminate()
              → 提示「正则过于复杂，已中止」
              → 立即 new 一个新 Worker 待命
```
匹配在 Worker、**渲染始终在主线程**。Worker 仅回传「位置数组」，主线程据此切分文本上色。
- **备选 1**：主线程直接跑 + `Promise.race` 超时。否决：race 无法中断已在执行的同步正则，超时形同虚设。
- **备选 2**：仅 debounce + 输入长度上限。否决：debounce 只降触发频率不防单次回溯；长度限制要限到几十字符才挡得住回溯，工具将不可用。
- debounce（~250ms）与字符计数提示仍保留，但定位为「减少无谓计算 + 良好 UX」，**不作为安全措施**。

### D3. 纯逻辑抽到 regexHelper.js，被 Worker 引用 + 独立测试
`regexHelper.js` 暴露纯函数（如 `runRegex(pattern, flags, text) → { success, matches/error }`）。Worker 内 import 它跑匹配；单元测试直接 import 它验证，无需起 Worker。匹配结果结构需携带每个匹配的位置与各捕获组的值/位置，供高亮上色与 hover 联动。
- 数据契约（草案）：`matches: [{ index, end, match, groups: [{ value, index, end, name? }] }]`，外加 `count`、是否 global、是否截断标记。

### D4. tab 导航作为独立能力（regex-tab-navigation）
tab 注册涉及 `Header.vue`/`App.vue`/`StatusBar.vue` 三处协同改动与快捷键扩展（Ctrl+1-5 → Ctrl+1-6、Ctrl+Tab 循环纳入），与「正则功能本身」关注点不同，单列为一个能力 spec，便于将来新增工具时复用同一套导航契约。

### D5. 速查为右侧可收起抽屉，不复用 SyntaxHelpModal 弹窗
抽屉不遮挡主区域，「点击填入 pattern / 插入语法到光标」后能立刻看到匹配效果，节奏连贯。三节内容：常用模式（邮箱/URL/IP/手机号…，点击填入 pattern 输入框）、语法元字符（`\d \w \s [] () | ^ $` …，点击插入到光标处）、flags 说明（g/i/m/s/u/y 逐项）。
- **备选**：复用现有 `SyntaxHelpModal` 弹窗。否决：弹窗遮挡，填入后须关窗才能看效果，打断「边查边试」节奏。

### D6. 多捕获组多颜色 + 结果列表↔预览双向 hover 联动
高亮预览中整体匹配与各捕获组用区分色；hover 底部结果列表某条 → 预览对应匹配加深/描边，反之亦然。提升「这处高亮对应哪个匹配/哪些组」的可读性，成本低。

## Risks / Trade-offs

- **[Worker 一次性，terminate 后即销毁]** → 采用「超时杀掉后立即重建一个待命 Worker」策略，保证下次匹配有可用实例；组件卸载时也要 terminate 释放。
- **[海量匹配撑爆 DOM]**（如 `.` 配大文本 + global）属于渲染瓶颈而非正则瓶颈，Worker 不解决 → 对预览高亮与结果列表设最大渲染条数（超出则截断并提示「仅显示前 N 条」），并对测试文本设字符上限（带计数提示）。
- **[electron-vite 的 Worker 打包]** → 用 `new Worker(new URL('../workers/regex.worker.js', import.meta.url), { type: 'module' })`，dev 与 build 均需验证 Worker 能正确加载并 import `regexHelper`；若打包异常，回退为 Worker 内内联匹配逻辑（仍保留 helper 供测试）。
- **[Worker 序列化开销]** → 大文本每次 postMessage 传输有成本，debounce + 仅在 pattern/text/flags 实际变化时触发可缓解；正常使用无感。
- **[空 pattern / 空匹配 `//` / 全局零宽匹配死循环]** → helper 内对零宽匹配推进 lastIndex，空 pattern 视为无匹配并清空高亮，避免死循环。
