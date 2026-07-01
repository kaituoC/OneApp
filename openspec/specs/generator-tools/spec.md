# generator-tools Specification

## Purpose

generator-tools 定义 OneApp 生成器合集：在“生成工具”分组下提供 UUID v4、随机密码、Lorem 占位文本和二维码等本地离线生成能力，并使用共享 tool surface 呈现配置、输出和复制反馈。

## Requirements

### Requirement: 生成器合集入口
OneApp SHALL provide a Generator tool entry under a dedicated generation group for local developer-oriented content generation.

#### Scenario: 生成器入口可见
- **WHEN** 用户查看 workbench navigation
- **THEN** 系统显示“生成工具”分组和“生成器”入口

#### Scenario: 进入生成器
- **WHEN** 用户选择“生成器”入口
- **THEN** 主内容区显示 UUID、随机密码、Lorem 和二维码子工具

### Requirement: UUID v4 生成
Generator Tools SHALL generate RFC 4122 compatible UUID v4 values locally, supporting single and batch output.

#### Scenario: 生成单个 UUID
- **WHEN** 用户在 UUID 子工具中生成单个值
- **THEN** 系统输出一个符合 UUID v4 格式的字符串

#### Scenario: 批量生成 UUID
- **WHEN** 用户设置批量数量并触发生成
- **THEN** 系统按行输出指定数量的 UUID v4 字符串

#### Scenario: UUID 数量越界
- **WHEN** 用户输入小于 1 或超过上限的批量数量
- **THEN** 系统显示明确错误而不是生成结果

### Requirement: 随机密码生成
Generator Tools SHALL generate random passwords locally according to user-selected length and character set options.

#### Scenario: 生成符合选项的密码
- **WHEN** 用户选择长度、大小写、数字和符号选项后生成密码
- **THEN** 系统输出长度正确且只包含所选字符集的密码

#### Scenario: 排除易混字符
- **WHEN** 用户启用排除易混字符
- **THEN** 系统生成的密码不包含易混字符集合中的字符

#### Scenario: 字符集为空
- **WHEN** 用户关闭全部字符集后生成密码
- **THEN** 系统显示无法生成的错误提示

### Requirement: Lorem 占位文本生成
Generator Tools SHALL generate Lorem placeholder text by word, sentence, or paragraph count.

#### Scenario: 按词生成
- **WHEN** 用户选择按词生成并输入词数
- **THEN** 系统输出对应数量的 Lorem 单词

#### Scenario: 按句生成
- **WHEN** 用户选择按句生成并输入句数
- **THEN** 系统输出对应数量的句子，每句以句号结束

#### Scenario: 按段生成
- **WHEN** 用户选择按段生成并输入段数
- **THEN** 系统输出对应数量的段落，段落之间使用空行分隔

### Requirement: 生成器结果复制
Generator Tools SHALL allow users to copy generated output using the shared copy feedback pattern.

#### Scenario: 复制生成结果
- **WHEN** 生成器已有输出且用户触发复制
- **THEN** 系统复制当前结果到剪贴板并显示复制成功反馈

#### Scenario: 无结果时复制
- **WHEN** 生成器没有可复制输出且用户触发复制
- **THEN** 系统不复制空内容，并保持可理解的空态或状态提示

### Requirement: 本地离线生成
Generator Tools SHALL generate UUID, password, Lorem, and QR code outputs entirely in the renderer without network requests.

#### Scenario: 生成时不访问网络
- **WHEN** 用户使用任意生成器子工具
- **THEN** 系统在本地生成结果，不调用远程服务或外部账号
