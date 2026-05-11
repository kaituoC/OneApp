## Context

当前 Markdown 编辑器的文件打开入口只有左侧文件列表（工作目录扫描），`fileHelper.js` 中已经存在 `openFile(defaultDirectory)` 函数，它通过 `showOpenDialog` IPC 唤起系统文件选择器，返回选中文件的绝对路径。`readFile()` 函数已经集成了 `addRecentFile()` 自动记录。

## Goals / Non-Goals

**Goals:**
- 工具栏增加「打开文件」按钮，唤起系统文件对话框
- 打开的文件自动加入最近打开列表
- 复用已有的 `openFile()` 和 `readFile()` 函数

**Non-Goals:**
- 不修改文件过滤规则（仍限制 `.md` 文件）
- 不改变工作目录文件列表的行为
- 不处理多文件打开场景

## Decisions

### 1. 按钮位置：工具栏，「显示列表」按钮之后

**决策**: 在现有工具栏按钮序列中插入「打开文件」按钮，位置排在布局控制按钮之后。

**理由**: 布局按钮属于视图切换，文件操作属于功能动作，按语义分组排列更直观。

### 2. 复用 `openFile()` + `readFile()` 组合

**决策**: 组件中调用 `openFile(workDir)` → 拿到路径 → 调用已有的 `readFile(path)`。

**理由**: `readFile` 内部已经自动调用 `addRecentFile`，非工作区文件自动进入最近打开列表，满足需求。`openFile` 函数也已存在，无需新增 IPC。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 用户取消了文件选择 | `openFile()` 返回 `null`，不做任何处理 |
| 大文件打开导致卡顿 | 与现有文件列表打开行为一致，不额外处理 |
