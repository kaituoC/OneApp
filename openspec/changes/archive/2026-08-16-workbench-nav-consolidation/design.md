# workbench-nav-consolidation 设计

## Context

OneApp 当前壳层为三层导航：Header 分组 → 左侧 contextual-nav（仅多工具分组渲染）→ 页面内 segmented / 横向子工具栏。截图验证确认由此产生宽度跳变、形态不一致、信息密度低等问题。本次改动只涉及渲染层 UI 结构与导航数据，不触及主进程、preload、helper 纯函数与 Agent Workshop 后端逻辑。

## Goals / Non-Goals

**Goals:**

- 全局统一为两层导航：Header 分组 + 左侧 nav（含工具与子工具两级）。
- 左侧 nav 恒定渲染，分组切换无宽度跳变。
- context bar 收紧到 40px，去除与设置页重复的 meta chips。
- 数据工具高频主操作平铺，JSONPath 按需展开。
- 时间工具宽屏双列、窄屏单列，消除大面积空白。

**Non-Goals:**

- 不改工具核心算法与 IPC。
- 不改 Agent Workshop orchestration / runner / 持久化。
- 不做移动端响应式。
- 不新增可折叠/compact 左侧 nav 模式（沿用现有窄宽度媒体查询收窄宽度即可）。

## Decisions

### D1：子工具状态提升到 App.vue，prop 驱动各工具页

`navigation.js` 新增 `SUB_TOOLS` 常量：`{ json: [...], text: [...], encode: [...], generator: [...], time: [...] }`，每项含 `key`、`label`。App.vue 持有 `activeSubToolByTab` 会话级状态（不持久化，与 `recentTabByGroup` 的持久化范围区分），通过 `:sub-tool` prop 传给 JsonTab / TextTab / EncodeTab / GeneratorTab / TimeTab。各组件内部原有子工具 ref 改为「prop 优先 + 内部镜像」：`watch(prop)` 同步内部 ref，保留 v-show 下组件状态不丢失的现状。

备选：组件 emit 事件回 App 双向同步。放弃原因：子工具切换只由左侧 nav 触发（页面内导航已移除），单向数据流更简单。

### D2：ToolMenu 支持两级条目

`ToolMenu.vue` 的 items 增加可选 `children`。渲染上工具项为一级条目，子工具缩进为二级条目；点击子工具同时激活对应一级工具。`@select` 事件负载扩展为 `{ key, subKey? }`。无子工具的分组（工作区/AI/系统）渲染单条一级条目 + 分组说明，保证 nav 恒定存在。

### D3：context bar 收紧

高度 56px → 40px；移除「深色/浅色」「14px」两个 meta chips（设置页已有即时生效的同名设置）；保留快捷键 chip 与工具名/上下文描述。`@media (max-width: 820px)` 下继续隐藏 meta。

### D4：数据工具主操作平铺 + JSONPath 按需展开

JSON 模式 command bar：格式化（primary）、压缩、校验、反转义、转 YAML 平铺为一排主操作，移除「更多」菜单；输出操作（复制/清空）保持在输出 panel 上下文。JSONPath 查询条默认折叠为一个「JSONPath 查询」切换按钮，展开后显示表达式输入与查询动作；展开状态为组件内会话级 state，不持久化。YAML/CSV/SQL/XML 子工具主操作同样平铺，不再嵌套 segmented。

### D5：Time 宽屏双列 dashboard

TimeTab 接收 `subTool` prop。宽屏（内容区 ≥1100px，用 CSS `@media (min-width: 1100px)`）下四个任务区（当前时间 / 时间转换 / Cron / 多时区）以 2×2 grid 同时呈现，点击左侧 nav 子项滚动定位到对应区域；窄屏维持一次只显示一个子工具（`v-show` 由 prop 驱动）。所有区域始终挂载，输入状态在页面生命周期内保留。

备选：保持纯切换式、仅收紧单页留白。放弃原因：无法解决「当前时间」单区域内容过少导致的大面积空白，且宽屏并排对照时间工具各能力更符合 dashboard 定位（与 spec「Time dashboard 突出实时值」一致）。

### D6：样式复用

全部改动复用 `main.css` 全局 token 与既有 `.tool-panel` / `.tool-segmented` primitives；页面内不再新增独立子导航样式。不再被引用的 scoped 样式随组件一并清理（遵守「无死 CSS primitives」约束）。

## Risks / Trade-offs

- [左侧 nav 恒定占宽约 168px，单工具分组内容区收窄] → 已有 `@media (max-width: 760px)` 收窄至 148px；1200px 默认窗口下内容区仍 ≥1000px，可接受。
- [子工具 prop 化可能与组件内部既有初始化逻辑竞争] → 各组件保留内部 ref 作为单一渲染来源，prop 仅作为外部驱动源经 watch 写入；单测与手动烟测覆盖每个子工具切换。
- [Time 宽屏四区同屏在 800×600 小窗口可能拥挤] → 双列仅在 ≥1100px 内容宽度启用，小窗口自动回退单列切换模式，符合 spec「紧凑高度首屏可操作」。
- [「更多」菜单移除后极窄宽度 command bar 溢出] → command bar 允许横向滚动兜底，主操作顺序稳定；窄宽度降级策略沿用 tool-surface-refresh 既有约束。

## Migration Plan

纯渲染层改动，无数据迁移。回滚策略：revert 对应 commit 即可恢复三层导航形态。
