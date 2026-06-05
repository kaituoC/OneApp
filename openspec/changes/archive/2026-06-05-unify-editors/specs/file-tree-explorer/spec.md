## MODIFIED Requirements

### Requirement: Lazy-loaded directory tree

系统 SHALL 在统一编辑器侧边栏提供一棵目录树，文件夹节点在首次展开时才读取其直接子项（懒加载），不一次性递归整个目录。

#### Scenario: Expand a folder node loads its children
- **WHEN** 用户点击树中某个折叠的文件夹节点
- **THEN** 系统读取该文件夹的直接子项并在其下展开渲染
- **THEN** 未被展开的子文件夹不会被提前读取

#### Scenario: Collapse a folder node
- **WHEN** 用户点击某个已展开的文件夹节点
- **THEN** 该节点收起，其子项从视图中隐藏

#### Scenario: Folder read failure
- **WHEN** 读取某文件夹子项失败（如无权限）
- **THEN** 该节点显示错误状态而不致应用崩溃

### Requirement: Type-based file filtering in tree

目录树 SHALL 只显示文件夹以及统一编辑器当前 `mode` 对应的可编辑类型文件：`markdown` 模式显示 `.md`，`html` 模式显示 `.html` 与 `.htm`。其它类型文件不显示。

#### Scenario: Markdown mode shows only .md files
- **WHEN** 统一编辑器处于 `markdown` 模式，用户在目录树中浏览某文件夹
- **THEN** 树中显示子文件夹与 `.md` 文件，不显示其它扩展名文件

#### Scenario: HTML mode shows only .html/.htm files
- **WHEN** 统一编辑器处于 `html` 模式，用户在目录树中浏览某文件夹
- **THEN** 树中显示子文件夹与 `.html` / `.htm` 文件，不显示其它扩展名文件

### Requirement: Open file from tree

用户 SHALL 能通过点击树中的目标类型文件节点直接将其内容加载到编辑器，无需经过系统文件弹窗。

#### Scenario: Click file opens it in editor
- **WHEN** 用户点击树中某个目标类型文件节点
- **THEN** 该文件内容加载到编辑器
- **THEN** 编辑器 `mode` 按该文件后缀更新

## REMOVED Requirements

### Requirement: Recent folders quick switch
**Reason**: 目录树「最近文件夹」下拉快速切换功能（功能③）移除，简化合并后的侧栏。`recentFolders` store 与相关 API 一并删除。
**Migration**: 仍可通过「打开文件夹」入口切换目录树根目录（见 "Root directory selection and switching"），但不再保留最近文件夹历史。
