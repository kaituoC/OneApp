## ADDED Requirements

### Requirement: 二维码生成
生成器 SHALL provide a QR code sub-tool that generates a PNG QR code from user-provided text or URL input, supports size and error correction settings, and offers preview, download, and PNG copy actions.

#### Scenario: 文本生成二维码
- **WHEN** 用户输入非空文本并执行生成
- **THEN** 系统生成二维码 PNG 预览，并提供可下载和可复制的 PNG 结果

#### Scenario: URL 生成二维码
- **WHEN** 用户输入 URL 并执行生成
- **THEN** 系统将完整 URL 内容编码进二维码，而不是尝试访问 URL

#### Scenario: 尺寸和纠错级别变化
- **WHEN** 用户调整尺寸或纠错级别后重新生成
- **THEN** 系统使用新的尺寸和纠错级别生成二维码

#### Scenario: 空输入
- **WHEN** 用户未输入内容就执行二维码生成
- **THEN** 系统展示明确错误并不生成二维码

#### Scenario: 下载和复制 PNG
- **WHEN** 二维码生成成功
- **THEN** 用户可以下载 PNG，并在环境支持时复制 PNG 到剪贴板
