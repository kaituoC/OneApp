## Why

当前 Markdown 编辑器的文件列表仅展示工作目录下的 `.md` 文件，缺少对最近打开过文件的追踪能力。用户关闭应用后无法快速重新打开曾经编辑过的文件（尤其是非工作目录下的文件），降低了使用效率。

## What Changes

- 文件列表面板拆分为上下两个区域
- 上半部分：保持现有工作目录文件列表功能不变
- 下半部分：新增「最近打开」区域，显示最近打开过的文件路径+文件名，最多展示 50 条
- 点击最近文件记录时，若文件仍存在则打开；若文件已不存在，提示"文件不存在"并从列表中移除
- 上下两区域各自独立纵向滚动，文件数量多时可分别滚动浏览

## Capabilities

### New Capabilities
- `recent-files-tracking`: 最近打开文件记录的持久化存储、展示、以及失效文件自动清理

### Modified Capabilities
- `markdown-file-list`: 文件列表面板布局变更，增加下半部分区域，要求两区域各自独立滚动

## Impact

- `src/renderer/components/MarkdownTab.vue`: 模板和样式变更，文件列表区域拆分为上下两部分
- `src/renderer/utils/fileHelper.js`: 新增最近文件的读写管理逻辑，使用 electron-store 持久化
- `electron/main.js`: 可能需要扩展 electron-store 配置以支持 recentFiles 字段
- 新增持久化机制：利用已有的 electron-store 实例存储最多 50 条最近打开文件记录
