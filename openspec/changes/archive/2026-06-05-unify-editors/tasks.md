## 1. 抽取共用逻辑 composable

- [x] 1.1 新建 `src/renderer/composables/useEditorFile.js`，迁入状态 `editorContent`/`currentFilePath`/`mode` 与方法 `openFileDialog`/`openFromTree`/`newFile`/`saveFile`/`onContentChange`
- [x] 1.2 在 composable 内实现「后缀 → mode」派生（`.md`→markdown，`.html`/`.htm`→html，无文件默认 markdown）
- [x] 1.3 Ctrl/Cmd+S 保存、Ctrl/Cmd+N 新建快捷键改为 `onMounted` 绑定、`onUnmounted` 解绑
- [x] 1.4 保存逻辑按 `mode` 设置新文件默认扩展名（`.md` / `.html`），保存后调用目录树 `refresh()`

## 2. 新建 EditorTab 组件

- [x] 2.1 新建 `src/renderer/components/EditorTab.vue`，使用 `useEditorFile`，模板含工具栏 + 目录树侧栏（无最近文件区）+ 编辑器 + 预览区
- [x] 2.2 工具栏「新建」拆为「新建 Markdown」「新建 HTML」两项，各套对应模板
- [x] 2.3 上下文工具栏：仅 `markdown` 模式显示「导出 HTML」「导出 PDF」「语法介绍」，并迁入 `exportHTML`/`exportPDF`/`SyntaxHelpModal`
- [x] 2.4 预览区用 `<component :is>` 按 `mode` 挂载 `MarkdownPreview` / `HtmlPreview`
- [x] 2.5 滚动同步按 `mode` 分叉：markdown 双向（编辑↔DOM）、html 单向（编辑→iframe）
- [x] 2.6 `FileTree` 的 `editable-extensions` 按 `mode` 传入（markdown→`['md']`，html→`['html','htm']`）
- [x] 2.7 去重并迁入两组件共享的 `<style>`（约 170 行）

## 3. 移除①编辑器侧栏「最近打开文件」

- [x] 3.1 EditorTab 不含最近文件区块、tooltip、`loadRecentFiles`/`openRecentFile`/`showRecentTooltip` 等
- [x] 3.2 `fileHelper.js` 删除 `addMdRecentFile`/`getMdRecentFiles`/`removeMdRecentFile`/`addHtmlRecentFile`/`getHtmlRecentFiles`/`removeHtmlRecentFile`
- [x] 3.3 `electron/main.js` 移除 electron-store 默认值 `recentMdFiles`、`recentHtmlFiles`

## 4. 移除③目录树「最近文件夹」下拉

- [x] 4.1 `FileTree.vue` 删除顶部最近文件夹 ▾ 下拉 UI、`recentFolders`/`recentMenuOpen` 状态及 `toggleRecentMenu`/`selectRecentFolder`/`loadRecentFolders`
- [x] 4.2 `fileHelper.js` 删除 `addRecentFolder`/`getRecentFolders`
- [x] 4.3 确认 `addRecentFileByType`/`getRecentFilesByType` 已无调用方后一并删除
- [x] 4.4 `electron/main.js` 移除 electron-store 默认值 `recentFolders`

## 5. App.vue 标签合并与快捷键

- [x] 5.1 将 `markdown`、`html` 两个标签合并为单一 `editor` 标签，引入 `EditorTab`，移除 `MarkdownTab`/`HtmlTab` 引用
- [x] 5.2 Ctrl+1-6 顺移为 Ctrl+1-5，更新 `Ctrl+Tab` 循环范围与 `StatusBar`/`activeTab` 取值
- [x] 5.3 启动时将持久化的旧 `activeTab` 值（`markdown`/`html`）归一为 `editor`
- [x] 5.4 删除 `src/renderer/components/MarkdownTab.vue`、`HtmlTab.vue`

## 6. 自测与文档

- [x] 6.1 `npm test` 全部通过
- [x] 6.2 `npm run build` 编译通过（沙箱外执行）
- [x] 6.3 `npm run dev` 手动核对：md/html 的打开/新建/编辑/预览/滚动/保存/导出与合并前等价；标签切换后无监听泄漏
- [x] 6.4 更新 README、CHANGELOG（标注移除①③、保留②、Ctrl 序号变化）、CLAUDE.md 架构小节（MarkdownTab/HtmlTab → EditorTab）

## 7. 归档前 OpenSpec 数据卫生

- [ ] 7.1 归档时确认 `markdown-open-file`/`html-editor`/`markdown-file-list`/`html-file-list`/`recent-files-tracking` 主 spec 随能力移除被清理
- [ ] 7.2 确认 `file-tree-explorer`/`html-preview` 主 spec 合并 delta 后无残留 `## MODIFIED`/`## REMOVED` 头
- [ ] 7.3 确认新建 `unified-editor` 主 spec 结构规范（`# 标题 / ## Purpose / ## Requirements`）
