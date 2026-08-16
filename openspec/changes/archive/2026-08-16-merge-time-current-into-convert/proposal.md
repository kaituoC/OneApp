# merge-time-current-into-convert · 提案

## Why

「当前时间」是 Time 四个子工具中信息量最小的（仅 2 张卡：当前时间 + 当前时间戳），却独占一个导航入口；它在语义上是「时间转换」的零输入特例（输入 = now）——转换页的两个「当前」按钮填入的正是实时卡显示的同一份数据，两侧功能高度重叠。

高频诉求「现在的时间戳，复制走」目前停留在时间转换页时需要 3 步（当前 → 转换 → 复制），或切到「当前时间」入口 2 步；合并后打开时间转换页第一眼即是实时卡，1 步复制。

宽屏（≥1270px）双列 dashboard 中实时卡本就与两个转换区块连续排布在左列，视觉上已是整体，拆分只影响窄屏切换。行业标杆 epochconverter.com 亦采用「顶部实时时间戳 + 下方双向转换器」形态。

## What Changes

- `SUB_TOOLS.time` 由 4 项减为 3 项：移除「当前时间」入口，保留时间转换、Cron、多时区
- 实时卡（当前时间 + 时间戳、秒/毫秒切换、复制）常驻「时间转换」页顶部，实时跳动与复制能力不变
- TimeTab 的 `activeSection` 归并：live-section 随 `convert` 呈现；默认子工具由 `SUB_TOOLS[0]` 派生为 `convert`
- `tool-surface-refresh` spec「Time 使用子工具导航」requirement 同步为三个子任务

## Impact

- 代码：`src/renderer/utils/navigation.js`、`src/renderer/components/TimeTab.vue`、`tests/navigation.test.js`（如有子工具断言）
- spec：`tool-surface-refresh`（MODIFIED「Time 使用子工具导航」）
- 文档：README.md / CLAUDE.md / AGENTS.md 时间工具描述
- 兼容性：子工具选择为会话级记忆、不持久化，无迁移成本；Cron 与多时区不受影响
