## Context

现有 Markdown 编辑器（`MarkdownTab.vue` + `MarkdownPreview.vue`）采用编辑器+预览分栏布局，预览通过 `marked` 将 Markdown 渲染为 HTML 并用 `v-html` 注入。该模式稳定运行，但 HTML 编辑器的预览机制需要不同方案。

## Goals / Non-Goals

**Goals:**
- 新增 HTML 编辑+实时预览标签页，复用现有编辑器和文件管理架构
- HTML 预览使用 iframe 沙箱隔离，确保用户 HTML 的 `<script>` 和 `<style>` 不泄漏到应用

**Non-Goals:**
- 不实现 HTML 语法高亮编辑器（使用现有 EditorWithLineNumbers 纯文本编辑）
- 不实现 CSS 实时刷新功能（后续迭代）
- 不修改现有 Markdown 编辑器

## Decisions

1. **iframe 沙箱预览**: HTML 预览组件使用 `<iframe sandbox="allow-same-origin">` 渲染用户 HTML，`sandbox` 属性阻止脚本执行但允许样式生效。通过 `srcdoc` 属性注入 HTML 内容。

2. **滚动同步**: iframe 内滚动通过监听 iframe 的 `contentWindow` 的 scroll 事件实现，与编辑器滚动比例映射。这与 Markdown 的直接 DOM 滚动不同，但模式相似。

3. **文件列表改造为通用**: `listFiles` 当前在主进程硬编码 `.md` 过滤。新增 `list-html-files` IPC handler（主进程）和 `listHtmlFiles` 函数（fileHelper.js），保持原有 Markdown 逻辑不变，避免回归风险。

4. **组件结构**: `HtmlTab.vue` 参考 `MarkdownTab.vue` 的布局（工具栏+文件列表+编辑器+预览），但移除 Markdown 特有的"导出 HTML/PDF"和"语法介绍"按钮，替换为 HTML 相关的操作。

5. **新建文件默认内容**: HTML 新建时生成标准 HTML5 模板（`<!DOCTYPE html><html>...`），而不是 Markdown 的 `# 新文档`。

## Risks / Trade-offs

- **[风险]** iframe 沙箱中 `<script>` 被阻止执行，用户可能期望脚本运行。→ **缓解**: 这是安全选择，后续可在设置中提供"允许脚本"选项（需要更复杂的沙箱配置）。当前版本保持最安全模式。
- **[风险]** iframe 的样式可能与应用的深色/浅色主题不协调。→ **缓解**: HTML 预览区域使用白色背景（用户 HTML 通常假设白底），与应用主题分离是合理行为。
- **[权衡]** 新增 2 个组件约 400 行代码。→ 可接受，因为 HTML 和 Markdown 的预览机制本质不同，强行复用会增加复杂度。
