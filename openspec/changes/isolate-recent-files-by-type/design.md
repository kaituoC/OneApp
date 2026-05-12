## Context

当前 `recentFiles` 存储为 `electron-store` 中的单一数组。`readFile()` 调用 `addRecentFile()` 写入所有文件路径，MarkdownTab 和 HtmlTab 都调用 `getRecentFiles()` 读取。

## Goals / Non-Goals

**Goals:**
- Markdown 和 HTML 编辑器各自维护独立的最近文件列表
- 点击错误类型的最近文件不会在错误的预览器中渲染

**Non-Goals:**
- 不迁移旧的 `recentFiles` 数据到新字段（用户重新打开即可）
- 不实现通用的"按扩展名过滤"机制（仅区分 md 和 html 两类）

## Decisions

1. **在 fileHelper.js 中新增类型化函数**: 保留原有 `addRecentFile`/`getRecentFiles`（可能被其他组件使用），新增 `addMdRecentFile`/`getMdRecentFiles` 和 `addHtmlRecentFile`/`getHtmlRecentFiles`。这样 MarkdownTab 调用 `addMdRecentFile`，HtmlTab 调用 `addHtmlRecentFile`。

2. **readFile 不自动调用类型化函数**: 因为 `readFile` 不知道调用上下文。改为 MarkdownTab 和 HtmlTab 在成功读取文件后各自调用对应的 `addMdRecentFile`/`addHtmlRecentFile`。

3. **electron-store 新增两个键**: `recentMdFiles` 和 `recentHtmlFiles`，各最多 50 条。

## Risks / Trade-offs

- **[风险]** 代码重复：最近文件逻辑复制两份。→ **缓解**: 提取内部通用函数 `addRecentFileByType(key, filePath)` 复用逻辑。
- **[权衡]** 旧 `recentFiles` 数据不再被新编辑器使用。→ 可接受，旧数据自然淘汰。
