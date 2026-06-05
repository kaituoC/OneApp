## 1. 核心逻辑

- [x] 1.1 `useEditorFile.js`：`modeFromPath` 未知后缀返回 `'plaintext'`（而非 `'markdown'`）
- [x] 1.2 `useEditorFile.js`：`EDITOR_FILTERS` 增加 `{ name: '所有文件', extensions: ['*'] }` 选项
- [x] 1.3 `useEditorFile.js`：`newFile` 函数支持 `'plaintext'` 类型（内容为空、默认文件名 `untitled.txt`、保存对话框后缀 `.txt`）

## 2. EditorTab UI

- [x] 2.1 `EditorTab.vue`：新建下拉菜单增加「新建纯文本」选项
- [x] 2.2 `EditorTab.vue`：`mode === 'plaintext'` 时隐藏预览区（不渲染 `<component>`）、编辑器全宽
- [x] 2.3 `EditorTab.vue`：`mode === 'plaintext'` 时隐藏"显示/隐藏预览"、"导出 HTML"、"导出 PDF"、"语法介绍"按钮

## 3. 目录树

- [x] 3.1 `EditorTab.vue`：移除 `editableExtensions` 硬编码，传空数组给 FileTree
- [x] 3.2 `FileTree.vue`：`editableExtensions` 为空数组时不过滤文件，显示所有非隐藏文件

## 4. 收尾

- [x] 4.1 `npm test` 通过 + `npm run build` 编译通过
- [x] 4.2 `npm run dev` 手动验证：打开 .txt/.js/.css 文件、新建纯文本、目录树显示所有文件
- [x] 4.3 升级版本号（patch: 1.5.0 → 1.5.1）、更新 CHANGELOG
