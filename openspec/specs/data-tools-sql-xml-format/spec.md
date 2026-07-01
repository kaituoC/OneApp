# data-tools-sql-xml-format Specification

## Purpose

data-tools-sql-xml-format 定义数据工具合集中的 SQL / XML 轻量格式化能力：用户可以对 SQL 和 XML 文本进行格式化、压缩，并在 XML 存在明显结构问题时获得错误提示。

## Requirements

### Requirement: SQL 格式化子工具

数据工具 SHALL provide a SQL sub-tool for lightweight SQL formatting and compression.

#### Scenario: SQL 格式化
- **WHEN** 用户输入 SQL 并执行格式化
- **THEN** 系统输出稳定、可复制、带缩进和换行的 SQL 文本

#### Scenario: SQL 压缩
- **WHEN** 用户输入 SQL 并执行压缩
- **THEN** 系统输出去除无意义换行和多余空白后的 SQL 文本

#### Scenario: SQL 空输入
- **WHEN** 用户执行 SQL 格式化或压缩但输入为空
- **THEN** 系统展示明确错误并不输出误导性结果

### Requirement: XML 格式化子工具

数据工具 SHALL provide an XML sub-tool for lightweight XML formatting, compression, and obvious structure error reporting.

#### Scenario: XML 格式化
- **WHEN** 用户输入结构有效的 XML 并执行格式化
- **THEN** 系统输出保持节点结构且带缩进和换行的 XML 文本

#### Scenario: XML 压缩
- **WHEN** 用户输入结构有效的 XML 并执行压缩
- **THEN** 系统输出去除标签间无意义空白后的 XML 文本

#### Scenario: XML 明显结构错误
- **WHEN** 用户输入存在明显结构问题的 XML，例如标签未闭合
- **THEN** 系统展示包含解析原因的错误提示，并不输出格式化或压缩结果
