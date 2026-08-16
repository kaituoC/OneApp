# merge-time-current-into-convert · 设计

## Context

- TimeTab 当前 4 个子工具（当前时间 / 时间转换 / Cron / 多时区）由 context-bar 动态段 chips 驱动，窄屏单列切换、宽屏（≥1270px）双列 grid 并排。
- 宽屏 grid 中实时卡（live-section）已与两个转换 panel 连续排布在左列 row1-3，视觉上是一个整体；拆分只影响窄屏。
- 「当前时间」是「时间转换」的零输入特例：转换页「当前」按钮（useCurrentTimestamp / useCurrentDateTime）填入的正是实时卡的同一 now。

## Goals

- 子工具 4 → 3，context-bar 动态段 chips 减少，延续导航收敛方向。
- 高频路径（拿当前时间戳并复制）从切 tab / 3 步缩短为打开时间转换页即见即复制。
- 保留快查属性：实时卡常驻页顶部，零操作成本。

## Non-Goals

- 不改动 Cron、多时区子工具的任何行为。
- 不改动 `timeHelper.js` 纯函数与既有转换逻辑。
- 不改变宽屏双列 grid 的整体布局策略。

## Decisions

- **实时卡随 convert 呈现**：live-section 的 `v-show` 条件从 `activeSection === 'current'` 归并为 `'convert'`，保持独立 panel 与既有 DOM 结构，宽屏 grid 位置不变（左列 row1）。
- **默认子工具自动派生**：`DEFAULT_SUB_TOOL` 由 `SUB_TOOLS[tabKey][0].key` 计算，移除 current 后 time 默认值自动变为 `convert`，无需显式改动。
- **无迁移成本**：`activeSubToolByTab` 为会话级 ref、不持久化，不存在旧会话残留 `'current'` 的问题；props 默认值同步改为 `'convert'`。
- **滚动锚点**：宽屏下切换子工具的 scrollIntoView 锚点仍指向各 section 首个 panel，live-section 保留独立 id。

## Risks / Trade-offs

- 实时卡每秒刷新与输入框共处一页：多时区表格已在用同一 `liveTime` 每秒刷新且无焦点干扰，风险低。
- 用户习惯变化：失去「当前时间」独立入口——以导航简化与高频路径缩短补偿。

## Migration

无持久化数据迁移；spec 变更通过 OpenSpec delta 合并至 `tool-surface-refresh`。
