## Why

当前 Markdown / HTML 编辑器的左侧文件列表只能展示「单一工作目录下的一层文件」。用户想浏览其他目录时只能去设置里改 `workDir`，或反复点「打开文件」走系统弹窗重选目录，切换目录非常繁琐。引入类似文件管理器的目录树后，用户可直接在侧边栏内浏览子目录、快速切换目录根、点开文件，免去弹窗往返。

## What Changes

- 在 Markdown / HTML 编辑器侧边栏，用「懒加载目录树」**替换**当前的单层平铺文件列表。
- 目录树默认以现有 `workDir` 为根；顶部新增「打开文件夹」按钮可临时换根，并通过「最近文件夹」下拉快速切换。
- 子目录懒加载：点开文件夹节点时才读取它的下一层内容。
- 树中只显示「文件夹」+「当前编辑器可编辑的目标类型文件」（Markdown → `.md`；HTML → `.html` / `.htm`），其它类型文件不显示。
- 默认隐藏以 `.` 开头的隐藏项及 `node_modules` 等重目录；工具栏新增「显示隐藏项」开关可切换。
- 「最近打开的文件」列表移到侧边栏底部，做成可折叠区域，默认收起，目录树占满主体。
- 新增「最近打开的文件夹」共享存储（`recentFolders`，Markdown / HTML 通用，不按类型隔离）。
- 不包含任何文件操作（新建 / 重命名 / 删除），纯浏览 + 打开。
- 新增主进程 IPC `read-dir`（返回目录直接子项及其类型），在 `preload.cjs` 暴露 `readDir`。

## Capabilities

### New Capabilities
- `file-tree-explorer`: 侧边栏内的懒加载目录树——浏览目录、切换根目录、记忆最近文件夹、隐藏项开关、按类型过滤显示、点击打开文件。

### Modified Capabilities
- `markdown-file-list`: 文件列表面板布局变更——目录树取代原「工作目录平铺列表」上半区。
- `html-file-list`: 同上，HTML 编辑器侧边栏由平铺列表改为目录树。
- `recent-files-tracking`: 「最近打开文件」区从固定上下分栏改为侧边栏底部的可折叠区域（默认收起）；最近文件的按类型隔离、持久化与失效校验逻辑保持不变。

## Impact

- 主进程：`electron/main.js` 新增 `read-dir` IPC、`recentFolders` store 默认值。
- 预加载：`preload.cjs` 暴露 `readDir`。
- 渲染层：新增可复用组件 `FileTree.vue` + 递归 `TreeNode.vue`；改造 `MarkdownTab.vue`、`HtmlTab.vue` 侧边栏；`fileHelper.js` 新增 `readDir` 封装与最近文件夹读写。
- 现有 `list-files` / `list-html-files` IPC 在树接入后可能不再被引用，实现时评估是否保留或废弃。
- 无破坏性数据变更：现有 `recentMdFiles` / `recentHtmlFiles` 保持原样。
