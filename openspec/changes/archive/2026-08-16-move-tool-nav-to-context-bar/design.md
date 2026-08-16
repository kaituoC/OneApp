## Context

当前 workbench 采用"顶部一级分组导航（Header）+ 左侧两级工具导航（contextual-nav 侧栏）"结构。侧栏为固定 184px 全高列，由 `App.vue` 渲染 `contextual-nav`（分组名 + 工具计数 header 与垂直 `ToolMenu`）；`ToolMenu` 渲染一级工具条目（图标、名称、摘要、快捷键徽章）与缩进的子工具条目。context-bar 是 40px 高的全宽横条，仅静态展示当前工具图标、名称、上下文描述与快捷键 chip，并作为 macOS 窗口拖拽区（`-webkit-app-region: drag`）。

项目已有成熟的横向 segmented control 基础：`segmentedControl.js` 提供 radiogroup 键盘导航（方向键跳过禁用项、Home / End），`tool-segmented` 样式类在 TimeTab / SettingsTab / DiffTab 中复用。工具切换逻辑（`handleNavSelect`、`activeSubTool` 会话级记忆、Cmd+数字直达、Ctrl+Tab 循环）已与 UI 解耦。

6 个一级分组中 4 个仅含单一工具，侧栏长期大面积空白；摘要文字在窄列中反复截断，此前"加宽侧栏"的尝试挤压操作区，已被否决。

## Goals / Non-Goals

**Goals:**

- 移除左侧 `contextual-nav` 整列，主内容区宽度净增 184px
- context-bar 承载当前分组的工具导航：固定段 = 一级工具 chips，动态段 = 激活工具的子工具 chips
- chips 仅显示图标与名称；摘要与快捷键信息保留在 title tooltip 中
- 键盘可达（radiogroup + 方向键 / Home / End），与现有 segmented control 行为一致
- 窄窗口横向滚动兜底，优先保护主内容区
- 工具切换、子工具记忆、快捷键逻辑零改动

**Non-Goals:**

- 不改各 Tab 组件内部布局与交互
- 不动 Agent Workshop 编排、IPC 与记录语义
- 不新增侧栏折叠 / 抽屉等新交互模式
- 不改 `navigation.js` 数据结构（NAV_GROUPS / SUB_TOOLS 保持不变）
- 不调整 status bar 行为

## Decisions

### D1: 导航整合进 context-bar，而非加宽 / 收窄 / 可折叠侧栏

- 备选：a) 加宽侧栏让摘要单行显示（被否决：挤压操作区、加剧空白浪费）；b) 可折叠侧栏（改动大，子工具入口在折叠态需要额外方案）；c) 合并文件树与侧栏（结构性改动更大，其他工具页难兼容）。
- 选择 context-bar 整合：唯一"已占用空间但只放静态信息"的区域，纯空间复用，垂直零新增、宽度净收益 184px。
- 层级结构不变（分组 → 工具 → 子工具三级），仅后两级从左侧竖排平移为顶部横排，交互逻辑层完全复用。

### D2: 固定段 + 动态段单行布局，而非全平铺或两行

- 全平铺（3 工具 + 15 子工具同现）最坏 ~1200px，不可行；两行布局垂直成本翻倍。
- 选择单行两段：左侧固定段渲染分组内全部一级工具（常驻可切换），竖线分隔符后动态段仅渲染激活工具的子工具（切换工具时整体替换）。最坏（编码工具 6 子工具）约 650px，主流窗口可平铺。
- 与现有交互模型一一对应：固定段 = 一级切换，动态段 = 子工具二级选择（复用 `activeSubTool` 记忆）。

### D3: 新建 `ContextNav.vue` 组件，退役 `ToolMenu.vue`

- context-bar 的 chips 渲染、active 态与键盘导航内聚为新组件，保持 App.vue 精简；`ToolMenu.vue` 唯一调用方为 App.vue，随侧栏移除一并删除，避免留僵尸组件。
- Props：`tools`（当前分组工具列表）、`active`（activeTab）、`activeSub`（activeSubTool）；emit `select` 负载与原 `handleNavSelect` 完全一致（`{ key, subKey? }`）。

### D4: 键盘可达性采用两个独立 radiogroup

- 固定段与动态段各自 `role="radiogroup"` 并复用 `handleSegmentedKeydown`：段内方向键 / Home / End 导航，段间用 Tab 切换。工具与子工具语义本就是两组，避免单一 group 中 role 混淆。
- chip 使用 `aria-checked`（或工具组复用 `aria-current`）标示当前项，title 提供完整名称、说明与快捷键。

### D5: chips 去摘要、去快捷键徽章，信息下沉 tooltip

- chip 名称本身足以区分工具；摘要（"JSONPath / SQL" 等）与 `Cmd+x` 徽章常驻价值低且是此前截断问题的根源。
- chip 的 `title` 使用现有 `getNavigationTooltip(item)`（名称 + 说明 + 快捷键），悬停即得完整信息；当前文件路径由 status bar 展示，context-bar 右侧描述区移除。

### D6: 拖拽区与点击共存

- context-bar 整条保留 `-webkit-app-region: drag`（macOS 双击最大化等行为不变），chips 容器与 chip 本身显式 `no-drag`，防止点击被解释为窗口拖拽。

## Risks / Trade-offs

- [窄窗口或 DevTools 占宽时 chips 溢出] → 导航条 `overflow-x: auto` 横向滚动，与 Header 一级导航同策略；tooltip 保证可理解性
- [移除常驻摘要 / 徽章降低快捷键可发现性] → tooltip 保留完整信息；Cmd+数字直达行为不变，熟用户无感
- [单工具分组横条左侧只有单个 chip，右侧空旷] → 可接受：横条高度不变、无侧栏空白列，信息密度与现状持平
- [context-bar 由静态变交互，误触风险] → chip 命中区域与 Header 分组入口规格一致（图标 + 文字），间隔与 padding 沿用 `tool-segmented` 间距
- [ToolMenu 删除后样式 / 断点残留] → 同步清理 App.vue 中 `contextual-nav` 全部样式与 760px 断点侧栏规则
- [快捷键切换工具时，若焦点位于动态段子工具 chip，动态段重建可能导致焦点回落到 body] → 已知限制：后续需重新 Tab 定位；发生窗口窄且仅在键盘焦点恰好落在子工具 chip 时触发，暂不自动恢复焦点

## Migration Plan

- 纯前端 UI 结构变更，无数据迁移；electron-store 配置不受影响。
- 实施顺序：新增 `ContextNav.vue` → App.vue 接线并移除侧栏 → 清理样式与断点 → 删除 `ToolMenu.vue`。
- 回滚策略：revert 对应 commit 即可恢复左侧导航结构。

## Open Questions

（无——方案已在探索阶段与用户逐点收敛：位置、层级、去摘要、去徽章均已确认。）
