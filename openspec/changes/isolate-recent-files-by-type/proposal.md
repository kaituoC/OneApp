## Why

Markdown 和 HTML 编辑器当前共用同一个最近文件列表（`recentFiles`）。当用户在 HTML 编辑器中打开 `.md` 文件（或反之）时，文件会在错误的预览器中渲染，导致渲染失败或显示异常。需要按文件类型隔离最近文件列表。

## What Changes

- 将 `recentFiles` 拆分为 `recentMdFiles` 和 `recentHtmlFiles` 两个独立存储键
- `fileHelper.js` 新增按类型添加/读取最近文件的函数
- MarkdownTab 和 HtmlTab 各自使用对应类型的最近文件列表

## Capabilities

### New Capabilities
<!-- No new capabilities -->

### Modified Capabilities
- `recent-files-tracking`: 最近文件列表按类型隔离，Markdown 和 HTML 各有独立的最近文件列表

## Impact

- 修改 `fileHelper.js`: 新增 `addMdRecentFile`/`getMdRecentFiles`/`addHtmlRecentFile`/`getHtmlRecentFiles`
- 修改 `main.js`: electron-store 新增 `recentMdFiles` 和 `recentHtmlFiles` 默认值
- 修改 `MarkdownTab.vue` / `HtmlTab.vue`: 调用对应类型的最近文件函数
- 已有 `recentFiles` 数据不迁移（旧数据保留，新数据按类型写入）
