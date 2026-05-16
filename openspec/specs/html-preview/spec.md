## ADDED Requirements

### Requirement: HTML preview with iframe sandbox

系统 SHALL 使用 iframe 沙箱渲染 HTML 预览，确保用户 HTML 的脚本和样式不泄漏到应用程序。

#### Scenario: Preview renders HTML content
- **WHEN** 用户在编辑器中编写 HTML 代码
- **THEN** 预览区域通过 iframe srcdoc 实时渲染 HTML 内容

#### Scenario: Script execution blocked in sandbox
- **WHEN** 用户 HTML 中包含 `<script>` 标签
- **THEN** 脚本不执行（iframe sandbox 阻止）

#### Scenario: Styles isolated in sandbox
- **WHEN** 用户 HTML 中包含 `<style>` 标签
- **THEN** 样式仅作用于 iframe 内部，不泄漏到应用程序

#### Scenario: Scroll sync between editor and preview
- **WHEN** 用户在编辑器中滚动
- **THEN** 预览 iframe 按相同比例滚动，反之亦然
