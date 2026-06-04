# 更新日志 (Changelog)

本文档记录 OneApp 的所有重要更新。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

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

**[1.4.3]**: 2026-06-04 - 修复 DMG 缺少 Applications 快捷方式
**[1.4.2]**: 2026-06-04 - 修复 CI macOS 包 ad-hoc 签名
**[1.4.1]**: 2026-06-04 - 修复 CI macOS 包 Gatekeeper 报损问题（未生效）
**[1.4.0]**: 2026-06-02 - CI 多平台自动发布
**[1.3.0]**: 2026-06-01 - 文件目录树浏览
**[1.2.0]**: 2026-05-13 - HTML 编辑器 + 最近文件按类型隔离
**[1.1.0]**: 2026-05-10 - Markdown 最近打开文件 + 系统对话框打开文件
**[1.0.0]**: 2026-04-19 - 首次公开发布
