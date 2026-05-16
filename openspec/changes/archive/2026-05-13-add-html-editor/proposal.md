## Why

OneApp 目前只有 Markdown 编辑功能，用户无法在应用内编辑和预览 HTML 文件。HTML 是前端开发常用格式，支持 HTML 编辑和实时预览将扩展 OneApp 作为开发者工具的覆盖面。

## What Changes

- 新增 HTML 编辑器标签页，提供与 Markdown 类似的编辑+预览体验
- 新增 `listHtmlFiles` 函数和 IPC handler，扫描 `.html`/`.htm` 文件
- 新增 HTML 预览组件，使用 iframe 沙箱渲染用户 HTML（防止脚本和样式泄漏）
- Header 新增 "HTML编辑" 标签
- App.vue 新增 `html` 标签页和 `Ctrl+6` 快捷键
- `Ctrl+Tab` 循环增加 HTML 标签

## Capabilities

### New Capabilities
- `html-editor`: HTML 文件编辑和实时预览功能，包括文件管理、编辑器/预览切换、保存导出
- `html-preview`: 使用 iframe 沙箱渲染 HTML 预览，支持滚动同步
- `html-file-list`: 工作目录中 `.html`/`.htm` 文件的扫描和列表展示

### Modified Capabilities
<!-- No existing capabilities whose requirements are changing -->

## Impact

- 新增文件: `HtmlTab.vue`, `HtmlPreview.vue`
- 修改文件: `Header.vue` (新增标签), `App.vue` (新增标签页+快捷键), `electron/main.js` (新增 list-html-files IPC), `preload.cjs` (新增 listHtmlFiles API), `fileHelper.js` (新增 listHtmlFiles 封装)
