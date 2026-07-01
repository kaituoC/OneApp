# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指引。

## 项目概述

OneApp 是一个基于 Electron + Vue 3 的桌面应用程序，提供开发者工具：统一编辑器（按文件后缀自动切换 Markdown / HTML / 纯文本模式）、JSON / YAML 工具、文本差异对比、文本处理、生成器（UUID / 随机密码 / Lorem）、时间转换、正则测试、编码工具合集（Base64 / URL / JWT / Hash / 进制 / Unicode）和 Agent 研讨室（多个本地 AI agent 在只读模式下研讨本地仓库并汇总实现方案）。编辑器侧边栏提供懒加载目录树，可像文件管理器一样浏览目录并打开文件。

## 命令

```bash
npm run dev        # 启动开发模式（热重载）
npm run build      # 生产构建（输出到 out/）
npm run preview    # 预览生产构建
npm run dist       # 构建并打包（electron-builder 三平台 target；单平台用 dist:mac/win/linux）
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

版本号遵循 [Semantic Versioning](https://semver.org/)，无需人工单独确认：

| 改动类型 | 版本位 | 示例 |
|----------|--------|------|
| 重量级功能、架构重设计、大范围破坏性变更 | 大版本 X | 1.x.x → 2.0.0 |
| 新功能、较大功能改动、中等破坏性变更 | 中间版本 Y | 1.4.x → 1.5.0 |
| Bug 修复、小改动、文档、样式微调 | 小版本 Z | 1.4.4 → 1.4.5 |

- 版本修改在 `package.json` 中完成，CHANGELOG 同步更新
- **时机**：所有代码/文档改动完成、自测通过后，在 `git push` 前统一升版本号并提交
- **不升版本的情况**：纯文档修正（README / CLAUDE.md / ROADMAP 等与代码功能无关的更新）、流程规范调整、CI 配置微调等不影响应用功能的变更无需升版本号

### 需求开发全流程

每个需求一条分支。完整流程是**规格驱动开发（SDD），由 OpenSpec 工具全程串起**；工程顺序为：explore → 建分支 → propose → apply → archive。按改动大小**分级**执行：新功能/较大需求走完整流程，小修复/文档类走简化流程。非自动推进模式下，外发动作（push / 创建 PR / 合并 PR / 打 tag / 发布）仍需用户明确请求；自动推进模式下，最终验证通过后可直接执行本地提交、push、创建 PR、合并 PR、打 tag 和发布 Release，但执行每个外发动作时必须明确告知用户。

**完整流程（新功能 / 较大需求）：**

1. **探索** `/opsx:explore` — 厘清方案与关键决策
2. **建分支** — 在执行 `/opsx:propose` 前创建需求分支。先确保当前工作区干净；若存在未提交改动，先停下来让用户决定提交、暂存、stash 或换分支。然后 `git checkout main && git pull origin main`，再开 `feature/*`
3. **提案** `/opsx:propose` — 在新分支上生成 proposal / design / specs / tasks，确保 OpenSpec 变更文件从创建开始就属于需求分支
4. **实现** `/opsx:apply` — 按 tasks 落地并逐项勾选
5. **自测（门禁，必做）** — `npm test` 全部通过（环境相关用例如时区断言，注意区分 flaky 与真回归）+ `npm run build` 编译通过（构建需关沙箱），必要时 `npm run dev` 手动验证
6. **Code Review** `/code-review`（high）— 修复高优先级问题后复跑构建与测试
7. **归档** `/opsx:archive` — delta 合并进主 specs，change 移入 `archive/`；归档后运行 `openspec validate --specs --strict`
8. **文档收尾** — 同步 README / CLAUDE.md / AGENTS.md 等项目文档；不要在这里重复维护发布版本记录
9. **版本与 CHANGELOG** — 所有改动就绪后，根据语义化版本升级 `package.json` 版本号，并更新 CHANGELOG
10. **最终验证** — 版本、CHANGELOG、归档和文档都就绪后，再跑一次 `npm test` + `npm run build`
11. **提交** — 按主题分组 commit（feat / fix / test / docs / chore），message 末尾按规范署名；自动推进模式下最终验证通过后可直接本地提交，执行前需告知用户
12. **Push + PR + 合并** — 自动推进模式下最终验证通过后可直接 `git push`、`gh pr create` 并合并 PR；非自动推进模式下需用户明确请求。每个外发动作执行前需告知用户
13. **Release（仅发版时）** — PR 合并后，以下步骤作为**完整的发布序列**一次性执行；自动推进模式下无需再次确认，但执行打 tag、推送 tag、等待 CI、补传 Intel 包等动作前需告知用户：
    1. 确认 `package.json` 版本号与 CHANGELOG 就绪；正式打 tag 前可用 `workflow_dispatch` 手动触发验证 CI 三平台构建（仅 build、不创建 Release）。
    2. 打 `vX.Y.Z` tag 并 `git push origin vX.Y.Z` → GitHub Actions（`.github/workflows/release.yml`）自动构建 **mac arm64 / Windows / Linux** 三平台并创建 GitHub Release（notes 取自 CHANGELOG 对应版本段）。tag 与 package.json 版本不一致时 CI 会失败。
    3. **mac Intel(x64) 包补传（必做，无需额外确认）**：先用 `uname -m` 自检当前机器架构（x86_64 = Intel，arm64 = Apple Silicon）；若为 Intel，在 CI 跑包期间并行执行 `npm run dist:mac` 本地打包，CI 完成/Release 创建后立即执行 `gh release upload vX.Y.Z dist/OneApp-X.Y.Z-mac-x64.dmg dist/OneApp-X.Y.Z-mac-x64.zip` 补传。架构判断由 Claude 自行完成，不询问用户。
    - **不再**本地手动 `npm run dist` 全量打包 + `gh release create`（发布由 CI 负责，本地仅补 Intel 包）。

**简化流程（小修复 / 文档类）：** 跳过探索、提案、归档；保留：建分支 → 实现 → 自测/校验 → 文档（按需）→ 版本与 CHANGELOG（仅影响功能或发布时）→ 最终验证 → 提交 → Push + PR。

**确认卡点汇总：** 自动推进模式下，本地提交、`git push`、创建 PR、合并 PR、打 tag 和发布 Release 不再需要人工确认，但必须在执行动作时明确告知用户，并且必须建立在最终验证通过的基础上；非自动推进模式下，这些外发动作仍需用户明确请求。版本号升级不是独立确认卡点，在 push 前自动完成。

### 自动推进模式

自动推进模式用于把需求确认后的本地开发流程交给 agent 连续执行，减少用户在机械步骤上的介入。默认不启用；只有当用户明确表达「进入自动推进模式」「按流程自动推进」「方案确认，继续自动执行」等授权时才启用。

启用自动推进前，agent 必须在 explore 阶段给出并获得用户确认：

- 需求范围与不做范围
- 建议 change name 与 branch name
- 预计流程类型：完整流程或简化流程
- 验收标准与必须执行的验证命令
- 版本影响预估：不升版本、patch、minor 或 major
- 自动推进将包含本地提交、push、PR、合并和发布 Release；执行这些动作前 agent 必须明确告知用户

自动推进模式下，agent 可以在无需再次询问的情况下执行本地动作：

- 检查工作区状态，并在干净工作区上创建需求分支
- 执行 `/opsx:propose` 生成 OpenSpec 文件
- 执行 `/opsx:apply` 实现 tasks，并逐项勾选
- 运行相关测试、`npm test`、`npm run build` 和必要的本地 UI smoke test
- 运行 code review，修复明确的问题并复跑验证
- 执行 `/opsx:archive`，同步主 specs 并归档 change
- 更新项目文档、版本号和 `CHANGELOG.md`
- 在所有收尾完成后执行最终验证
- 最终验证通过后创建本地 commit
- 告知用户后执行 `git push`、创建 PR、合并 PR
- 发版需求在 PR 合并后，告知用户并执行 tag、推送 tag、等待 CI Release 和必要的 mac Intel(x64) 包补传

自动推进模式下，遇到以下情况必须暂停并请求用户介入：

- 工作区存在非本需求产生的未提交改动，或无法判断改动归属
- 需要改变已确认的需求范围、方案方向、branch name 或 change name
- OpenSpec delta 与主 specs 冲突，无法无歧义同步
- 测试或构建失败，且原因不是明确的本次代码回归或可直接修复的问题
- code review 提出架构级分歧、产品取舍或高风险改动
- 需要升 major version，或版本影响和 explore 阶段预估不一致
- 需要新增/变更 CI、发布流程、权限、安全边界或外部服务配置
- 需要访问敏感凭证、付费资源、外部账号或用户本机隐私数据
- 需要删除分支、丢弃改动、覆盖远端历史、强推、改写 tag 或执行其他破坏性动作

自动推进的停止条件：

- 成功：本地实现、归档、版本/CHANGELOG、最终验证、commit、push、PR、合并和 Release（如需发版）全部完成。
- 受阻：出现必须用户介入的情况；agent 汇报当前状态、已完成事项、阻塞原因和可选方案。
- 失败：验证无法通过或方案不可行；agent 保留现场，不回滚用户或未知来源改动，并给出下一步建议。

### 贯穿全程的硬性约定

- **沙箱**：`npm run build` / `npm run dist` / `git push` / `gh` 等构建与网络命令在沙箱内常因证书或依赖解析（如 `vue/compiler-sfc`）失败；确认是沙箱限制后在沙箱外重试（`/sandbox` 管理白名单）。`npm test` 多数可在沙箱内运行，但 `tests/safeMarkdown.test.js` 用 jsdom 环境，会加载 `parse5/dist/common/token.js` 等被沙箱 `*token*` 读取拒绝规则命中的文件而导致 worker 启动失败——跑含 DOM 环境的完整测试需在沙箱外执行。
- **发布文案**：GitHub Release 的标题与 notes 用中文，notes 取自 CHANGELOG 对应版本；未签名的 macOS 包需在 notes 提示用户「右键 → 打开」绕过 Gatekeeper。
- **测试稳定性**：环境相关用例（如 `timeHelper` 时区断言）在不同时区机器上可能失败，判断 flaky 时先排除环境因素，不要误判为本次回归。
- **OpenSpec 数据卫生**：`/opsx:archive` 会把 delta 合并进主 specs；若主 spec 残留 delta 头（`## ADDED`/`## REMOVED Requirements`）会阻塞归档，需先规范化为 `# 标题 / ## Purpose / ## Requirements` 结构。
- **流程文档同步**：如果调整需求开发流程，必须同步更新 `AGENTS.md` 与 `CLAUDE.md`，避免 Codex 和 ClaudeCode 按不同流程执行。

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

**fileHelper.js** 封装了 IPC 调用并添加了额外逻辑（路径校验）。

**事件型 IPC（Agent 研讨室）**：研讨是长任务，由主进程编排并通过 `webContents.send('agent-discussion:event', …)` 向渲染层推送阶段/调用/消息/失败/完成事件；preload 暴露窄接口 `electronAPI.agentWorkshop`（`onEvent(cb)` 返回取消订阅函数，仅订阅单一 channel，不暴露通用 `on`）。主进程逻辑位于 `electron/agentWorkshop/`：`adapters`（只读参数构造）、`detection`（登录 shell 解析路径 + `claude auth status` / `codex login status` 登录态探测）、`runner`（spawn / 超时 / 取消 / 进程组终止 / 输出截断）、`gitSafety`（`git status` 快照与比较，作为咨询式二次防线——变化只提示不中断，实时只读靠 CLI 沙箱参数）、`records`（userData 下 JSON 记录持久化）、`orchestrator`（依赖注入的流程编排状态机，决策可单测；第二轮仅第一轮成功子集进入）、`ipc`（handlers 与事件发射，由 main.js 注册；start 在主进程侧 `validateStartParams` 复核 + 运行互斥 + try/catch/finally 异常兜底）。Windows 暂不支持（detection 用登录 shell、runner 用进程组终止，均未适配），由 `AgentWorkshopTab.vue` 用 `navigator.platform` 门控显示「暂不支持」。

### 工具模块

`src/renderer/utils/` 中的核心工具函数为纯 JavaScript，可单元测试：
- **jsonHelper.js**：formatJSON、minifyJSON、validateJSON、unescapeJSON、jsonToYAML、yamlToJSON、validateYAML — 均返回 `{ success, result/error }`，包含行/列错误位置
- **diffHelper.js**：diffTextUnified（git 风格）、diffTextSplit（并排对比）、diffStats — 使用 diff-match-patch 库
- **timeHelper.js**：formatDate、parseDate、timestampToDate、dateToTimestamp — 纯日期/时间戳转换
- **fileHelper.js**：IPC 封装，包含路径校验
- **regexHelper.js**：runRegex — 编译正则并执行匹配，返回 `{ success, matches/error }`，含捕获组位置/命名、命中计数与海量匹配截断；被 Web Worker 引用且可独立单元测试
- **encodeHelper.js**：编码工具合集纯逻辑——base64Encode/Decode（TextEncoder 处理 UTF-8）、urlEncode/Decode、decodeJWT（三段拆分 + exp/iat/nbf 转可读时间，不验签）、hashAll（MD5 via js-md5 + SHA-1/256/512 via crypto.subtle，异步）、convertBase（BigInt 四进制联动）、unicodeEscape/Unescape（`\u` / `\u{}` / HTML 实体三格式），均返回 `{ success, result/error }`
- **textHelper.js**：文本处理纯逻辑——getTextStats（字符/字数/行数/非空行/UTF-8 字节）、convertTextCase（大小写与命名风格转换）、sortLines、dedupeLines，供 TextTab 与单测复用
- **agentWorkshopHelper.js**：Agent 研讨室与进程无关的纯逻辑——常量/状态枚举、就绪态与配置派生（readyAgents、三态 agentCardState、moderator 默认与回退、validateStart、主进程侧 validateStartParams）、调用次数估算（2n+1）、三阶段 prompt 构造（含只读/plan-only/不反问约束）、minimal 仓库上下文、研讨记录 Markdown 导出；渲染进程与主进程双向 import、可单测
- **safeMarkdown.js**：`marked` 解析 + `DOMPurify` 消毒的安全 Markdown 渲染（剥离 `<script>`/`on*`/`javascript:`，外链补 `target=_blank`+`rel=noopener`），供 Agent 研讨室时间线 `v-html` 使用；测试在 jsdom 环境下运行

### 构建系统

electron-vite 构建三个独立的 bundle：
- `out/main/main.js` — 主进程（ESM）
- `out/preload/preload.mjs` — 预加载脚本
- 渲染进程通过 Vite 开发服务器提供或构建到 `out/renderer/`

资源文件（`electron/assets/icon.*`）通过 `electron.vite.config.js` 中的自定义插件在构建时复制到 `out/main/assets/`。

### 核心组件

- **App.vue**：根组件，管理标签页状态、主题、字号、最近文件和键盘快捷键（Ctrl+1-9/0、Ctrl+Tab）
- **EditorWithLineNumbers.vue**：可复用的 textarea，带同步行号列
- **EditorTab.vue**：统一编辑器标签，按文件后缀驱动 `mode`（markdown / html），多态预览（`MarkdownPreview` / `HtmlPreview`）、上下文工具栏（markdown 模式额外含导出 HTML/PDF、语法介绍）、滚动同步（markdown 双向 / html 单向），使用 `useEditorFile` composable
- **composables/useEditorFile.js**：编辑器共用逻辑——打开/新建/保存/快捷键，后缀→mode 派生，Ctrl+S/N 成对绑定/解绑
- **FileTree.vue / TreeNode.vue**：可复用的懒加载目录树，被 EditorTab 使用，通过 `editableExtensions` prop 按 mode 过滤显示文件类型
- **DiffTab.vue**：并排/统一差异视图，带滚动同步，使用 diff-match-patch 库
- **TextTab.vue**：文本处理工具，左侧子工具导航切换统计、大小写/命名风格转换、排序和去重，纯逻辑在 `textHelper.js`
- **GeneratorTab.vue**：生成器合集，左侧子工具导航切换 UUID、随机密码和 Lorem，纯逻辑在 `generatorHelper.js`
- **RegexTab.vue**：正则测试器，结构化 `/pattern/flags` 输入、实时匹配、编辑/高亮预览双区、捕获组多色、匹配结果列表（与预览双向 hover 联动）、右侧速查抽屉；匹配经 `useRegexMatcher` 在 Web Worker 中执行
- **composables/useRegexMatcher.js**：封装正则匹配 Worker 的生命周期——发起匹配、超时（1.5s）`terminate` 兜底、重建待命 Worker、组件卸载释放，杜绝灾难性回溯冻结 UI
- **workers/regex.worker.js**：子线程内调用 `regexHelper.runRegex` 执行匹配，postMessage 回传位置数组
- **EncodeTab.vue**：编码工具合集，左侧菜单切换 6 个子工具（Base64 / URL / JWT / Hash / 进制 / Unicode）；编解码类用「左源右果 + ⇄ 方向」实时计算，Hash 异步（generation 计数防过期响应），进制四框联动，纯逻辑全在 `encodeHelper.js`
- **AgentWorkshopTab.vue**：Agent 研讨室标签，左栏配置（仓库选择 / agent 三态检测卡片 / 主持选择 / 调用估算 / 开始-停止）与运行进度，右栏想法输入或 Markdown 时间线；经 `window.electronAPI.agentWorkshop` 调用主进程，订阅 `agent-discussion:event` 事件流（卸载时取消订阅），用 `activeRunId` 区分本会话运行与恢复查看的旧记录
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
