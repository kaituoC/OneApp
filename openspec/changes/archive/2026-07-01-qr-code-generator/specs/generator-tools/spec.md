## MODIFIED Requirements

### Requirement: 生成器工具集合
OneApp SHALL provide a Generator tool group with UUID v4, random password, Lorem placeholder text, and QR code generation sub-tools.

#### Scenario: 生成器入口可见
- **WHEN** 用户查看主导航
- **THEN** 系统显示「生成器」一级工具入口，并位于生成工具分组

#### Scenario: UUID 子工具可用
- **WHEN** 用户进入生成器并选择 UUID
- **THEN** 系统允许生成单个或批量 UUID v4

#### Scenario: 随机密码子工具可用
- **WHEN** 用户进入生成器并选择随机密码
- **THEN** 系统允许配置长度、字符集和是否排除易混字符后生成密码

#### Scenario: Lorem 子工具可用
- **WHEN** 用户进入生成器并选择 Lorem
- **THEN** 系统允许按词、句或段生成占位文本

#### Scenario: 二维码子工具可用
- **WHEN** 用户进入生成器并选择二维码
- **THEN** 系统允许输入文本或 URL 并生成二维码 PNG
