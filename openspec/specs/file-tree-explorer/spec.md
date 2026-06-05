# file-tree-explorer Specification

## Purpose
TBD - created by archiving change add-file-tree-explorer. Update Purpose after archive.
## Requirements
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

### Requirement: Directory entry retrieval

系统 SHALL 提供主进程能力读取指定目录的直接子项，返回每个子项的名称、绝对路径及其是否为目录，并以「文件夹优先、组内按名称升序」排序。

#### Scenario: Read directory returns typed entries
- **WHEN** 渲染层请求读取某目录
- **THEN** 系统返回该目录下每个直接子项的 `name`、`path`、`isDirectory`
- **THEN** 文件夹排在文件之前，同组内按名称升序

### Requirement: Root directory selection and switching

目录树 SHALL 默认以应用的 `workDir` 设置为根目录，并 SHALL 提供「打开文件夹」入口让用户临时切换树的根目录。

#### Scenario: Default root is workDir
- **WHEN** 用户打开编辑器且已设置 `workDir`
- **THEN** 目录树以 `workDir` 为根显示

#### Scenario: No workDir configured
- **WHEN** 未设置 `workDir`
- **THEN** 树区域显示提示，引导用户通过「打开文件夹」选择目录

#### Scenario: Switch root via open folder
- **WHEN** 用户点击「打开文件夹」并选择一个目录
- **THEN** 目录树以新选择的目录为根重新渲染

### Requirement: Type-based file filtering in tree

目录树 SHALL 显示当前根目录下的所有非隐藏文件和文件夹（不再按 `editableExtensions` 后缀过滤）。隐藏文件的显示/隐藏仍受「显示隐藏项」开关控制。

#### Scenario: Tree shows all file types
- **WHEN** 用户打开一个包含 `.md`、`.html`、`.txt`、`.js`、`.json` 文件的目录
- **THEN** 目录树显示所有这些文件（隐藏项除外）

#### Scenario: Hidden files toggle still works
- **WHEN** 用户关闭「显示隐藏项」
- **THEN** 以 `.` 开头的文件和 `node_modules` 等目录不显示

#### Scenario: Click file opens in editor
- **WHEN** 用户点击目录树中任意文件
- **THEN** 文件在编辑器中打开，`mode` 按后缀自动设置

### Requirement: Hidden item toggle

目录树 SHALL 默认隐藏以 `.` 开头的项以及 `node_modules` 等重目录，并 SHALL 提供「显示隐藏项」开关来切换其可见性。

#### Scenario: Hidden items hidden by default
- **WHEN** 用户浏览包含 `.git`、`node_modules` 的目录且未开启「显示隐藏项」
- **THEN** 这些项不显示在树中

#### Scenario: Toggle reveals hidden items
- **WHEN** 用户开启「显示隐藏项」开关
- **THEN** 以 `.` 开头的项与 `node_modules` 等重目录在树中显示
- **WHEN** 用户关闭该开关
- **THEN** 这些项重新被隐藏

### Requirement: Open file from tree

用户 SHALL 能通过点击树中的目标类型文件节点直接将其内容加载到编辑器，无需经过系统文件弹窗。

#### Scenario: Click file opens it in editor
- **WHEN** 用户点击树中某个目标类型文件节点
- **THEN** 该文件内容加载到编辑器
- **THEN** 编辑器 `mode` 按该文件后缀更新

