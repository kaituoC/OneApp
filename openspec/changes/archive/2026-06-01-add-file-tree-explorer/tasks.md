## 1. 主进程与预加载（后端能力）

- [x] 1.1 在 `electron/main.js` 新增 `read-dir` IPC：`fs.readdirSync(path, { withFileTypes: true })` 返回 `[{ name, path, isDirectory }]`，子项绝对路径用 `path.join` 拼接，排序为「文件夹优先 + 组内名称升序」；读取失败返回 `{ success:false, error }`
- [x] 1.2 在 `electron/main.js` 的 store `defaults` 中新增 `recentFolders: []`
- [x] 1.3 在 `preload.cjs` 暴露 `readDir: (dirPath) => ipcRenderer.invoke('read-dir', dirPath)`

## 2. fileHelper 封装

- [x] 2.1 在 `fileHelper.js` 新增 `readDir(dirPath)`，包装 IPC 并沿用 `{ success }` 解包约定
- [x] 2.2 在 `fileHelper.js` 新增最近文件夹读写：`addRecentFolder(path)`、`getRecentFolders()`（共享 `recentFolders` 键，去重 / 时间戳置顶 / 上限 50）
- [x] 2.3 新增可编辑性判断辅助：根据扩展名列表过滤目录条目（文件夹始终保留，文件按 `editableExtensions` 过滤），以及隐藏项过滤（dotfiles + `node_modules` 黑名单，受 `showHidden` 控制）

## 3. 树组件

- [x] 3.1 创建递归组件 `TreeNode.vue`：渲染单个节点，管理「展开/折叠/加载中/错误」局部状态，展开时调用 `readDir` 懒加载子项并应用过滤与排序，文件节点点击时向上 emit `open-file`
- [x] 3.2 创建容器组件 `FileTree.vue`：持有根路径，渲染顶部「打开文件夹」按钮、最近文件夹下拉、「显示隐藏项」开关；通过 props 接收 `rootPath`、`editableExtensions`、`showHidden`；向上 emit `open-file` 与根目录切换事件
- [x] 3.3 `FileTree.vue` 实现根目录切换：默认 `workDir`；「打开文件夹」走目录选择对话框；切换成功后写入 `recentFolders` 并刷新树
- [x] 3.4 处理空 / 无 `workDir` / 读取失败的占位提示

## 4. 接入 MarkdownTab

- [x] 4.1 用 `FileTree`（`editableExtensions=['md']`）替换 `MarkdownTab.vue` 侧边栏上半区的平铺文件列表
- [x] 4.2 将「最近打开文件」改为底部可折叠区域，默认收起，复用现有读取 / tooltip / 失效移除逻辑
- [x] 4.3 将 `FileTree` 的 `open-file` 接到现有打开逻辑（读内容 + 加入 `recentMdFiles`）

## 5. 接入 HtmlTab

- [x] 5.1 用 `FileTree`（`editableExtensions=['html','htm']`）替换 `HtmlTab.vue` 侧边栏上半区的平铺文件列表
- [x] 5.2 将「最近打开文件」改为底部可折叠区域，默认收起，复用现有逻辑
- [x] 5.3 将 `open-file` 接到现有打开逻辑（读内容 + 加入 `recentHtmlFiles`）

## 6. 样式与收尾

- [x] 6.1 目录树样式：缩进、展开/折叠图标、文件夹/文件图标、hover/active 态、独立滚动，复用现有 CSS 变量与主题（深/浅色）
- [x] 6.2 评估 `list-files` / `list-html-files` IPC 是否仍被引用，决定保留或移除（已确认无任何调用，移除整条死链：fileHelper 导出 + preload 桥接 + main.js handler）
- [x] 6.3 手动验证：Markdown 与 HTML 两个 Tab 均能浏览子目录、懒加载、切换根目录、最近文件夹快切、隐藏项开关、点开文件、最近文件折叠展开（用户已运行应用验证通过；并修复 HTML 树工具栏按钮未撑满靠右的布局问题）
- [x] 6.4 运行 `npm test` 确认无回归；为 `fileHelper` 新增的纯函数（过滤 / 排序）补充单元测试（若可独立）
