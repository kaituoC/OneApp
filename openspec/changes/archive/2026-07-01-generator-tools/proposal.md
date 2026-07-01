## Why

OneApp 现有工具已覆盖编辑、转换、对比和 AI 研讨，但缺少日常开发中高频使用的离线生成类能力。新增生成器合集可以补齐 UUID、随机密码和 Lorem 占位文本等低风险高频场景，并为后续二维码生成保留自然入口。

## What Changes

- 新增“生成工具”分组与“生成器”一级入口。
- 新增 UUID v4 单个 / 批量生成能力。
- 新增随机密码生成能力，支持长度、大小写、数字、符号和排除易混字符。
- 新增 Lorem 占位文本生成能力，支持按词、句、段生成。
- 生成结果支持复制，所有生成逻辑在渲染进程本地离线完成。
- 扩展 workbench 数字快捷键：保留现有 Ctrl/Cmd+1~9，并使用 Ctrl/Cmd+0 访问第 10 个一级入口。
- 不包含 UUID v7、密码强度评分、密码短语、生成历史和二维码。

## Capabilities

### New Capabilities

- `generator-tools`: 生成器合集的入口、子工具、生成规则、结果输出和复制反馈。

### Modified Capabilities

- `workbench-shell`: 新增生成工具分组和生成器入口，并扩展第 10 个一级入口的快捷键语义。
- `tool-surface-refresh`: 生成器页面需要遵循共享 tool surface、响应式布局、状态反馈和复制反馈规则。

## Impact

- 影响渲染进程导航、根组件、状态栏和设置页快捷键说明。
- 新增生成器组件与纯函数 helper，并增加对应单元测试。
- 需要同步 README、ROADMAP、OpenSpec 主规格和 CHANGELOG；作为新功能，版本预估升 minor。
