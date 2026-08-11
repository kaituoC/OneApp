## Why

对 OneApp v1.22.4 的全页面实机审查显示，当前视觉风格已经稳定，但 macOS 循环切换快捷键说明与系统行为冲突，窄窗口下多层滚动和换行 command bar 会挤压核心工作区，不同工具页的布局、状态反馈与可访问语义也缺少统一规则。现在需要在保持既有功能与整体风格的前提下完成一次工作台交互收敛，让 1200×800 默认窗口和 800×600 最小窗口都保持清晰、高效、可键盘操作。

## What Changes

- 修正 macOS 工具循环切换：应用与设置页统一使用 `Ctrl+Tab` / `Ctrl+Shift+Tab`，保留 `Cmd+1…9/0` 数字直达。
- 统一 workbench 的响应式策略：窄宽度下自动收起一级导航、压缩次要 context，并允许用户手动覆盖导航状态。
- 建立双栏转换器、配置 + 结果、任务流三类页面模板，统一 command bar、panel、empty state、状态反馈和主要滚动容器的所有权。
- 优化 Editor、Data Tools、Diff、Text Processing、Encode、Generator、Time、Regex、Agent Workshop 与 Settings 的操作层级、窄窗口降级、空态和内容密度。
- 将 Time 拆分为当前时间、时间转换、Cron、时区四个可切换子工具，并让默认 Cron 表达式进入页面后直接显示解释结果。
- 将 Agent Workshop 前端组织为“准备 → 运行 → 结果”三阶段，保持主要操作可见并去除重复动作；不改变 orchestration、runner、IPC、只读约束、事件订阅或记录持久化。
- 补齐导航、segmented control、toggle、menu、Regex flags 等控件的键盘与辅助技术语义，提高小号次要文字的主题对比度，并统一深浅主题滚动条。
- 让 Regex 只渲染与当前文本快照对应的 Worker 结果，避免输入变化期间短暂使用旧匹配位置；同时改善结果区在长文本和大量匹配场景下的空间调节能力。
- 收敛页面内状态条与全局 status bar 的职责：全局区域承载短反馈，面板内部保留与当前结果直接相关的错误、警告和状态 chip。

## Capabilities

### New Capabilities

- `accessible-workbench-interactions`: 定义工作台导航、菜单、切换控件、状态表达、颜色对比度和键盘操作的跨页面可访问交互要求。

### Modified Capabilities

- `workbench-shell`: 修正 macOS 循环切换快捷键，并细化窄宽度自动收起导航、手动覆盖和滚动所有权要求。
- `tool-surface-refresh`: 将审查结论落实为统一页面模板、command bar 收敛、各工具布局优化、状态反馈和 800×600 响应式验收要求。
- `regex-testing`: 要求匹配结果绑定输入快照，并补充 flags 状态语义与结果区空间调节行为。
- `cron-expression-helper`: 默认 Cron 表达式在工具进入可用状态后自动解释，同时保留显式重新解释和错误处理。

## Impact

- 主要影响 `src/renderer/App.vue`、`src/renderer/components/` 下各一级工具组件、`src/renderer/styles/main.css`、Regex composable/worker 结果协议及相关纯函数或状态逻辑。
- 需要新增或调整组件测试、helper/worker 单测，以及覆盖深色/浅色主题、14px/18px、1200×800/800×600、键盘导航和关键工具流程的 UI smoke test。
- 不新增运行时依赖，不改变 preload API、main process IPC、文件格式、用户数据结构或 Agent Workshop 后端行为。
- 预计属于中等规模的兼容性 UI/交互改进，版本影响预估为 minor。
