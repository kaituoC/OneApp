## Why

时间工具已经覆盖时间戳互转和 Cron 解释，但跨时区查看当前时间仍需要外部工具。多时区对照表可以帮助用户快速确认常用城市的当前时间与日期差异。

## What Changes

- 在时间工具中新增多时区对照表。
- 预置常用城市/时区，可添加或移除城市。
- 实时显示当前时间、日期和今天/明天/昨天差异。
- 不做会议时间换算、办公时间重叠分析或远端时区服务。

## Capabilities

### New Capabilities

- `timezone-comparison-table`: 时间工具中的多时区当前时间对照能力。

### Modified Capabilities

- `workbench-shell`: 时间工具摘要体现多时区能力。

## Impact

- `timeHelper.js` 新增时区格式化、日期差异和列表构建纯函数。
- `TimeTab.vue` 新增多时区对照 UI。
- 更新测试、README、ROADMAP、OpenSpec、AGENTS / CLAUDE 和 CHANGELOG。
