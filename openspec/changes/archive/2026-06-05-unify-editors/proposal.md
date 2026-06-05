## Why

Markdown 与 HTML 两个编辑器组件（`MarkdownTab.vue` 515 行、`HtmlTab.vue` 444 行）的 9/11 函数与约 170 行样式几乎逐字重复，仅在「预览方式、滚动同步、最近文件 API、文件后缀、专属导出」5 处不同。这份重复是后续所有文本类工具（正则、编码、YAML 等）的地基阻碍：每加一种可编辑类型都要再复制一遍。本次将两者合并为单一 `EditorTab`，按文件后缀自动选择编辑/预览方式，并顺势移除使用价值低、且正是合并最大障碍的两处「最近」功能（编辑器侧栏最近文件、目录树最近文件夹）。

## What Changes

- **合并编辑器**：新增 `EditorTab.vue` 取代 `MarkdownTab.vue` 与 `HtmlTab.vue`；按当前文件后缀驱动 `mode`（`.md` → markdown，`.html`/`.htm` → html）。
- **多态预览**：`mode` 决定挂载 `MarkdownPreview`（marked → DOM，双向滚动同步）或 `HtmlPreview`（iframe 沙箱，单向滚动同步）。
- **上下文工具栏**：通用按钮（显示列表/编辑/预览、打开、新建、保存）始终在；markdown 模式额外显示「导出 HTML / 导出 PDF / 语法介绍」。
- **新建按文件类型**：「新建」拆为「新建 Markdown」「新建 HTML」两项，各套对应模板。
- **共用逻辑抽取**：保存、新建、打开、Ctrl+S/N 快捷键、170 行样式去重，收敛为可复用 composable / 共享样式。
- **App.vue 标签合并**：原 Markdown、HTML 两个标签合为一个「编辑器」标签，标签总数 6 → 5，Ctrl+1-6 快捷键顺移。
- **移除①编辑器侧栏「最近打开文件」**：删除 MD/HTML 侧栏底部可折叠最近文件区块、tooltip、相关 `fileHelper` API（`addMd/getMd/removeMd/addHtml/getHtml/removeHtmlRecentFile`）及 electron-store 的 `recentMdFiles`/`recentHtmlFiles`。**BREAKING**（移除已发布的用户可见功能）。
- **移除③目录树「最近文件夹」下拉**：删除 `FileTree.vue` 顶部 ▾ 下拉及逻辑、`fileHelper` 的 `addRecentFolder/getRecentFolders`、electron-store 的 `recentFolders`。**BREAKING**。
- **保留②设置页「最近文件」列表**：`SettingsTab` 中基于顶层 `recentFiles` store 的列表不变。

## Capabilities

### New Capabilities
- `unified-editor`: 单一编辑器标签按文件后缀识别类型、编辑、多态预览、上下文工具栏、按类型新建、打开/保存、以及不含「最近文件」的目录树侧栏。承接原 `markdown-open-file`、`html-editor`、`markdown-file-list`、`html-file-list` 的全部编辑器行为。

### Modified Capabilities
- `recent-files-tracking`: 整个能力移除——其描述的「编辑器侧栏最近打开文件」即本次移除的功能①。
- `file-tree-explorer`: 移除「Recent folders quick switch」需求（功能③）；其余树需求措辞由「Markdown/HTML 编辑器」泛化为「统一编辑器按当前文件类型」。
- `markdown-open-file`: 需求整体迁移至 `unified-editor`，原能力移除。
- `html-editor`: 需求整体迁移至 `unified-editor`，原能力移除。
- `markdown-file-list`: 需求整体迁移至 `unified-editor`，原能力移除。
- `html-file-list`: 需求整体迁移至 `unified-editor`，原能力移除。
- `html-preview`: 保留并由 `unified-editor` 复用；修正「滚动反之亦然（双向）」的描述为与实现一致的「编辑器 → 预览单向同步」。

## Impact

- **渲染层组件**：新增 `EditorTab.vue`；删除 `MarkdownTab.vue`、`HtmlTab.vue`；修改 `App.vue`（标签合并、快捷键顺移）、`FileTree.vue`（移除最近文件夹下拉）。
- **工具层**：`src/renderer/utils/fileHelper.js` 移除 `addMd/getMd/removeMd/addHtml/getHtml/removeHtmlRecentFile`、`addRecentFolder/getRecentFolders` 及底层 `addRecentFileByType/getRecentFilesByType`（若无其它调用方）。
- **主进程**：`electron/main.js` electron-store 默认值移除 `recentMdFiles`、`recentHtmlFiles`、`recentFolders`（保留 `recentFiles`）。
- **保留不动**：`SettingsTab.vue`、`MarkdownPreview.vue`、`HtmlPreview.vue`、`EditorWithLineNumbers.vue`、`TreeNode.vue` 的核心能力。
- **文档**：README、CHANGELOG、CLAUDE.md（架构小节移除 MarkdownTab/HtmlTab 描述，改为 EditorTab）。
- **OpenSpec 数据卫生**：归档时被取代的 `markdown-open-file`、`html-editor`、`markdown-file-list`、`html-file-list`、`recent-files-tracking` 主 spec 需随能力移除而清理。
