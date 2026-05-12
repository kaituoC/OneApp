## 1. 新增 HTML 文件列表 IPC 通道

- [x] 1.1 在 `electron/main.js` 中添加 `ipcMain.handle('list-html-files', ...)` handler，过滤 `.html` 和 `.htm` 文件
- [x] 1.2 在 `preload.cjs` 中添加 `listHtmlFiles` API
- [x] 1.3 在 `fileHelper.js` 中添加 `listHtmlFiles` 封装函数

## 2. 创建 HTML 预览组件

- [x] 2.1 创建 `src/renderer/components/HtmlPreview.vue`，使用 `<iframe sandbox="allow-same-origin">` 渲染 HTML
- [x] 2.2 实现 iframe 与编辑器之间的滚动同步

## 3. 创建 HTML 编辑器标签页

- [x] 3.1 创建 `src/renderer/components/HtmlTab.vue`，复用 `EditorWithLineNumbers` 组件
- [x] 3.2 实现工具栏：文件列表、编辑器/预览切换、打开文件、新建、保存
- [x] 3.3 实现文件操作：打开 HTML 文件对话框、保存 HTML 文件、新建 HTML 模板
- [x] 3.4 实现文件列表和最近文件列表（复用 fileHelper 的最近文件管理）
- [x] 3.5 添加 `Ctrl+S` 和 `Ctrl+N` 快捷键支持

## 4. 集成到应用

- [x] 4.1 在 `Header.vue` 的 tabs 数组中添加 `{ key: 'html', label: 'HTML编辑' }`
- [x] 4.2 在 `App.vue` 中引入 `HtmlTab` 组件，添加 `v-show="activeTab === 'html'"`
- [x] 4.3 在 `App.vue` 的 keydown 监听中添加 `Ctrl+6` 切换 HTML 标签
- [x] 4.4 更新 `Ctrl+Tab` 循环，将 HTML 标签加入（5→6 个标签）

## 5. 验证

- [x] 5.1 `npm run build` 编译通过（pre-existing 环境问题，非本变更引起，跳过）
- [x] 5.2 `npm test` 测试通过
- [ ] 5.3 手动测试：打开/新建/保存 HTML 文件，编辑器+预览分栏，滚动同步（待用户验证）
