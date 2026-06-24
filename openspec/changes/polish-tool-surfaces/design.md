## Context

当前 OneApp 已完成 workbench shell：左侧分组 navigation、顶部 context bar、底部 status bar、light/dark theme token 与 lucide icon 已经落地。实际运行截图显示，外壳已经稳定，但各工具页内部仍存在明显差异：JSON/Diff/Regex 偏 panel 化，Encode/Time/Agent Workshop/Settings 仍各自维护局部样式；窄宽度或 DevTools 占用空间时，部分多栏页面依赖横向滚动或固定宽度，体验不够一致。

本次变更聚焦 renderer 层 UI/UX polish，不改变工具核心语义，也不调整主进程能力。改造应尊重现有 Composition API 结构和工具函数边界，避免把视觉重构扩大到业务逻辑重写。

## Goals / Non-Goals

**Goals:**

- 建立可复用的 tool surface primitives，统一 panel、toolbar、segmented control、icon button、status chip、empty state 和 copy feedback。
- 让 Editor、JSON、Diff、Regex、Encode、Time、Agent Workshop、Settings 在 light/dark theme 下具有一致的视觉层级和交互反馈。
- 修复或缓解多栏布局在横向空间不足时的可用性问题，尤其是 Editor、Encode、Diff、Regex 和 Agent Workshop。
- 将 emoji/text-only 控件替换为 lucide icon + accessible label/title，提升专业感和可扫描性。
- 保留现有快捷键、文件读写、导出、JSON/Regex/Encode/Time 算法结果和 Agent Workshop workflow 行为。

**Non-Goals:**

- 不重新设计 workbench shell 的信息架构，不新增一级工具。
- 不引入新的 UI framework 或运行时依赖。
- 不改 Agent Workshop 的 orchestration、runner、IPC、records、只读沙箱或 CLI 调用策略。
- 不新增 Time timezone/UTC 等新业务能力；如需新增，放到后续单独需求。
- 不修改 release workflow 或打包配置。

## Decisions

### 1. 以共享 CSS primitives 为主，按需提取小组件

优先在 `main.css` 中扩展真正被使用的共享类，例如 `.tool-surface`、`.tool-panel`、`.tool-panel-header`、`.tool-status-chip`、`.tool-empty-state`、`.tool-icon-button`、`.tool-segmented`。如果某个结构需要插槽或逻辑复用，再提取 Vue 小组件；避免为了美化引入过多抽象。

备选方案是每个页面继续 scoped CSS 微调。这个方案短期快，但会延续视觉漂移，也容易再次出现未使用 dead CSS。

### 2. 建立宽度分档，而不是页面各自猜测断点

所有多栏工具遵循三档策略：

- wide：主工作区横向空间充足，保留双栏或多栏。
- medium：优先收起次级导航、drawer 或 preview，不压缩主输入/结果区到不可读。
- compact：切换为上下 stack、顶部 segmented 子导航或单 panel 切换。

具体断点仍由 CSS media query 实现，但语义需要统一。Editor、Encode、Agent Workshop 可以拥有页面特化行为，但不能违背“主工作区优先可读”的原则。

### 3. Editor polish 保守处理状态，不扩大文件工作流

Editor 只改 surface 和布局策略：文件树工具栏、文件/目录图标、preview 空态、三栏降级与可读宽度。打开文件、保存、导出、滚动同步和 mode 推断沿用现有 `useEditorFile` 与 preview 组件逻辑。

可调宽 file tree 如果实现成本低，可作为本次内容；若实现风险高，至少确保在 medium/compact 宽度下 file tree 不会变成不可读竖条，并保留显式收起入口。

### 4. Encode 作为重点 polish 页面

Encode 当前包含 Base64、URL、JWT、Hash、进制、Unicode 六个子工具，视觉上仍偏旧表单。改造策略是保留现有计算逻辑，重做子工具导航、输入输出 panel、结果卡片和 copy feedback。JWT 和 Hash 结果应更像结构化 output，而不是普通代码块堆叠。

### 5. Agent Workshop 只做信息结构与状态表达

Agent Workshop 的底层 workflow 风险高，本次只整理 UI：setup/ready、running progress、finished record/timeline、unsupported/failure state 的视觉层级和操作入口。历史记录恢复时需要更明确地提示“这是上次记录/已完成状态”，避免用户误以为正在运行当前任务。

## Risks / Trade-offs

- [Risk] 多页面同时 polish 容易扩大 diff、引入视觉回归 → Mitigation：先落共享 primitives，再逐页迁移；保持每页功能逻辑最小改动。
- [Risk] scoped CSS 与全局 primitives 优先级冲突 → Mitigation：共享类只定义基础 pattern，页面 scoped 样式只负责布局差异；最终用 light/dark 截图烟测验证。
- [Risk] 响应式改造可能改变用户熟悉的布局位置 → Mitigation：wide 宽度尽量保持现有空间模型，medium/compact 只在空间不足时降级。
- [Risk] Agent Workshop 页面改动误触运行逻辑 → Mitigation：不改 `electron/agentWorkshop/`、`agentWorkshopHelper.js` 的业务规则和 IPC 参数，只调整渲染层结构与样式。
- [Risk] 图标替换影响可访问性 → Mitigation：所有 icon-only control 必须保留 `title`、`aria-label` 或相邻文字。
