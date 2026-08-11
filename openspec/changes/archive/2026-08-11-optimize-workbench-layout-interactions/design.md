## Context

OneApp 当前以 `App.vue` 承载 workbench shell，以 `Header.vue` 管理左侧导航，各一级工具通过 `v-show` 保留页面状态。全局 `main.css` 已有 theme token 和一组 `.tool-*` primitive，但页面仍分别实现 command bar、双栏/长表单布局、状态条和滚动区域。实机审查覆盖 v1.22.4 的全部十个一级页面、深浅主题、14px/18px 字号、1200×800 默认窗口和 800×600 最小窗口，确认主要问题来自布局职责与交互语义不一致，而不是需要重新设计品牌视觉。

当前关键约束如下：

- macOS 系统会接管 `Cmd+Tab`，因此应用无法可靠使用它循环切换工具；现有代码同时接受 `Ctrl` 和 `Cmd`，设置页又展示 `Cmd`，造成可见说明与真实可用行为不一致。
- `Header.vue` 在组件内部独立维护导航收起状态，`App.vue` 无法根据工作区宽度协调自动收起与用户覆盖。
- 多数工具页拥有自己的固定高度、滚动和状态实现；Agent Workshop 与长表单页面容易形成两到三个纵向滚动容器。
- Agent Workshop 的 UI 可以重排，但 main process orchestration、runner、IPC、只读边界、事件订阅和记录格式不可改变。
- Regex 已用 generation 丢弃乱序 Worker 响应，但输入更新到新一轮结果返回之间，视图仍可能把旧位置应用到新文本。

## Goals / Non-Goals

**Goals:**

- 在 1200×800 与 800×600 下建立稳定、可预测的 shell 和工具页布局。
- 统一三类页面模板、command bar 操作层级、主要滚动容器和状态反馈职责。
- 让可选择、可切换和菜单类控件具备匹配其行为的 HTML/ARIA 语义与键盘操作。
- 修正 macOS 循环切换快捷键、Cron 初始空结果和 Regex 结果快照不一致。
- 保留各工具现有数据处理结果、页面状态保持方式和 Agent Workshop 后端行为。

**Non-Goals:**

- 不进行品牌重绘，不更换图标库，不引入第三方 UI framework。
- 不新增工具能力，不重写 JSON、CSV、SQL、XML、Diff、Time、Encode、Generator 等 helper 算法。
- 不改变 preload API、main process IPC、electron-store schema 或 Agent Workshop 记录格式。
- 不在本次变更中声明完整 WCAG 合规，也不引入遥测或远程服务。

## Decisions

### 1. 在现有 token 与 primitive 上建立三类页面模板

保留当前组件边界和 `v-show` 状态模型，扩展实际被模板使用的 `.tool-*` primitive，并按页面工作流归入三类结构：

- 双栏转换器：Data Tools、Diff、Text Processing、Encode、Regex；宽屏并排，紧凑宽度上下堆叠或切换单面板。
- 配置 + 结果：Generator；配置区按内容决定高度/宽度，结果区获得剩余空间。
- 任务流：Agent Workshop；根据状态只突出“准备、运行、结果”中的当前阶段。

Time 使用页内子工具导航，Settings 使用紧凑分区；它们共享 panel、segmented control、状态与间距 primitive，但不强行套入双栏模板。选择扩展现有 CSS/少量共享 Vue 控件，而不是引入 UI framework，可减少视觉漂移和依赖风险。

### 2. 将导航收起状态提升到 shell 层

由 `App.vue`（或专用 composable）监听工作区宽度，并把受控的 `collapsed` 状态传给 `Header.vue`。状态由两部分组成：

- 自动值：可用宽度不大于 900px 时默认 compact，大于阈值时默认展开。
- 会话内用户覆盖：用户点击收起/展开后覆盖自动值，直到应用重新启动；不写入 electron-store，避免配置迁移。

这样既能在最小窗口保护主工作区，也保留用户主动展开的能力。相比仅用 CSS 隐藏文案，受控状态可以同步 tooltip、按钮标签和导航宽度。

### 3. 快捷键定义与展示使用同一份平台策略

数字直达继续接受 Windows/Linux 的 `Ctrl+数字` 和 macOS 的 `Cmd+数字`。循环切换在所有平台统一为 `Ctrl+Tab` / `Ctrl+Shift+Tab`，不再拦截 `Meta+Tab`。设置页与 context hint 从 `navigation.js` 的同一份元数据生成文案，测试分别覆盖数字直达、正向和反向循环，避免实现与帮助文本再次分叉。

### 4. 每页明确一个主要纵向滚动容器

Shell 继续固定 context bar 与全局 status bar，`content-area` 不直接滚动。每个激活工具必须指定唯一的主要纵向滚动容器：普通表单由页面根容器滚动，固定工作区由结果/editor/timeline 区作为主要滚动区域。代码、表格或超长结果仍可局部滚动，但配置栏、页面根和结果区不得同时争夺同一方向的滚动。

Agent Workshop 在宽屏让 timeline 成为主要滚动区，准备配置本身不再独立滚动；在紧凑宽度切为单列后，由页面根承接纵向滚动，timeline 使用自然高度。深浅主题统一 scrollbar token。

### 5. 窄宽度 command bar 使用“主操作 + 更多”

每个模式只保留一个高频主操作常驻；复制、清空等与结果关联的操作进入 panel header，低频转换/校验操作进入共享的 accessible overflow menu。菜单使用真实 button/menu 语义，支持 Enter/Space 打开、方向键移动、Escape 关闭和焦点回归。宽屏可继续直接显示适量次级操作，紧凑宽度不依靠多行换行维持功能。

### 6. 页面级优化保持现有功能语义

- Editor 将“列表/编辑/预览”明确呈现为可并存的面板显示开关；新建菜单改为可键盘操作的真实菜单。
- Data Tools 按当前格式区分主操作和次级操作，输出复制/清空归属输出 panel，移除重复空状态。
- Diff 强化 disabled 与空结果状态，但保持显式对比和可逆编辑流程。
- Text Processing 的统计模式使用紧凑指标卡，其他模式继续使用输入/输出结构。
- Encode 把当前方向与切换动作分离为带文字的方向控制，并补充可执行空态。
- Generator 配置区使用内容驱动尺寸，空结果说明下一步操作。
- Time 使用“当前/转换/Cron/时区”四个子工具；切换只改变呈现，不清空各子工具输入。
- Agent Workshop 根据现有状态派生阶段，主操作固定在当前阶段可见区域，同一动作只保留一个主要入口。
- Settings 压缩界面设置，将最近文件改为稳定行列表，快捷键与关于信息使用二级分区。

### 7. 状态反馈按作用域分层

全局 `StatusBar` 负责当前一级工具和短时操作反馈；panel 内只保留直接影响当前结果的 error、warning、running 或 ready chip。空输入不同时显示页面内“等待输入”和全局同义文案。复制结果继续使用短时 toast，不将持久状态写入全局 store。

### 8. Regex 结果绑定完整输入签名

每次请求记录由 `pattern + flags + text + generation` 构成的输入签名。Worker 结果只有在 generation 与当前请求一致时写入；渲染层还必须确认结果签名与当前视图输入相同，否则展示当前原文但不应用旧高亮和旧结果列表。这样覆盖 debounce 等待期，而不仅是 Worker 返回乱序。

结果区采用有最小/最大尺寸约束的可调分隔；桌面指针可拖动，分隔控件提供键盘调整和 reset，紧凑布局回退为自然高度的上下结构。

### 9. 验证以行为矩阵而不是截图像素为主

单测覆盖快捷键策略、导航自动/手动状态、Regex 输入签名和 Cron 自动解释；组件/DOM 测试覆盖菜单键盘行为与 ARIA 状态。UI smoke test 覆盖十个一级页面、深浅主题、14px/18px、1200×800/800×600、导航折叠、关键空态和 Agent Workshop 历史/准备态。截图用于发现溢出、重复滚动和对比度问题，不建立脆弱的像素级快照。

## Risks / Trade-offs

- [页面范围较大，容易产生样式回归] → 按 shell/primitives、通用模板、页面细化分批实现，每批运行相关测试并做双主题双尺寸 smoke test。
- [900px 固定阈值可能不适合所有字号] → 以可用工作区而非屏幕宽度判断，并在 14px/18px 下验证；必要时仅调整 token/媒体查询，不改变状态模型。
- [菜单收纳可能降低低频功能可发现性] → 宽屏保留常用次级操作，更多菜单使用明确标签且不改变功能分组。
- [单一滚动所有权可能让超长结果增加页面高度] → 编辑器、表格和 timeline 仍允许必要的局部滚动，但通过 min-height 与 overflow 规则避免同向嵌套滚动。
- [Agent Workshop 视觉重排可能意外影响运行状态] → 只基于现有状态和事件派生视图，禁止修改主进程文件、IPC payload 和记录 schema，并补充回归测试。
- [ARIA 改造与现有点击行为不一致] → 优先使用原生 `button`、radio/tab/menu 模式，避免只添加角色而不实现对应键盘模型。

## Migration Plan

1. 先修正共享导航状态、快捷键元数据、theme token 和 layout primitive。
2. 落地通用 command overflow、selection semantics 与滚动策略。
3. 按双栏转换器、配置 + 结果、Time/Settings、Agent Workshop 顺序迁移页面。
4. 最后修复 Regex 快照一致性与 Cron 自动解释，并完成全量回归。
5. 本变更无数据迁移；如出现不可接受回归，可按页面回退模板使用，现有 helper、IPC 和持久化数据不受影响。

## Open Questions

- 900px 作为自动收起阈值是基于当前 800×600/1200×800 审查结果的初始值，实施时允许根据 18px 字号 smoke test 在不改变行为定义的前提下微调。
