## 背景

OneApp 是一个 Electron + Vue 3 desktop developer workbench。Renderer 当前通过 `Header` 横向 tab bar、`App.vue` 中的 `activeTab` 状态、各页面 scoped style 和 `src/renderer/styles/main.css` 的全局 theme token 组织界面。应用已经扩展到 8 个一级工具：Editor、JSON、Diff、Time、Regex、Encode、Agent Workshop 和 Settings。

现有 UI 仍然更像一组紧凑工具集合。Agent Workshop 已经是更复杂的 workflow，包含 repo 选择、本地 agent 检测、成本提示、阶段进度、timeline 输出和导出能力。这让产品层级变得不均衡：Agent Workshop 足够重要，应该成为核心 AI 入口，但当前 shell 仍把它放在拥挤的文字 tab 行里。

本次刷新应当是完整的 UI 与 information architecture 更新，而不是功能重写。目标是提升层级、质感和一致性，同时保留 Renderer/main process 边界和现有 helper 行为。

## 目标 / 非目标

**目标：**
- 用分组左侧导航和顶部 context bar 替换顶部 tab bar 心智模型。
- 将 Agent Workshop 作为独立 AI 分组中的醒目入口。
- 引入图标库，并在导航、工具命令、状态提示和紧凑控件中一致使用。
- 在 dark/light theme 下建立专业冷静、略带科技感的视觉 system。
- 刷新所有一级页面，让应用整体像同一个产品。
- 保留现有 data flow、IPC contract、工具 helper 和工具语义。
- 保持键盘访问可预测，包括数字直达和循环切换。
- 修复探索阶段发现的可见一致性问题。

**非目标：**
- 不重写 JSON、Diff、Regex、Time、Encode、Markdown、HTML 或 Agent Workshop 逻辑。
- 不改变 Electron main process orchestration、preload API 形状或 Agent Workshop subprocess 行为。
- 不引入 command palette、drag-and-drop layout、可持久化的 resizable panel、plugin system、Agent Workshop streaming output 或新工具能力。
- 不做 marketing landing page、装饰性全屏 hero、重 animation system，或会降低日常效率的一次性视觉特效。

## 技术决策

### 1. 使用左侧导航 workbench shell

App shell 将主导航从顶部横向 tab bar 迁移到按意图分组的左侧导航：
- 工作区：编辑器
- 数据处理：JSON、Encode、Time
- 文本调试：Diff、Regex
- AI：Agent Workshop
- 系统：Settings

主内容区继续通过现有 `activeTab` 状态挂载一个当前工具。顶部 context bar 显示当前工具标题、当前文件或 repo 等辅助上下文，以及必要时的 tool-level command。

备选方案：保留顶部 tab bar，仅做 visual polish。风险更低，但无法解决导航拥挤，也无法把 Agent Workshop 提升为核心 AI 入口。

### 2. 保留现有 tab 标识和快捷键语义

内部 tab key 继续使用 `editor`、`json`、`diff`、`time`、`regex`、`encode`、`agent`、`settings`。数字切换继续支持 Ctrl/Cmd+1 到 Ctrl/Cmd+8，顺序不变；Ctrl/Cmd+Tab 继续覆盖全部入口。

备选方案：按新的分组重排快捷键。这样分组更规整，但会造成不必要的肌肉记忆变化和文档风险。

### 3. 引入 `lucide-vue-next` 图标库

本次刷新新增 `lucide-vue-next`，在 Vue 组件中直接导入 icon。icon 用于辅助识别，默认不替代主导航文字标签。紧凑 button 可以使用 icon，但需要保留 accessible label、title 或相邻文字。

备选方案：手写 SVG 或继续纯文字控件。手写 SVG 会增加维护噪音；纯文字控件会让新 shell 不够现代，也降低可扫描性。

### 4. 在 CSS 中建立小型共享 visual system

本次扩展 `main.css` token 和共享 class，覆盖：
- 背景与浮起表面
- 边框与分隔线
- focus ring
- accent、success、warning、error、muted 语义状态
- button、icon button、segmented control、chip、panel、command bar、form row、empty state 和 status strip

各组件仍可用 scoped style 处理 layout，但应消费共享 token 和 style pattern，避免继续形成互不相关的视觉语言。

备选方案：引入完整 component library。对当前应用来说过重，会增加 migration risk，收益不够明确。

### 5. 按表面模式刷新工具页，而不是重写行为

每个一级页面映射到少量 UI surface pattern：
- Editor：导航 panel + 编辑/预览 panel + 紧凑 view toggle。
- 双栏工具：JSON、Diff 输入态、Regex 编辑/预览、Encode encode/decode 工具。
- Form/dashboard 工具：Time 和 Settings。
- Workflow/timeline：Agent Workshop。

实现时只在表达新 layout 所需的范围内移动 markup。`jsonHelper`、`diffHelper`、`regexHelper`、`timeHelper`、`encodeHelper`、`useEditorFile` 等现有 helper 继续作为行为来源。

备选方案：先把每个 tab 拆成新的可复用 Vue component 再做样式。长期可能更干净，但会扩大范围和 regression risk。本次刷新只在明显减少重复时提取小型共享 pattern。

### 6. 将 Agent Workshop 视为主要 AI workflow

Agent Workshop 保留两栏产品模型，但强化层级：
- 专属 AI 导航入口
- repo 与 agent ready state card
- 更清晰的阶段进度
- ready、logged out、running、succeeded、failed、canceled、unsupported 等状态标签
- 更克制的 Markdown timeline，明确作者和阶段
- 清晰区分 idle、running、succeeded、failed、canceled、resume view 和 unsupported 状态

本次刷新不得改变 orchestration、调用、record persistence 或 read-only safety 行为。

备选方案：将 Agent Workshop 拆成 wizard。归档设计已经选择了适合重复使用的单页 UI，这个判断仍然成立。

### 7. 桌面优先，但保持韧性

OneApp 是桌面 Electron 应用，因此可以优先保证高密度工作表面。仍需保证最小宽度行为：导航文字不应遮挡内容，toolbar 文字不应溢出 button，panel 在较窄窗口下仍应可读。

备选方案：mobile-first responsive layout。对桌面产品没有必要，而且会降低有效信息密度。

## 风险 / 取舍

- 导航变化可能影响用户肌肉记忆 -> 保留 tab key、快捷键顺序、标签文本和循环切换，同时让新 shell 足够清晰。
- 全局 CSS 变化可能影响全部工具 -> 先引入 token 和共享类，再逐页适配。
- Agent Workshop 状态较多 -> 保持现有 computed state model，只改呈现；验证 unsupported、idle、running、succeeded、failed 和 canceled 状态。
- icon 依赖会改变 package metadata -> 只新增一个聚焦依赖，并使用直接导入保持 bundle 可理解。
- 完整视觉刷新容易滑向无边界 refactor -> 明确排除行为重写、IPC 变更、新功能和复杂 animation。
- dark/light theme 可能漂移 -> 为两种模式定义成对 token，并检查代表性页面。

## 迁移计划

1. 新增图标依赖，并确认安装、测试和构建仍正常。
2. 引入扩展 theme token 和共享 workbench UI class，不改变行为。
3. 将顶部 tab bar 替换为分组 workbench shell，同时保留 `activeTab` key 和键盘切换。
4. 更新 status bar 和 Settings 快捷键文案，使其匹配 8 个入口。
5. 将各一级页面适配到新的共享视觉模式。
6. 对 Agent Workshop 做 AI workflow 展示强化，同时不触碰 orchestration 逻辑。
7. 运行 unit tests、production build，并在 dark/light theme 下做视觉 smoke test。

Rollback 方式直接：回退 shell、component 和 style 改动，并移除 icon 依赖。无需存储数据迁移。

## 待确认问题

- 无。设计基于用户已确认的方向：明显焕新、专业冷静且略带科技感、Agent Workshop 作为核心 AI 入口、允许引入 icon 依赖、完整 UI 刷新但控制实现边界。
