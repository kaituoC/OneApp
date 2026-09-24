## ADDED Requirements

### Requirement: 默认三栏工作区

编辑器 SHALL 位于第一个一级入口并作为默认页；Markdown/HTML 默认从左到右展示目录、编辑、预览。窄窗口保留左右结构及各栏独立滚动；纯文本保留目录与编辑，隐藏预览相关控制。

#### Scenario: 默认进入编辑器
- **WHEN** 用户启动应用
- **THEN** 编辑器为第一个且激活的 tab，默认 Markdown 显示三栏

#### Scenario: 最小窗口
- **WHEN** 窗口缩小到 800×600
- **THEN** 目录、编辑、预览仍左右排列，文本可滚动，面板开关继续有效
