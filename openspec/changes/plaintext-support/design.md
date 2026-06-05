## Context

统一编辑器（EditorTab + useEditorFile composable）当前以 `mode` 驱动行为：`markdown` 使用 MarkdownPreview + 双向滚动同步，`html` 使用 HtmlPreview + 单向滚动同步。目录树通过 `editableExtensions` prop 按后缀过滤显示文件。

需要新增 `plaintext` mode 支持任意文本文件，同时调整目录树为显示所有文件。

## Goals / Non-Goals

**Goals:**
- 任意纯文本文件可打开、编辑、保存
- plaintext 模式无预览区，全屏编辑
- 目录树显示所有非隐藏文件
- "新建"菜单可创建纯文本文件

**Non-Goals:**
- 语法高亮（未来 P1/P2 考虑）
- 代码编辑器功能（自动缩进、括号匹配等）
- 二进制文件处理

## Decisions

### 1. mode 扩展为三值

`modeFromPath` 改为：
- `.md` → `markdown`
- `.html` / `.htm` → `html`
- 其他所有 → `plaintext`

**理由**：简单直接，未知后缀统一以纯文本处理，用户可打开任何文本文件。

### 2. plaintext 模式隐藏预览

EditorTab 中 `mode === 'plaintext'` 时：
- 不渲染预览组件
- 隐藏"显示/隐藏预览"按钮
- 隐藏"导出 HTML"、"导出 PDF"、"语法介绍"按钮
- 编辑器占满内容区

**理由**：纯文本没有预览需求，全屏编辑是最佳体验。

### 3. 目录树移除后缀过滤

FileTree 的 `editableExtensions` prop 传空数组或不传时，显示所有非隐藏文件（目录仍正常显示）。

**理由**：统一编辑器已能处理任意文本文件，目录树不应再限制用户只看到特定类型。

### 4. 新建纯文本的模板

- 默认文件名：`untitled.txt`
- 默认内容：空字符串
- 保存对话框默认后缀：`.txt`

## Risks / Trade-offs

- [风险] 用户可能尝试打开二进制文件 → 不做特殊处理，与其他编辑器行为一致（显示乱码），用户自行判断
- [风险] 目录树显示所有文件后文件数量可能很多 → 懒加载机制已存在，不影响性能；隐藏文件开关仍有效
