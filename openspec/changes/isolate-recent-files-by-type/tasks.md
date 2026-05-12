## 1. 修改 fileHelper.js 新增类型化最近文件函数

- [x] 1.1 提取内部通用函数 `addRecentFileByType(storeKey, filePath)` 复用添加逻辑
- [x] 1.2 新增 `addMdRecentFile`/`getMdRecentFiles`（读写 `recentMdFiles`）
- [x] 1.3 新增 `addHtmlRecentFile`/`getHtmlRecentFiles`（读写 `recentHtmlFiles`）

## 2. 修改 main.js electron-store 默认值

- [x] 2.1 在 store defaults 中新增 `recentMdFiles: []` 和 `recentHtmlFiles: []`

## 3. 修改 MarkdownTab.vue 使用类型化函数

- [x] 3.1 导入 `addMdRecentFile`/`getMdRecentFiles` 替换原有函数
- [x] 3.2 读取文件后调用 `addMdRecentFile` 而非通用 `addRecentFile`

## 4. 修改 HtmlTab.vue 使用类型化函数

- [x] 4.1 导入 `addHtmlRecentFile`/`getHtmlRecentFiles`
- [x] 4.2 读取文件后调用 `addHtmlRecentFile`

## 5. 验证

- [ ] 5.1 手动测试：在 Markdown 编辑器打开 .md 文件，确认只出现在 Markdown 最近列表
- [ ] 5.2 手动测试：在 HTML 编辑器打开 .html 文件，确认只出现在 HTML 最近列表
