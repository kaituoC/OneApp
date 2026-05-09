## Context

当前 Markdown 编辑器的文件列表（`MarkdownTab.vue` 左侧面板）仅展示工作目录下 `.md` 文件，通过 `fileHelper.listFiles` 扫描目录实现。应用已使用 `electron-store` 持久化配置，包括 `recentFiles: []` 字段（`main.js:18`），但该字段尚未被使用。

渲染进程通过 `get-store` / `set-store` IPC 调用访问 electron-store。

## Goals / Non-Goals

**Goals:**
- 文件列表面板拆分为上下两个独立滚动区域
- 上半部分保持现有工作目录文件列表不变
- 下半部分展示最近打开的 50 个文件，带完整路径
- 点击最近文件时验证文件存在性，不存在则提示并移除
- 利用已有的 electron-store `recentFiles` 字段做持久化

**Non-Goals:**
- 不改变工作目录文件列表的扫描逻辑
- 不引入新的存储机制（不使用 localStorage/IndexedDB）
- 不做文件内容预加载或缩略预览

## Decisions

### 1. 存储层：复用 electron-store 的 `recentFiles` 字段

**决策**: 在 `fileHelper.js` 中新增 `getRecentFiles()` / `addRecentFile()` / `removeRecentFile()` 函数，通过已有的 `window.electronAPI.getStore()` 和 `window.electronAPI.setStore()` IPC 访问 `recentFiles`。

**理由**: 主进程已经配置了 `recentFiles: []` 默认值，且 `get-store` / `set-store` IPC 已经暴露。不需要新增 IPC Handler。

**替代方案**: 新增专用 IPC（如 `add-recent-file`），但这会增加主进程复杂度，且现有的通用 store 接口已经够用。

### 2. 最近文件数据结构

**决策**: 每条记录为对象 `{ path: string, timestamp: number }`，列表按 timestamp 降序排列（最新的在前）。

**理由**: 需要完整路径做文件存在性检查，timestamp 用于排序和去重（同一文件多次打开只保留最新记录）。

### 3. UI 布局：同一面板内上下 flex 分区

**决策**: 在现有 `.file-list` 容器内，用 flex column 将其拆分为两个子区域：`.file-list-section`（工作目录文件）和 `.recent-files-section`（最近文件），各设置 `overflow-y: auto` 实现独立滚动。

**理由**: 保持面板整体 280px 宽度不变，用户无需调整面板宽度即可获得两个列表。与当前 UI 风格一致。

**替代方案**: 弹出式/抽屉式的最近文件面板。缺点是需要额外交互步骤，不如直接可见方便。

### 4. 文件存在性检查

**决策**: 点击最近文件时，先通过 `window.electronAPI.readFile()` 尝试读取（该调用返回 `{ success, error }`），如果失败则弹出提示并从列表中移除。不单独引入 `fs.existsSync` 的 IPC。

**理由**: 避免新增 IPC Handler。读取失败即意味着文件不存在或无权访问，复用同一错误路径。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `set-store` 是整体替换还是增量更新不明确 | `main.js` 中 `set-store` 使用 `Object.entries(data).forEach(([key, value]) => store.set(key, value))`，是按键逐个设置，不会覆盖其他键 |
| 大量最近文件（50条）导致面板过长 | 上下分区各自独立滚动，不影响对方 |
| 文件路径在不同平台上格式不一致（Windows `C:\` vs Mac `/`） | 存储完整绝对路径，读取时直接使用，不拼接 |
| electron-store 的 `getStore` 返回的是深拷贝还是引用 | `get-store` 返回 `store.store` 对象（深拷贝），每次读取后修改再 `set-store` 写入是安全模式 |
