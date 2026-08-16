## Why

左侧上下文工具导航是固定宽度全高侧栏（184px），但 6 个一级分组中 4 个仅含单一工具，该侧栏绝大多数时间只承载一个高亮条目与大片空白，空间性价比极低；同时摘要文字（如 "MD / HTML / 文本"）在窄列中反复截断，加宽又会挤压操作区。context-bar 横条（40px 高、全宽）目前只承载静态的工具名、描述与快捷键徽章，是唯一可以零成本复用的空间。将工具导航整合进 context-bar，可以一次性消除侧栏浪费、归还操作区 184px 宽度，并让导航层级收敛为"顶部分组行 + 工具行"两行结构。

## What Changes

- **BREAKING** 移除左侧 `contextual-nav` 整列（含分组工具计数 header 与垂直 ToolMenu 渲染），workbench 主区宽度净增 184px
- context-bar 从静态标题条改造为横向工具导航条：固定段渲染当前分组的全部一级工具 chips（图标 + 名称），分隔符后的动态段渲染当前激活工具的子工具 chips（仅名称）
- 移除 chips 内常驻的摘要文字与 `Cmd+x` 快捷键徽章；chip 的 title tooltip 保留工具名称、说明与快捷键完整信息
- 移除 context-bar 右侧的上下文描述区与快捷键徽章（当前文件路径已由 status bar 展示）
- 交互 chips 区域显式设置 `-webkit-app-region: no-drag`，避免与 context-bar 窗口拖拽区冲突
- 键盘可达性复用现有 segmented control 模式（`role="radiogroup"` + `handleSegmentedKeydown`），支持方向键 / Home / End
- 窄窗口下导航条允许横向滚动，与顶部一级导航的窄宽度策略一致
- 工具切换、子工具会话级记忆、数字直达与 Ctrl+Tab 循环等交互逻辑层保持不变

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `contextual-tool-navigation`: 「左侧上下文工具导航」requirement 整体改写为「context-bar 横向工具导航」：二级工具入口从左侧恒定侧栏迁移至 context-bar，固定段承载一级工具、动态段承载激活工具的子工具；单工具分组直达内容的意图保留并强化（不再渲染空白侧栏）
- `workbench-shell`: 「Context shell surface」requirement 更新——context bar 从"只承载工具名称、上下文描述与快捷键提示"改为承载横向工具导航 chips（描述与快捷键信息移入 tooltip）；「紧凑的窄宽度导航」requirement 更新——"左侧上下文 navigation 保持紧凑宽度并恒定渲染"改为"context-bar 工具导航横向滚动收缩，优先保护主内容区"

## Impact

- `src/renderer/App.vue`：移除 `contextual-nav` 侧栏结构与相关样式、断点规则；context-bar 模板重构为横向导航；导航交互接线上现有 `handleNavSelect` / `activeSubTool`
- `src/renderer/components/ToolMenu.vue`：垂直导航组件退役（唯一调用方为 App.vue），由 context-bar 内的横向 chips 结构取代
- `src/renderer/utils/segmentedControl.js`：复用（不修改）
- `src/renderer/utils/navigation.js`：数据层不变，tooltip 构造函数复用
- 项目文档：`AGENTS.md`、`CLAUDE.md`、`README.md` 中关于"左侧两级工具导航"的架构描述需同步
- 不受影响：各 Tab 组件内部布局、Agent Workshop 编排与 IPC、快捷键与最近工具记忆逻辑、status bar
