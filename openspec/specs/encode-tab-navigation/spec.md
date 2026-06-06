# encode-tab-navigation Specification

## Purpose

将编码工具合集作为独立标签注册到主标签栏，纳入数字快捷键与循环切换体系，并在状态栏显示对应标签名，使工具标签总数达到 7 个。

## Requirements

### Requirement: 编码标签注册

应用 SHALL 在主标签栏注册「编码」标签，位列「正则」与「设置」之间，使工具标签总数达到 7 个（编辑器、JSON 工具、文本对比、时间工具、正则、编码、设置）。

#### Scenario: 标签可见并可切换
- **WHEN** 应用启动后用户查看标签栏
- **THEN** 标签栏在正则与设置之间显示「编码」标签，点击后主区域显示编码工具合集

### Requirement: 编码标签快捷键

应用 SHALL 将编码标签纳入数字快捷键与循环切换：Ctrl+6 直达编码标签（设置顺延为 Ctrl+7），Ctrl+Tab / Ctrl+Shift+Tab 的循环范围覆盖全部 7 个标签。

#### Scenario: Ctrl+6 直达
- **WHEN** 用户按 Ctrl+6
- **THEN** 主区域切换到编码工具合集

#### Scenario: 循环切换覆盖编码标签
- **WHEN** 用户用 Ctrl+Tab 依次循环标签
- **THEN** 循环顺序包含编码标签，正反向循环均能到达且不越界

### Requirement: 状态栏标签名

状态栏 SHALL 在编码标签激活时显示对应的标签名称。

#### Scenario: 激活时显示标签名
- **WHEN** 编码标签处于激活状态
- **THEN** 状态栏显示该标签对应的名称（如「编码」）
