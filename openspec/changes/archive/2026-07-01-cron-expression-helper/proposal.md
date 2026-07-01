## Why

时间工具已经覆盖当前时间、时间戳互转和日期格式输出，但开发者常见的 Cron 表达式阅读与验证仍需要切到外部工具。将 Cron 解释器并入时间工具，可以补齐定时任务排查场景。

本需求聚焦标准 5 位 Cron，保持离线、轻量和本地时区语义，避免引入 Quartz / 秒字段等复杂方言。

## What Changes

- 在时间工具中新增 Cron 表达式解释区域。
- 支持标准 5 位 Cron：`分钟 小时 日 月 星期`。
- 展示人类可读解释和基于本地时区计算的未来 5 次执行时间。
- 非法字段、范围越界、步进无效或无法计算时展示明确错误。
- 不支持秒字段、Quartz 年份字段、时区选择或远端校验。

## Capabilities

### New Capabilities

- `cron-expression-helper`: 时间工具中的 Cron 表达式解释、校验和未来执行时间预览能力。

### Modified Capabilities

- `workbench-shell`: 时间工具能力摘要需要体现 Cron 增强。

## Impact

- 渲染层：`TimeTab.vue` 新增 Cron 输入、解释和未来 5 次列表。
- 工具函数：`timeHelper.js` 增加 Cron 解析、描述和未来时间计算纯函数。
- 测试：新增 Cron helper 单测，覆盖合法表达式、步进、越界、字段数量错误和无法计算边界。
- 文档：更新 README、ROADMAP、OpenSpec、AGENTS / CLAUDE 和 CHANGELOG。
