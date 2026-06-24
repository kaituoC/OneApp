## 1. Dependency 与 navigation model

- [x] 1.1 添加 `lucide-vue-next` 项目依赖并刷新 lockfile。
- [x] 1.2 为 8 个工具定义单一 tab/navigation metadata source，包含 key、label、shortcut index、分组和 icon。
- [x] 1.3 保留现有内部 tab key 和 Ctrl/Cmd+1 到 Ctrl/Cmd+8 的切换顺序。
- [x] 1.4 保留 Ctrl/Cmd+Tab 以及反向循环切换，覆盖全部 8 个工具。

## 2. Workbench shell

- [x] 2.1 将顶部横向 tab bar 替换为分组左侧 workbench navigation。
- [x] 2.2 新增 AI 导航分组，并将 Agent Workshop 作为醒目入口呈现。
- [x] 2.3 新增顶部 context bar，用于显示当前工具名称和可用上下文详情。
- [x] 2.4 更新全局 status bar，使每个一级工具（包括 Agent Workshop）都有有效 label。
- [x] 2.5 更新 Settings 快捷键文案，说明数字导航覆盖 1 到 8。

## 3. Shared visual system

- [x] 3.1 扩展 dark/light theme token，覆盖分层 surface、border、text、focus、accent、success、warning 和 error 状态。
- [x] 3.2 添加共享 CSS pattern，覆盖 command bar、panel、section header、button、icon button、segmented control、chip、form row、empty state 和 status strip。
- [x] 3.3 更新全局 button、input、textarea、select 和 focus 样式，使其符合专业冷静的工作台方向。
- [x] 3.4 确保 icon-only 或紧凑控件提供 accessible label、title 或相邻文字，保证可理解性。

## 4. Tool surface refresh

- [x] 4.1 刷新 Editor surface，使用紧凑 panel toggle、更清晰的 file tree/editor/preview 层级，并保持编辑、保存、导出行为不变。
- [x] 4.2 刷新 JSON 工具，使用共享 command bar、更清晰的 input/output panel 和一致的 success/error feedback。
- [x] 4.3 刷新 Diff 工具，使输入态、split result、unified result 和 diff stats 在视觉上清晰区分。
- [x] 4.4 刷新 Regex 工具，优化 pattern bar、flags、match preview、result list 和 quick reference drawer surface。
- [x] 4.5 刷新 Encode 工具，同时保持所有子工具可发现并可切换。
- [x] 4.6 将 Time 工具刷新为结构化 dashboard/form layout，突出实时值并保持紧凑转换分组。
- [x] 4.7 将 Settings 工具刷新为使用 shared visual system 的结构化设置布局。

## 5. Agent Workshop 展示

- [x] 5.1 刷新 Agent Workshop setup state，使 repo 选择、agent ready state、moderator agent 选择、调用次数估算、成本提示和 idea input 更清晰。
- [x] 5.2 刷新 running state 展示，包含 stage block、agent status chip、禁用后的配置控件和清晰当前状态信息。
- [x] 5.3 刷新 discussion timeline，使用更克制的 Markdown message card、更清晰的 author/stage label 和 copy action。
- [x] 5.4 刷新 succeeded、failed、canceled、resume view 和 unsupported 状态，同时保留现有 export、restart 和 record view 行为。
- [x] 5.5 确认未修改 Agent Workshop main process orchestration、IPC、persistence 或 read-only safety 行为。

## 6. Regression 与 visual verification

- [x] 6.1 运行现有 unit test suite。
- [x] 6.2 运行 production build。
- [x] 6.3 烟测 8 个工具的数字快捷键切换和循环导航。
- [x] 6.4 烟测代表性工具操作：Editor panel toggle、JSON 格式化/错误、Diff 对比、Regex 匹配、Encode 转换、Time 转换以及 Settings theme/font size 控制。
- [x] 6.5 烟测本地可触达的 Agent Workshop visible state，包括 unsupported 或 idle 状态以及可用的 resume record 状态。
- [x] 6.6 检查 dark/light theme 的可读对比度、文本不重叠、panel 尺寸稳定以及整体视觉一致性。

## 7. Responsive layout 与空间分配修正

- [x] 7.1 为左侧 workbench navigation 增加展开/收起能力，并保证 compact 模式下 icon、active state、tooltip 和快捷键信息可用。
- [x] 7.2 优化 navigation 工具说明：可见短文案保持可读，完整说明通过 title、tooltip 或 context bar 提供，避免硬截断成不可理解文本。
- [x] 7.3 优化 context bar 窄宽度表现：优先保留当前工具名称和关键 context，低优先级 meta chip 可隐藏或收缩。
- [x] 7.4 调整 Editor 初始状态：空白新文档首次进入时默认不展示 Preview，避免 file tree、editor、preview 三栏同时挤压。
- [x] 7.5 保护 Editor file tree 最小可读宽度；横向空间不足时应由用户主动收起 file tree，而不是自动压成窄竖条。
- [x] 7.6 为 JSON 和 Diff 双栏布局增加 responsive fallback，使窄宽度下可上下 stack 或使用清晰的单 panel 切换。
- [x] 7.7 为 Regex quick reference、Encode 子工具 navigation 和 Agent Workshop 配置栏补充窄宽度 fallback，避免固定侧栏抢占主工作区。
- [x] 7.8 使用本地启动页面复测带 DevTools 或窄窗口场景，确认主要页面没有明显横向挤压、文字重叠或不可读竖条。
