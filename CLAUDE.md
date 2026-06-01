# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指引。

## 项目概述

OneApp 是一个基于 Electron + Vue 3 的桌面应用程序，提供开发者工具：Markdown 编辑器、HTML 编辑器、JSON 格式化、文本差异对比和时间转换工具。Markdown / HTML 编辑器侧边栏提供懒加载目录树，可像文件管理器一样浏览目录并打开文件。

## 命令

```bash
npm run dev        # 启动开发模式（热重载）
npm run build      # 生产构建（输出到 out/）
npm run preview    # 预览生产构建
npm run dist       # 打包可分发文件（DMG/ZIP for Mac）
npm test           # 运行单元测试
npm run test:watch # 运行测试（监听模式）
npm test -- tests/jsonHelper.test.js  # 运行单个测试文件
```

## 工作流程规范

### 分支管理

- **每个需求必须创建新分支**，在新分支上进行开发，不要直接在 main 分支上修改代码
- **创建本地分支前，先拉取远程 main 分支**，确保本地 main 与远程同步，防止基于落后的代码创建分支：
  ```bash
  git checkout main && git pull origin main
  git checkout -b <branch-name>
  ```
- 分支命名约定：`feature/功能名`、`fix/问题描述`、`docs/文档`、`chore/杂项`
- 功能开发完成后通过 PR 合并到 main

### 版本管理

- **在执行 `git push` 或 `gh pr create` 之前，必须先向用户确认是否需要更新版本号**
- 新功能增加次版本号（如 1.1.0 → 1.2.0），Bug 修复增加修订号（如 1.1.0 → 1.1.1）
- 版本修改在 `package.json` 中完成

### 需求开发全流程

每个需求一条分支。完整流程是**规格驱动开发（SDD），由 OpenSpec 工具全程串起：explore → propose → apply → archive**。按改动大小**分级**执行：新功能/较大需求走完整流程，小修复/文档类走简化流程。标 **⚠️** 的步骤是**确认卡点，必须停下来征得用户同意后才能继续**；外发动作（push / 创建 PR / 合并 PR / 打 tag / 发布）一律不自作主张。

**完整流程（新功能 / 较大需求）：**

1. **探索** `/opsx:explore` — 厘清方案与关键决策
2. **提案** `/opsx:propose` — 生成 proposal / design / specs / tasks
3. **建分支** — 先 `git checkout main && git pull origin main`，再开 `feature/*`
4. **实现** `/opsx:apply` — 按 tasks 落地并逐项勾选
5. **自测（门禁，必做）** — `npm test` 全部通过（环境相关用例如时区断言，注意区分 flaky 与真回归）+ `npm run build` 编译通过（构建需关沙箱），必要时 `npm run dev` 手动验证
6. **Code Review** `/code-review`（high）— 修复高优先级问题后复跑构建与测试
7. **文档** — 同步 README / CHANGELOG / CLAUDE.md
8. **版本号 ⚠️** — push/PR 前确认是否升版本（见上「版本管理」）
9. **归档** `/opsx:archive` — delta 合并进主 specs，change 移入 `archive/`
10. **提交** — 仅在用户明确要求时提交；按主题分组 commit（feat / fix / test / docs / chore），message 末尾按规范署名
11. **Push + PR ⚠️** — 用户确认后 `git push` 并 `gh pr create`；**不擅自合并 PR**
12. **Release ⚠️（仅发版时）** — PR 合并后 `npm run dist` 构建安装包，`gh release create` 打 tag 并上传产物，release notes 取自 CHANGELOG

**简化流程（小修复 / 文档类）：** 跳过探索、提案、归档（第 1-2、9 步）；保留：建分支 → 实现 → 自测 → 文档（按需）→ 版本号 ⚠️ → 提交 → Push + PR ⚠️。

**确认卡点（⚠️）汇总：** 升版本号、`git push` / 创建 PR、打 tag、发布 release 之前必须先征得用户同意；任何情况下都不擅自合并 PR。

### 贯穿全程的硬性约定

- **沙箱**：`npm run build` / `npm run dist` / `git push` / `gh` 等构建与网络命令在沙箱内常因证书或依赖解析（如 `vue/compiler-sfc`）失败；确认是沙箱限制后在沙箱外重试（`/sandbox` 管理白名单）。`npm test` 可在沙箱内运行。
- **发布文案**：GitHub Release 的标题与 notes 用中文，notes 取自 CHANGELOG 对应版本；未签名的 macOS 包需在 notes 提示用户「右键 → 打开」绕过 Gatekeeper。
- **测试稳定性**：环境相关用例（如 `timeHelper` 时区断言）在不同时区机器上可能失败，判断 flaky 时先排除环境因素，不要误判为本次回归。
- **OpenSpec 数据卫生**：`/opsx:archive` 会把 delta 合并进主 specs；若主 spec 残留 delta 头（`## ADDED`/`## REMOVED Requirements`）会阻塞归档，需先规范化为 `# 标题 / ## Purpose / ## Requirements` 结构。

## 架构

### 进程分离

- **主进程**（`electron/main.js`）：Node.js 环境，处理文件 I/O、对话框、PDF 导出、应用内快捷键（F12 切换 DevTools）以及通过 electron-store 的应用配置
- **预加载脚本**（`preload.cjs`）：CommonJS 模块，通过 contextBridge 桥接主进程和渲染进程，暴露 `window.electronAPI`
- **渲染进程**（`src/renderer/`）：Vue 3 单页应用，使用 Composition API，纯 web 环境

### IPC 通信模式

渲染进程通过 `preload.cjs` 暴露的 API 调用主进程：
```js
// 渲染进程 (fileHelper.js)
const result = await window.electronAPI.readFile(filePath)

// 预加载 (preload.cjs)
readFile: (filePath) => ipcRenderer.invoke('read-file', filePath)

// 主进程 (main.js)
ipcMain.handle('read-file', async (event, filePath) => { ... })
```

所有 IPC handler 返回 `{ success, content/error }` 模式以保证错误处理一致。

**fileHelper.js** 封装了 IPC 调用并添加了额外逻辑（路径校验、最近文件追踪）。

### 工具模块

`src/renderer/utils/` 中的核心工具函数为纯 JavaScript，可单元测试：
- **jsonHelper.js**：formatJSON、minifyJSON、validateJSON、unescapeJSON — 均返回 `{ success, result/error }`，包含行/列错误位置
- **diffHelper.js**：diffTextUnified（git 风格）、diffTextSplit（并排对比）、diffStats — 使用 diff-match-patch 库
- **timeHelper.js**：formatDate、parseDate、timestampToDate、dateToTimestamp — 纯日期/时间戳转换
- **fileHelper.js**：IPC 封装，包含最近文件追踪和路径校验

### 构建系统

electron-vite 构建三个独立的 bundle：
- `out/main/main.js` — 主进程（ESM）
- `out/preload/preload.mjs` — 预加载脚本
- 渲染进程通过 Vite 开发服务器提供或构建到 `out/renderer/`

资源文件（`electron/assets/icon.*`）通过 `electron.vite.config.js` 中的自定义插件在构建时复制到 `out/main/assets/`。

### 核心组件

- **App.vue**：根组件，管理标签页状态、主题、字号、最近文件和键盘快捷键（Ctrl+1-6、Ctrl+Tab）
- **EditorWithLineNumbers.vue**：可复用的 textarea，带同步行号列
- **MarkdownTab.vue**：文件管理、编辑器/预览切换、滚动同步、PDF/HTML 导出
- **HtmlTab.vue**：HTML 编辑、iframe 沙箱实时预览（`HtmlPreview.vue`）、滚动同步
- **FileTree.vue / TreeNode.vue**：可复用的懒加载目录树，被 MarkdownTab 与 HtmlTab 共用，通过 `editableExtensions` prop 区分显示的文件类型
- **DiffTab.vue**：并排/统一差异视图，带滚动同步，使用 diff-match-patch 库
- **SettingsTab.vue**：平台感知快捷键（Cmd vs Ctrl），electron-store 持久化

### 应用配置

electron-store 默认值（main.js）：
```js
workDir: '',      // 默认工作目录
theme: 'dark',    // 主题偏好
fontSize: 14,     // 编辑器字号
recentFiles: []   // 最近文件历史
```

### PDF 导出机制

PDF 导出创建一个隐藏的 BrowserWindow 渲染 HTML 内容，然后使用 `printToPDF()` API。这确保了生成 PDF 前样式和布局正确。

### 样式

`main.css` 中的 CSS 变量通过 `[data-theme="light"]` 支持深色/浅色主题。主题通过在 App.vue 中通过 JS 设置 `<html>` 元素的 `data-theme` 属性来应用。

### 窗口配置

Mac 特定：`titleBarStyle: 'hiddenInset'`，header 左侧 78px 内边距用于红绿灯按钮。Dock 图标通过 `app.dock.setIcon()` 设置，应用名通过 `app.setName('OneApp')` 设置。
