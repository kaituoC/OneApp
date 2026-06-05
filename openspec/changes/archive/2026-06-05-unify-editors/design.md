## Context

`MarkdownTab.vue`（515 行）与 `HtmlTab.vue`（444 行）是平行演进的两个编辑器，结构高度重合：工具栏、目录树侧栏、最近文件区、`EditorWithLineNumbers` 编辑器、预览区、保存/新建/打开/快捷键逻辑几乎一致。差异仅集中在 5 处（预览组件、滚动同步方向、最近文件 API、文件后缀、markdown 专属导出）。两者各自依赖：

- 共用：`EditorWithLineNumbers.vue`、`FileTree.vue`、`fileHelper.js`（IPC 封装 + 最近文件追踪）
- 各自：`MarkdownPreview.vue` / `HtmlPreview.vue`、`getMd*`/`getHtml*` 最近文件 API

约束：纯前端 Vue 3 Composition API；预览必须保持现有两种实现（marked DOM 与 iframe 沙箱）的行为；本次不引入新依赖；保留②设置页最近文件（顶层 `recentFiles` store）。

## Goals / Non-Goals

**Goals:**
- 用单一 `EditorTab.vue` 取代两个编辑器，消除重复，成为后续文本类工具的可扩展地基。
- 行为对 md/html 保持等价（除被显式移除的①③最近功能外），用户感知一致。
- 预览/滚动同步/工具栏按 `mode` 分叉，分叉点集中、可读。
- 移除①③最近功能，连带清理 `fileHelper`、`main.js`、相关 spec，归档后数据干净。

**Non-Goals:**
- 不做多文档标签页（仍是单一编辑器标签、一次开一个文件）。
- 不支持 `.txt/.css/.js/.xml` 等纯文本类型（留作下一迭代；本次架构为其预留 mode 扩展位）。
- 不改 `MarkdownPreview`/`HtmlPreview`/`EditorWithLineNumbers` 的内部实现。
- 不动②设置页最近文件。

## Decisions

### 1. 以「文件后缀 → mode」为单一事实源驱动一切分叉
`mode` 由当前文件后缀计算：`.md` → `'markdown'`，`.html`/`.htm` → `'html'`。`mode` 同时驱动：挂载哪个预览组件、滚动同步策略、工具栏专属按钮、`FileTree` 的 `editableExtensions`、新建模板、保存对话框默认扩展名。无文件时默认 `'markdown'`；打开/新建后按其后缀更新。
- **为何**：单一来源避免「预览是 md 但工具栏是 html」之类的状态不一致；新增类型只需扩一个映射项。
- **替代**：用独立布尔位（isMarkdown/isHtml）控制各处——被否，状态易漂移、扩展时组合爆炸。

### 2. 预览用动态组件 `<component :is>` 多态挂载
按 `mode` 映射到预览组件（markdown → `MarkdownPreview`，html → `HtmlPreview`）。预览区是否显示由 `showPreview` 控制；未来纯文本类型映射为「无预览组件」即自动隐藏预览区。
- **为何**：把两个 `v-if` 收敛为一张映射表，扩展点清晰。
- **替代**：保留 `v-if="mode==='markdown'"` 双分支——可行但每加类型多一个分支，不如映射表。

### 3. 共用逻辑抽取为 `useEditorFile` composable
将打开（对话框 + 目录树）、保存（含 `dialogSaveFile` 回退）、新建、`onContentChange`、Ctrl+S/N 键盘监听、`currentFilePath`/`editorContent`/`mode` 状态收进 `src/renderer/composables/useEditorFile.js`。`EditorTab.vue` 只保留模板、`mode` 派生的工具栏/预览分叉、滚动同步。
- **为何**：composable 是 Vue 3 惯用的逻辑复用方式，比 mixin 显式、比基类灵活；让 `EditorTab` 模板聚焦视图。
- **键盘监听修正**：现有两组件都在模块顶层 `document.addEventListener('keydown')` 且从不解绑——合并后必须在 `onMounted` 绑定、`onUnmounted` 解绑，避免标签切换后泄漏与重复触发。
- **替代**：把逻辑直接留在 `EditorTab.vue`——组件仍臃肿，违背「为后续工具铺地基」初衷。

### 4. 滚动同步按 mode 选择策略，保留各自现状
markdown：编辑器 ↔ 预览 DOM 双向同步（保留 `MarkdownTab` 现有 `onEditorScroll`/`onPreviewScroll`）。html：编辑器 → iframe `body` 单向同步（保留 `HtmlTab` 现状，iframe 反向监听成本高、价值低，不新增）。
- **为何**：等价迁移，不引入回归；同步差异本就是两预览技术形态决定的。
- 顺带修正 `html-preview` spec 中「反之亦然」的措辞，使其与单向实现一致。

### 5. App.vue 标签合并与快捷键顺移
原 `markdown`、`html` 两个标签合为一个 `editor` 标签，标签集从 6 项变 5 项（编辑器 / JSON / Diff / 时间 / 设置）。Ctrl+1-6 顺延为 Ctrl+1-5，`Ctrl+Tab` 循环范围相应缩小。`StatusBar`、`activeTab` 取值同步更新。
- **为何**：单一编辑器标签是本次核心交付；快捷键必须与新标签集一致。
- **迁移注意**：持久化的 `activeTab` 若存了旧值 `'markdown'`/`'html'`，启动时需归一到 `'editor'`，避免空白页。

### 6. 移除①③最近功能的清理边界
①：删 `EditorTab` 侧栏最近文件区块 + tooltip + `loadRecentFiles/openRecentFile`，删 `fileHelper` 的 `addMd/getMd/removeMd/addHtml/getHtml/removeHtmlRecentFile`，`main.js` 去掉 `recentMdFiles`/`recentHtmlFiles` 默认值。③：删 `FileTree.vue` 顶部最近文件夹下拉 + `addRecentFolder/getRecentFolders`，`main.js` 去掉 `recentFolders`。底层 `addRecentFileByType/getRecentFilesByType` 在①③移除后确认无调用方则一并删。②顶层 `recentFiles` 与 `SettingsTab` 保持不动。
- **残留 store 数据**：用户机器上已存的 `recentMdFiles`/`recentHtmlFiles`/`recentFolders` 键无害，留存即可，不需要主动清理迁移脚本。

## Risks / Trade-offs

- **回归风险：合并后 md/html 行为漂移** → 合并前用 `npm test` + `npm run dev` 手动逐项核对两类文件的打开/编辑/预览/滚动/导出/保存，以「等价」为验收基线。
- **键盘监听泄漏/重复**（现有 bug，合并放大）→ 改为 `onMounted`/`onUnmounted` 成对绑定解绑，纳入验收。
- **快捷键顺移破坏肌肉记忆 / 持久化 activeTab 失配** → CHANGELOG 注明 Ctrl 序号变化；启动时归一旧 `activeTab` 值。
- **spec 大改触发归档数据卫生问题**（5 个能力随合并移除）→ tasks 中显式列出归档前的 spec 清理项，归档时核对主 specs 无残留 delta 头。
- **移除最近文件属 BREAKING** → 已与用户确认；CHANGELOG 明确标注移除项与保留项（设置页最近文件仍在）。
