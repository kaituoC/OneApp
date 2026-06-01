## Context

OneApp 是 Electron + Vue 3 桌面应用。当前 Markdown / HTML 编辑器侧边栏由两块固定上下分栏构成：上半区是 `workDir` 下的一层平铺文件（`list-files` / `list-html-files` 只 `readdirSync` 一层并按扩展名过滤），下半区是「最近打开文件」。切换浏览目录只能改设置或走系统弹窗。

两个 Tab（`MarkdownTab.vue`、`HtmlTab.vue`）的侧边栏结构目前几乎完全重复，差异仅在「目标扩展名」与最近文件存储键（`recentMdFiles` / `recentHtmlFiles`）。这是抽取共用组件的好时机。

## Goals / Non-Goals

**Goals:**
- 侧边栏内提供可展开 / 折叠的懒加载目录树，免弹窗浏览与打开文件。
- 支持快速切换根目录（默认 `workDir` + 「打开文件夹」+ 最近文件夹下拉）。
- Markdown / HTML 两个 Tab 共用同一棵树组件，按 prop 区分目标扩展名。
- 大目录（`node_modules` 等）不拖垮性能。

**Non-Goals:**
- 不做文件操作（新建 / 重命名 / 删除 / 拖拽移动）。
- 不做多根「工作区」（VS Code workspace 式多文件夹根）。
- 不改变「最近打开文件」的持久化结构、按类型隔离与失效校验逻辑。
- 不做文件内容搜索 / 全文检索。

## Decisions

### 决策 1：懒加载 vs 一次性递归
**选择懒加载**——每个文件夹节点在首次展开时调用 `read-dir` 读取其直接子项。
- 理由：一次性递归整棵树在大目录（`node_modules`）下会卡死、内存暴涨。懒加载只在用户展开时付出代价。
- 备选：构建时递归全树（被否，性能不可控）。

### 决策 2：新增 `read-dir` IPC，而非扩展 `list-files`
主进程新增 `read-dir`：`fs.readdirSync(path, { withFileTypes: true })`，返回 `[{ name, path, isDirectory }]`，排序规则为「文件夹优先，组内按名称升序」。
- 过滤交给**渲染层**：是否隐藏 dotfiles / `node_modules`、按目标扩展名过滤，都由 `FileTree` 根据 prop 决定。主进程只负责忠实返回目录条目 + 类型，保持通用、无业务耦合。
- 现有 `list-files` / `list-html-files` 在树接入后预计不再被引用；本次保留（降低回归风险），是否删除留到后续清理。

### 决策 3：组件结构 `FileTree.vue` + 递归 `TreeNode.vue`
- `FileTree.vue`：树容器，持有根路径、根目录切换 UI、「显示隐藏项」开关、最近文件夹下拉；向上 emit `open-file`。
- `TreeNode.vue`：单个节点，自身递归渲染子节点，管理「展开 / 折叠 / 加载中」局部状态，展开时调 `readDir`。
- props 透传：`editableExtensions`（如 `['md']` 或 `['html','htm']`）、`showHidden`。
- 两个 Tab 仅传入不同的 `editableExtensions`，复用同一套逻辑。

### 决策 4：隐藏项过滤规则
默认隐藏：①以 `.` 开头的项；②目录名命中重目录黑名单（初始为 `node_modules`）。
- 「显示隐藏项」开关打开时，①②全部显示。
- 黑名单做成常量数组，便于后续扩充（如 `.git`、`dist`）。`.git` 已被规则①覆盖。

### 决策 5：树只显示文件夹 + 目标类型文件
- 文件夹：始终显示（受隐藏规则约束）。
- 文件：仅当扩展名 ∈ `editableExtensions` 才显示，其余文件不渲染。
- 副作用：纯资源文件夹（只含图片）会显示为可展开但内部为空的文件夹——可接受。

### 决策 6：最近文件夹共享存储
新增 store 键 `recentFolders`（数组，结构对齐最近文件：`{ path, timestamp }`，上限 50、去重、最新置顶），Markdown / HTML 通用。
- 理由：目录是「项目级」概念，跨编辑器类型共享更符合直觉。
- 与现有按类型隔离的 `recentMdFiles` / `recentHtmlFiles` 并存，互不影响。
- 写入时机：用户通过「打开文件夹」或最近文件夹下拉切换根目录成功时。

### 决策 7：「最近打开文件」改为底部可折叠区
- 树占满侧边栏主体；「最近打开文件」移到底部，默认收起，点击标题展开。
- 复用现有最近文件的读取、tooltip、失效移除逻辑，仅改变容器布局与默认折叠态。

## Risks / Trade-offs

- **超大 / 慢速目录展开卡顿** → 懒加载 + `node_modules` 默认隐藏；`read-dir` 失败（无权限等）返回错误，节点显示错误态而非崩溃。
- **符号链接成环导致无限展开** → 懒加载下需用户逐层手动展开，自然限制；不主动跟随 / 递归解析 symlink。
- **根目录切换后树状态（展开项）重置** → MVP 接受重置；不持久化展开状态。
- **两个 Tab 共用组件引入回归** → 通过 prop 严格区分扩展名，保留旧 IPC 作为安全网，分别在两个 Tab 验证。
- **`read-dir` 返回路径分隔符跨平台差异** → 主进程用 `path.join` 拼接子项绝对路径，避免渲染层手拼 `/`。
