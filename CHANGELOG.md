# 更新日志 (Changelog)

本文档记录 OneApp 的所有重要更新。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.10.0] - 2026-06-24

### 🎨 优化
- 统一 Editor、JSON、Diff、Regex、Encode、Time、Settings 和 Agent Workshop 内部 tool surface：panel、command bar、segmented control、status chip、empty state 与 copy feedback 采用一致视觉语言。
- Editor file tree、toolbar 和 tree node 全面替换为 lucide icon，空文档默认不占用 Preview 空间，DevTools 占用宽度或 compact 场景下不再把 file tree 压成不可读竖条。
- Encode 工具完成重点 polish：子工具导航更清晰，Base64 / URL / Unicode 双向转换面板一致，JWT / Hash / 进制结果更结构化且便于复制。
- Diff、Regex、Time 和 Settings 优化结果摘要、错误/成功反馈、复制提示、最近文件长路径展示与窄宽度布局。
- Agent Workshop 增加历史/终态记录提示区，优化 setup、progress、timeline 和窄宽度布局，但不改变底层 workflow、IPC、只读约束或记录持久化语义。

### 🧪 测试
- 完整通过 `npm test`（13 个测试文件、179 个用例）。
- 完整通过 `npm run build` 与 `openspec validate polish-tool-surfaces --strict`。
- 完成 light/dark、正常宽度、DevTools 占用宽度和 compact 宽度视觉烟测。

---

## [1.9.0] - 2026-06-24

### ✨ 新增
- 全面刷新 workbench shell：将原横向 tab bar 升级为分组左侧 navigation，支持工作区编辑、数据处理、文本调试、AI 和系统设置分组。
- 引入 `lucide-vue-next` icon library，为一级工具入口和紧凑控件提供一致的图标辅助识别。
- 将 Agent Workshop 提升为 AI 分组下的核心入口，同时保持原有本地 repo 研讨 workflow 不变。
- 新增 `AGENTS.md`，并同步 `CLAUDE.md` 中的需求开发全流程、文档语言规则和自动推进模式。

### 🎨 优化
- 优化 Editor 首屏布局：新建空文档默认隐藏 Preview，优先展示 file tree 和 editor panel，避免三栏同时挤压。
- Editor file tree 增加可读最小宽度，横向空间不足时不再被压缩成不可用竖条。
- 优化 JSON、Diff、Regex、Encode、Time、Settings 和 Agent Workshop 的 panel、command bar、status feedback 与 responsive fallback。
- 左侧 navigation 支持 compact 模式，收起后仅保留工具 icon、快捷键提示和 tooltip 信息。
- 优化 dark/light theme token，统一 surface、border、focus、semantic state 和底部 status bar 表现。

### 🐛 修复
- 修复打开文件对话框取消或读取失败时，Editor Preview 会基于旧文件状态被误重新打开的问题。
- 清理未使用的全局 tool panel/chip/icon button CSS，降低后续维护误导。

### 🧪 测试
- 新增 navigation metadata 测试，确保导航说明短文案和 tooltip 可用。
- 新增 editor file 测试，覆盖取消打开文件和读取失败时的返回值与状态保持。

---

## [1.8.0] - 2026-06-22

### ✨ 新增
- 新增「Agent 研讨室」工具标签（位列「编码」与「设置」之间，Ctrl+7 直达，设置顺延为 Ctrl+8），工具标签总数 7 → 8
- 让多个本地 AI 编码 agent（V1 支持 Codex 与 ClaudeCode）在**只读**模式下独立审视本地仓库，交叉评审后由主持 agent 汇总出实现方案：
  - 固定流程：第一轮独立提案 → 第二轮交叉评审（单 agent 时为自我评审，仅第一轮成功的 agent 进入第二轮）→ 主持 agent 最终汇总
  - **只读安全（主防线）**：Codex 内核级只读沙箱 + ClaudeCode plan 模式与只读工具白名单强制只读；每阶段 `git status` 快照比对为**咨询式二次防线**，发现工作区变化仅提示、不中断研讨
  - **输出安全渲染**：Agent 输出经 marked + DOMPurify 消毒后再渲染，剥离 `<script>` / `on*` 事件属性 / `javascript:` 链接，外链强制 `target=_blank` + `rel=noopener`
  - 自动检测两个 CLI 的安装与登录态（`claude auth status` / `codex login status`），仅「就绪」的 agent 可参与，未登录会给出登录提示
  - 启动校验在主进程侧复核（不信任渲染层参数）并互斥单次研讨；编排异常兜底为 `failed`，不会卡在「进行中」
  - 研讨记录本地持久化、可恢复查看、可导出为 Markdown；开始前提示预计调用次数与首次成本
  - 平台支持：目前仅 macOS / Linux，Windows 暂显示「暂不支持」

---

## [1.7.0] - 2026-06-06

### ✨ 新增
- 新增「编码」工具标签（位列「正则」与「设置」之间，Ctrl+6 直达，设置顺延为 Ctrl+7），工具标签总数 6 → 7
- 标签内左侧菜单切换 6 个子工具，纯前端离线、零数据外传：
  - **Base64**：文本 ⇄ Base64，经 UTF-8 正确支持中文 / emoji
  - **URL**：文本 ⇄ URL 编码（`encodeURIComponent` / `decodeURIComponent`）
  - **JWT**：解码展示 Header / Payload / Signature 三段，`exp` / `iat` / `nbf` 附人类可读时间（不验签）
  - **Hash**：一次性输出 MD5 / SHA-1 / SHA-256 / SHA-512（hex 小写）
  - **进制**：Dec / Hex / Oct / Bin 四框联动，基于 BigInt 支持任意大非负整数
  - **Unicode**：文本 ⇄ 转义，格式三选一（`\u` / `\u{}` / HTML 实体），正确处理 emoji 代理对
- 编解码类工具采用「左源右果 + ⇄ 方向切换」实时计算，各结果支持一键复制，非法输入就地红字提示

### 🎨 其他
- 测试：在 `vitest.config.js` 钉死时区为 `Asia/Shanghai`，消除 `timeHelper` 绝对时间戳断言在非 UTC+8 机器上的 flaky 失败

---

## [1.6.0] - 2026-06-06

### ✨ 新增
- 新增「正则」工具标签（位列时间工具与设置之间，Ctrl+5 直达，设置顺延 Ctrl+6），提供正则表达式实时测试
- 结构化输入 `/ pattern / [g][i][m][s][u][y]`，flags 为可点击方块；正则非法时就地红字提示
- 测试文本「编辑 / 高亮预览」左右分栏，匹配片段染色，多个捕获组用不同颜色
- 底部匹配结果列表（序号、位置、匹配值、各捕获组值），与预览高亮双向 hover 联动，支持「复制全部」
- 右侧可收起「速查」抽屉：常用模式（点击填入）、语法元字符（点击插入光标处）、flags 说明
- 正则匹配在 Web Worker 中执行，主线程超时（1.5s）兜底并 `terminate`，彻底杜绝灾难性回溯冻结界面

---

## [1.5.1] - 2026-06-05

### ✨ 新增
- 统一编辑器支持打开任意纯文本文件（`.txt`、`.css`、`.js`、`.xml` 等），plaintext 模式无预览、全屏编辑
- "新建"下拉菜单增加「新建纯文本」选项（默认 `untitled.txt`）
- 目录树显示所有非隐藏文件，不再按后缀过滤
- 系统打开文件对话框新增"所有文件"过滤选项

---

## [1.5.0] - 2026-06-05

### ✨ 新增
- 新增统一编辑器（`EditorTab`），合并原 Markdown 与 HTML 两个独立编辑器，按当前文件后缀（`.md` / `.html` / `.htm`）自动切换编辑与预览模式
- 工具栏「新建」改为下拉，可分别新建 Markdown 或 HTML 文件
- 标签页总数 6 → 5，Ctrl+1-5 对应：编辑器 / JSON 工具 / 文本对比 / 时间工具 / 设置

### 🗑 移除
- **移除编辑器侧栏「最近打开文件」**（Markdown 与 HTML 编辑器侧边栏底部的可折叠最近文件列表）；设置页的「最近文件」列表不受影响，保留不变
- **移除目录树「最近文件夹」下拉**（目录树顶部 ▾ 快速切换文件夹功能）；「打开文件夹」入口保留

### 🐛 修复
- 修复键盘快捷键监听在标签页切换后泄漏、重复触发的问题（改为组件挂载/卸载时动态绑定）

---

## [1.4.5] - 2026-06-04

### 🐛 修复
- 修复 Markdown / HTML 编辑器侧边栏「最近打开」展开后高度过小、列表几乎不可见的问题：展开时保证至少 160px 可视高度，文件较多时最多占侧栏 40% 并内部滚动

---

## [1.4.4] - 2026-06-04

### ✨ 新增功能
- macOS DMG 安装体验全面优化：自定义浅灰色背景、弧形箭头引导、"拖入 Applications 安装"文字提示、正确的 Applications 文件夹图标、无侧边栏干净窗口
- 新增 `scripts/create-dmg.sh` 脚本，使用 HFS+ 格式 + AppleScript 创建专业 DMG（替代 electron-builder 的 APFS DMG，解决 APFS 不支持自定义背景的问题）
- 新增 `scripts/generate-dmg-background.py` 背景图生成脚本，支持 1x/2x Retina

### 🐛 修复
- 修复 CI macOS 安装包 Gatekeeper 报"已损坏"（ad-hoc 签名）、DMG 缺少 Applications 快捷方式、Applications 显示为黑框等系列问题

---

## [1.4.3] - 2026-06-04

### 🐛 修复
- 修复 CI 生成的 DMG 缺少 Applications 快捷方式的问题，恢复拖拽安装体验

---

## [1.4.2] - 2026-06-04

### 🐛 修复
- 修复 CI 构建的 macOS 安装包 Gatekeeper 报"已损坏，无法打开"的问题：CI 打包后增加 `codesign --sign -` ad-hoc 签名步骤，并重新生成 DMG/ZIP；用户下载后只需在系统安全设置中点击"仍要打开"即可

---

## [1.4.1] - 2026-06-04

### 🐛 修复
- （未生效）尝试通过 CSC_IDENTITY_AUTO_DISCOVERY=true 修复 macOS 签名，但 electron-builder 在无证书环境下会跳过签名而非 fallback 到 ad-hoc

---

## [1.4.0] - 2026-06-02

### ✨ 新增功能

#### CI 多平台自动发布
- 打 `vX.Y.Z` tag 通过 GitHub Actions 自动构建 macOS（Intel + Apple Silicon）/ Windows / Linux 安装包并发布 GitHub Release
- 构建前校验 tag 与 `package.json` 版本一致，防止误发
- Release notes 自动取自 CHANGELOG 对应版本段；支持 `workflow_dispatch` 手动验证构建

### ♻️ 变更
- 安装包命名改为含平台架构：`OneApp-<版本>-<os>-<arch>.<ext>`（如 `OneApp-1.4.0-mac-arm64.dmg`）
- 新增 `dist:mac` / `dist:win` / `dist:linux` 打包脚本

---

## [1.3.0] - 2026-06-01

### ✨ 新增功能

#### 文件目录树
- Markdown / HTML 编辑器侧边栏新增懒加载目录树，可像文件管理器一样浏览子目录
- 「打开文件夹」一键切换目录根，无需进设置或反复走系统弹窗
- 记忆最近打开的文件夹，下拉快速切换（Markdown 与 HTML 共享）
- 目录树仅显示文件夹与当前编辑器可编辑类型文件（Markdown → `.md`，HTML → `.html`/`.htm`）
- 「显示隐藏项」开关，默认隐藏 `.` 开头的文件与 `node_modules` 等重目录
- 「最近打开文件」改为侧边栏底部可折叠区域，默认收起

### ♻️ 重构
- 抽出可复用的 `FileTree` / `TreeNode` 组件，供 Markdown 与 HTML 编辑器共用
- 移除已废弃的 `list-files` / `list-html-files` IPC（由 `read-dir` 取代）

---

## [1.2.0] - 2026-05-13

### ✨ 新增功能

#### HTML 编辑
- 新增 HTML 编辑器标签页，编辑 + iframe 沙箱实时预览
- HTML 文件管理：打开、新建、保存
- 编辑器与预览滚动同步

#### 最近文件
- 最近打开文件列表按类型隔离，Markdown 与 HTML 各自独立维护

### 🐛 修复
- 修复工作目录文件被误加入最近文件列表的问题

---

## [1.1.0] - 2026-05-10

### ✨ 新增功能

#### Markdown 编辑
- 最近打开文件记录：自动追踪最近 50 个文件，支持快速重开
- 系统文件对话框：打开工作目录外的任意 `.md` 文件

#### 快捷键
- F12 切换开发者工具（应用级快捷键）

---

## [1.0.0] - 2026-04-19

### ✨ 新增功能

#### Markdown 编辑
- 实时预览，支持 GFM 语法
- 文件管理：新建、打开、保存、删除
- 导出为 HTML 和 PDF
- 编辑器行号显示
- 滚动同步（编辑区与预览区）
- 可隐藏编辑器或预览区
- Markdown 语法帮助弹窗

#### JSON 工具
- JSON 格式化（美化）
- JSON 压缩（最小化）
- JSON 验证（语法检查，定位错误行/列）
- JSON 反转义处理
- 语法高亮显示

#### 文本对比
- 并排对比模式：左右对照显示差异
- 统一对比模式：类似 git diff 格式
- 差异统计：新增、删除、修改行数
- 支持水平/垂直滚动同步
- 左右文本交换功能

#### 时间工具
- 实时显示当前时间和时间戳
- 时间戳转日期（支持秒/毫秒，多种输出格式）
- 日期转时间戳（同时输出秒和毫秒）
- 一键复制结果

#### 应用设置
- 深色/浅色主题切换
- 编辑器字体大小调节
- 最近文件列表
- 工作目录配置
- 平台感知快捷键显示（Cmd vs Ctrl）

### 🔒 安全
- 添加 Content-Security-Policy (CSP) 策略
- 隐私信息审查通过（无敏感数据）

### 📦 技术栈
- Electron 28
- Vue 3 (Composition API)
- electron-vite 构建工具
- marked (Markdown 解析)
- diff-match-patch (文本对比)
- CodeMirror 6 (JSON 编辑器)
- electron-store (配置持久化)

### 📝 文档
- 完整 README 使用说明
- 添加 install.sh 自动化安装脚本
- CLAUDE.md AI 助手指南

---

## 版本说明

### 语义化版本格式

- **MAJOR.MINOR.PATCH** (主版本号。次版本号。修订号)
- **MAJOR**: 不兼容的 API 变更
- **MINOR**: 向后兼容的功能新增
- **PATCH**: 向后兼容的问题修复

### 更新类型

- `✨ 新增` - 新功能
- `🐛 修复` - Bug 修复
- `🔒 安全` - 安全相关更新
- `📝 文档` - 文档更新
- `🎨 样式` - 代码格式/样式调整
- `♻️ 重构` - 代码重构
- `⚡ 性能` - 性能优化
- `📦 构建` - 构建系统/外部依赖更新

---

**[1.4.4]**: 2026-06-04 - macOS DMG 安装体验全面优化
**[1.4.3]**: 2026-06-04 - 修复 DMG 缺少 Applications 快捷方式
**[1.4.2]**: 2026-06-04 - 修复 CI macOS 包 ad-hoc 签名
**[1.4.1]**: 2026-06-04 - 修复 CI macOS 包 Gatekeeper 报损问题（未生效）
**[1.4.0]**: 2026-06-02 - CI 多平台自动发布
**[1.3.0]**: 2026-06-01 - 文件目录树浏览
**[1.2.0]**: 2026-05-13 - HTML 编辑器 + 最近文件按类型隔离
**[1.1.0]**: 2026-05-10 - Markdown 最近打开文件 + 系统对话框打开文件
**[1.0.0]**: 2026-04-19 - 首次公开发布
