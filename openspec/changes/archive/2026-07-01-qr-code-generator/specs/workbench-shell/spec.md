## MODIFIED Requirements

### Requirement: 分组 workbench navigation
应用 SHALL 通过分组左侧 workbench navigation 呈现一级工具，而不是使用拥挤的横向文字 tab bar。

#### Scenario: 导航分组可见
- **WHEN** 应用启动
- **THEN** 主导航显示工作区编辑、数据处理、文本调试、生成工具、AI 和系统设置分组

#### Scenario: Agent Workshop 是 AI 入口
- **WHEN** 用户查看主导航
- **THEN** Agent Workshop 作为 AI 分组下的醒目入口显示，而不是普通未分组工具标签

#### Scenario: 生成器是生成工具入口
- **WHEN** 用户查看主导航
- **THEN** Generator 作为生成工具分组下的入口显示，并在说明中体现 UUID、密码、Lorem 和二维码能力

#### Scenario: 选择导航入口
- **WHEN** 用户选择任意主导航入口
- **THEN** 主内容区切换到对应工具，并保留该工具现有 state model
