## ADDED Requirements

### Requirement: 多时区对照表
时间工具 SHALL provide a multi-timezone comparison table that displays current date, time, and local date relation for selected common time zones.

#### Scenario: 预置时区显示
- **WHEN** 用户打开时间工具
- **THEN** 系统展示常用城市/时区的当前时间对照

#### Scenario: 添加时区
- **WHEN** 用户从预置列表添加一个未显示的城市
- **THEN** 系统将该城市加入对照表

#### Scenario: 移除时区
- **WHEN** 用户移除一个已显示城市
- **THEN** 系统从对照表中移除该城市

#### Scenario: 日期差异
- **WHEN** 目标时区日期相对本地日期为昨天、今天或明天
- **THEN** 系统展示对应日期差异标签

#### Scenario: 不影响既有时间工具
- **WHEN** 用户使用时间戳互转或 Cron 表达式解释
- **THEN** 多时区对照表不会改变这些既有功能的行为
