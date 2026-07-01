# AGENTS.md

本文件为 Codex 在此代码库中工作时提供指引。内容以当前 OneApp 代码和 `CLAUDE.md` 的最新项目知识为基准，避免保留旧版标签数、组件名和功能描述。

## 项目概述

OneApp 是一个基于 Electron + Vue 3 的桌面开发工具应用，集成：

- 统一编辑器：按文件后缀自动切换 Markdown / HTML / 纯文本模式，支持文件树、预览、保存和导出
- 数据工具：JSON 格式化、压缩、校验、反转义、JSONPath 查询，JSON ⇄ YAML 转换与 YAML 单文档校验，CSV ⇄ JSON 转换与 CSV 表格预览，SQL / XML 格式化与压缩
- 文本对比：并排 / 统一 diff，滚动同步与差异统计
- 文本处理：统计、大小写/命名风格转换、按行排序、按行去重
- 生成器：UUID v4 单个/批量生成、随机密码、Lorem 占位文本
- 时间工具：当前时间、时间戳互转、多格式输出
- 正则测试器：`/pattern/flags` 输入、Web Worker 实时匹配、捕获组高亮、速查抽屉
- 编码工具合集：Base64、URL、JWT、Hash、进制、Unicode
- Agent 研讨室：多个本地 AI agent 以只读方式研讨本地仓库、交叉评审并输出实现方案
- 设置与更新：设置页可检查 GitHub Releases 最新版本，应用级消息统一通过带 OneApp 图标的系统弹窗展示

## 常用命令

```bash
npm run dev        # 启动开发模式（热重载）
npm run build      # 生产构建（输出到 out/）
npm run preview    # 预览生产构建
npm run pack       # 构建并生成 unpacked 包
npm run dist       # 构建并打包三平台 target
npm run dist:mac   # 仅打 macOS 包
npm run dist:win   # 仅打 Windows 包
npm run dist:linux # 仅打 Linux 包
npm test           # 运行单元测试
npm run test:watch # 运行测试（监听模式）
npm test -- tests/jsonHelper.test.js # 运行单个测试文件
```

## 工作流程

### 分支管理

- 每个需求必须创建新分支，在新分支上开发，不要直接在 `main` 分支上修改代码。
- 创建本地分支前，先拉取远程 `main` 分支，确保本地 `main` 与远程同步，防止基于落后的代码创建分支：
  ```bash
  git checkout main && git pull origin main
  git checkout -b <branch-name>
  ```
- 本项目分支命名约定为 `feature/功能名`、`fix/问题描述`、`docs/文档`、`chore/杂项`。除非用户明确指定其他格式，不要使用环境默认分支前缀覆盖项目约定。
- 功能开发完成后通过 PR 合并到 `main`。

### 版本管理

版本号遵循 [Semantic Versioning](https://semver.org/)，无需人工单独确认：

| 改动类型 | 版本位 | 示例 |
| --- | --- | --- |
| 重量级功能、架构重设计、大范围破坏性变更 | 大版本 X | 1.x.x → 2.0.0 |
| 新功能、较大功能改动、中等破坏性变更 | 中间版本 Y | 1.4.x → 1.5.0 |
| Bug 修复、小改动、文档、样式微调 | 小版本 Z | 1.4.4 → 1.4.5 |

- 版本修改在 `package.json` 中完成，`CHANGELOG.md` 同步更新。
- 时机：所有代码/文档改动完成、自测通过后，在 `git push` 前统一升版本号并提交。
- 不升版本的情况：纯文档修正（README / CLAUDE.md / ROADMAP 等与代码功能无关的更新）、流程规范调整、CI 配置微调等不影响应用功能的变更无需升版本号。

### 需求开发全流程

每个需求一条分支。完整流程是规格驱动开发（SDD），由 OpenSpec 工具全程串起；工程顺序为：explore → 建分支 → propose → apply → archive。按改动大小分级执行：新功能/较大需求走完整流程，小修复/文档类走简化流程。非自动推进模式下，外发动作（push / 创建 PR / 合并 PR / 打 tag / 发布）仍需用户明确请求；自动推进模式下，最终验证通过后可直接执行本地提交、push、创建 PR、合并 PR、打 tag 和发布 Release，但执行每个外发动作时必须明确告知用户。

在 Codex 中对应的 OpenSpec 技能通常是 `$openspec-explore`、`$openspec-propose`、`$openspec-apply-change`、`$openspec-archive-change`；`CLAUDE.md` 中的 `/opsx:explore`、`/opsx:propose`、`/opsx:apply`、`/opsx:archive` 是同一流程在 Claude Code 下的入口名。

完整流程（新功能 / 较大需求）：

1. 探索 `/opsx:explore`：厘清方案与关键决策。
2. 建分支：在执行 `/opsx:propose` 前创建需求分支。先确保当前工作区干净；若存在未提交改动，先停下来让用户决定提交、暂存、stash 或换分支。然后 `git checkout main && git pull origin main`，再开 `feature/*`。
3. 提案 `/opsx:propose`：在新分支上生成 `proposal.md`、`design.md`、`specs/**/spec.md`、`tasks.md`，确保 OpenSpec 变更文件从创建开始就属于需求分支。
4. 实现 `/opsx:apply`：按 tasks 落地并逐项勾选。
5. 自测（门禁，必做）：`npm test` 全部通过（环境相关用例如时区断言，注意区分 flaky 与真回归）+ `npm run build` 编译通过，必要时 `npm run dev` 手动验证。
6. Code Review `/code-review`（high）：修复高优先级问题后复跑构建与测试。
7. 归档 `/opsx:archive`：delta 合并进主 specs，change 移入 `archive/`；归档后运行 `openspec validate --specs --strict`。
8. 文档收尾：同步 README / CLAUDE.md / AGENTS.md 等项目文档；不要在这里重复维护发布版本记录。
9. 版本与 CHANGELOG：所有改动就绪后，根据语义化版本升级 `package.json` 版本号，并更新 `CHANGELOG.md`。
10. 最终验证：版本、CHANGELOG、归档和文档都就绪后，再跑一次 `npm test` + `npm run build`。
11. 提交：按主题分组 commit（feat / fix / test / docs / chore），message 末尾按规范署名；自动推进模式下最终验证通过后可直接本地提交，执行前需告知用户。
12. Push + PR + 合并：自动推进模式下最终验证通过后可直接 `git push`、`gh pr create` 并合并 PR；非自动推进模式下需用户明确请求。每个外发动作执行前需告知用户。
13. Release（仅发版时）：PR 合并后，以下步骤作为完整发布序列一次性执行；自动推进模式下无需再次确认，但执行打 tag、推送 tag、等待 CI、补传 Intel 包等动作前需告知用户：
    - 确认 `package.json` 版本号与 CHANGELOG 就绪；正式打 tag 前可用 `workflow_dispatch` 手动触发验证 CI 三平台构建（仅 build、不创建 Release）。
    - 打 `vX.Y.Z` tag 并 `git push origin vX.Y.Z` → GitHub Actions（`.github/workflows/release.yml`）自动构建 mac arm64 / Windows / Linux 三平台并创建 GitHub Release（notes 取自 CHANGELOG 对应版本段）。tag 与 `package.json` 版本不一致时 CI 会失败。
    - mac Intel(x64) 包补传（必做，无需额外确认）：先用 `uname -m` 自检当前机器架构（`x86_64` = Intel，`arm64` = Apple Silicon）；若为 Intel，在 CI 跑包期间并行执行 `npm run dist:mac` 本地打包，CI 完成/Release 创建后立即执行 `gh release upload vX.Y.Z dist/OneApp-X.Y.Z-mac-x64.dmg dist/OneApp-X.Y.Z-mac-x64.zip` 补传。架构判断由 agent 自行完成，不询问用户。
    - 不再本地手动 `npm run dist` 全量打包 + `gh release create`；发布由 CI 负责，本地仅补 Intel 包。

简化流程（小修复 / 文档类）：跳过探索、提案、归档；保留：建分支 → 实现 → 自测/校验 → 文档（按需）→ 版本与 CHANGELOG（仅影响功能或发布时）→ 最终验证 → 提交 → Push + PR。

确认卡点汇总：自动推进模式下，本地提交、`git push`、创建 PR、合并 PR、打 tag 和发布 Release 不再需要人工确认，但必须在执行动作时明确告知用户，并且必须建立在最终验证通过的基础上；非自动推进模式下，这些外发动作仍需用户明确请求。版本号升级不是独立确认卡点，在 push 前自动完成。

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

- 沙箱：`npm run build` / `npm run dist` / `git push` / `gh` 等构建与网络命令在沙箱内常因证书或依赖解析（如 `vue/compiler-sfc`）失败；确认是沙箱限制后在沙箱外重试。`npm test` 多数可在沙箱内运行，但 `tests/safeMarkdown.test.js` 用 jsdom 环境，会加载 `parse5/dist/common/token.js` 等被沙箱 `*token*` 读取拒绝规则命中的文件而导致 worker 启动失败；跑含 DOM 环境的完整测试需在沙箱外执行。
- 发布文案：GitHub Release 的标题与 notes 用中文，notes 取自 CHANGELOG 对应版本；未签名的 macOS 包需在 notes 提示用户「右键 → 打开」绕过 Gatekeeper。
- 测试稳定性：环境相关用例（如 `timeHelper` 时区断言）在不同时区机器上可能失败，判断 flaky 时先排除环境因素，不要误判为本次回归。
- OpenSpec 数据卫生：`/opsx:archive` 会把 delta 合并进主 specs；若主 spec 残留 delta 头（`## ADDED` / `## REMOVED Requirements`）会阻塞归档，需先规范化为 `# 标题 / ## Purpose / ## Requirements` 结构。
- 流程文档同步：如果调整需求开发流程，必须同步更新 `AGENTS.md` 与 `CLAUDE.md`，避免 Codex 和 ClaudeCode 按不同流程执行。

### 文档语言与术语

- OpenSpec 及相关方案文档的内容主体使用中文，包括 `proposal.md`、`design.md`、`specs/**/spec.md`、`tasks.md` 和实现说明。
- 保留 OpenSpec 解析或约定所需的英文关键词，例如 `ADDED Requirements`、`REMOVED Requirements`、`Requirement`、`Scenario`、`WHEN`、`THEN`、`SHALL`、`Reason`、`Migration`。
- 保留英文缩写、产品名、API 名、代码标识和行业常用术语，不要为了中文化而硬翻。常见示例包括 `Agent Workshop`、`OpenSpec`、`IPC`、`JSON`、`Regex`、`Encode`、`Time`、`Settings`、`Renderer`、`preload API`、`main process`、`tab`、`tab bar`、`workbench shell`、`command bar`、`panel`、`chip`、`theme token`、`helper`、`workflow`、`orchestration`。
- 推荐写法是「中文句子 + 必要英文术语」：保证文档整体可读，同时避免把固定概念翻译得不符合项目语境或行业习惯。

### 验证补充

- 常规代码改动后至少运行相关单测；较大改动运行 `npm test` 和 `npm run build`。
- UI/布局改动需要实际启动应用或进行浏览器/截图烟测，覆盖深色与浅色主题、关键页面和快捷键。
- Agent 研讨室相关改动需要额外确认不会改变主进程编排、只读约束、记录持久化和事件订阅行为。

## 架构

### 进程分离

- **主进程**（`electron/main.js`）：Node.js 环境，处理文件 I/O、对话框、PDF 导出、F12 DevTools、应用配置和 Agent Workshop IPC 注册。
- **预加载脚本**（`preload.cjs`）：CommonJS 模块，通过 `contextBridge` 暴露窄接口 `window.electronAPI`。
- **渲染进程**（`src/renderer/`）：Vue 3 SPA，使用 Composition API，保持纯 web 环境。

### IPC 通信模式

渲染进程通过 preload 暴露的 API 调用主进程：

```js
// Renderer
const result = await window.electronAPI.readFile(filePath)

// Preload
readFile: (filePath) => ipcRenderer.invoke('read-file', filePath)

// Main
ipcMain.handle('read-file', async (event, filePath) => { ... })
```

普通 IPC handler 统一返回 `{ success, content/error }` 风格，方便错误处理。

Agent 研讨室额外使用事件型 IPC：主进程通过 `webContents.send('agent-discussion:event', ...)` 推送进度和消息；preload 只暴露 `electronAPI.agentWorkshop.onEvent(cb)`，订阅函数必须返回取消订阅能力，不能暴露通用 channel 监听器。

## 关键目录与模块

### 主进程 Agent Workshop

`electron/agentWorkshop/`：

- `adapters.js`：Codex / ClaudeCode 只读调用参数构造
- `detection.js`：登录 shell 解析 CLI 路径、版本和登录态
- `runner.js`：spawn、超时、取消、进程组终止、输出截断
- `gitSafety.js`：`git status --short` 快照和咨询式比较
- `records.js`：userData 下 JSON 讨论记录读写
- `orchestrator.js`：三阶段研讨流程状态机，依赖注入，便于单测
- `ipc.js`：IPC handlers 与事件发射，由 `main.js` 注册

`electron/appDialogs.js`：应用级消息弹窗图标路径解析、GitHub latest Release 检查与更新结果归一化支撑逻辑；`main.js` 通过 IPC 暴露给 preload。

Windows 暂不支持 Agent Workshop 的本地 CLI 检测与进程组管理，渲染层通过 `AgentWorkshopTab.vue` 显示「暂不支持」。

### 渲染工具函数

`src/renderer/utils/` 中核心逻辑尽量保持纯函数、可单测：

- `jsonHelper.js`：JSON 格式化、压缩、校验、反转义
- `csvHelper.js`：CSV ⇄ JSON 转换、CSV 表格预览和 CSV 错误归一化
- `formatHelper.js`：SQL / XML 格式化、压缩和 XML 结构错误归一化
- `jsonPathHelper.js`：JSONPath 查询、匹配路径和值摘要归一化
- `diffHelper.js`：统一 diff、并排 diff、差异统计
- `timeHelper.js`：日期格式化、解析、时间戳互转
- `fileHelper.js`：文件相关 IPC 封装与路径校验
- `regexHelper.js`：正则编译和匹配，返回捕获组、位置、截断信息
- `encodeHelper.js`：Base64、URL、JWT、Hash、进制、Unicode 纯逻辑
- `textHelper.js`：文本统计、大小写/命名风格转换、按行排序、按行去重纯逻辑
- `updateHelper.js`：语义化版本解析/比较、GitHub Release 响应归一化和更新说明摘要
- `agentWorkshopHelper.js`：Agent Workshop 进程无关逻辑、配置校验、prompt 构造、Markdown 导出
- `safeMarkdown.js`：`marked` + `DOMPurify` 安全渲染，供 Agent Workshop 时间线 `v-html` 使用

### 主要组件

- `App.vue`：根组件，管理 active tab、主题、字号、最近文件和快捷键（Ctrl/Cmd+1-9/0、Ctrl/Cmd+Tab）。
- `Header.vue`：当前主导航组件；若执行 workbench UI refresh，可能会演进为左侧导航 / 应用壳。
- `StatusBar.vue`：底部状态栏，必须覆盖全部一级工具名称。
- `EditorTab.vue`：统一编辑器，使用 `useEditorFile`，按 mode 渲染 Markdown / HTML / 纯文本工作流。
- `EditorWithLineNumbers.vue`：带同步行号的复用 textarea。
- `FileTree.vue` / `TreeNode.vue`：懒加载目录树。
- `MarkdownPreview.vue` / `HtmlPreview.vue`：Markdown 与 HTML 预览。
- `JsonTab.vue`：数据工具合集，提供 JSON / YAML / CSV / SQL / XML 子工具、JSONPath 查询和 CSV 表格预览。
- `DiffTab.vue`：文本对比工具。
- `TextTab.vue`：文本处理工具，左侧子工具导航，支持统计、转换、排序和去重。
- `RegexTab.vue`：正则测试器，匹配由 `useRegexMatcher` 和 `workers/regex.worker.js` 执行。
- `EncodeTab.vue`：编码工具合集，左侧子工具导航。
- `GeneratorTab.vue`：生成器合集，左侧子工具导航，支持 UUID、随机密码和 Lorem。
- `TimeTab.vue`：时间与时间戳转换。
- `AgentWorkshopTab.vue`：Agent 研讨室，订阅主进程事件流并渲染配置、进度和 Markdown 时间线。
- `SettingsTab.vue`：工作目录、主题、字号、最近文件、快捷键、关于信息和 GitHub Release 更新检查。

## 构建系统

electron-vite 构建三个独立 bundle：

- `out/main/main.js`：主进程（ESM）
- `out/preload/preload.mjs`：预加载脚本
- `out/renderer/`：渲染进程生产产物

资源文件 `electron/assets/icon.*` 通过 `electron.vite.config.js` 的自定义插件复制到 `out/main/assets/`。

## 配置与持久化

electron-store 默认配置：

```js
workDir: ''
theme: 'dark'
fontSize: 14
recentFiles: []
```

Agent Workshop 的大型讨论记录不放在 electron-store 中，而是保存到 app userData 目录下的 JSON 文件。

## 样式约定

- 全局样式位于 `src/renderer/styles/main.css`。
- 深色 / 浅色主题通过 `<html data-theme="light">` 切换。
- macOS 窗口使用 `titleBarStyle: 'hiddenInset'`，导航区域需要保留左侧约 78px 给红绿灯按钮。
- UI 改造应优先复用全局 token 和共享样式，避免各页面重复发明按钮、面板和状态样式。

## 安全与边界

- 渲染进程不要直接使用 Node API；系统能力通过 preload 暴露的窄接口进入。
- 使用 `v-html` 时必须经过 `safeMarkdown.js` 等安全消毒，不直接渲染 agent 或仓库来源的不可信内容。
- Agent Workshop 的只读边界主要依赖 CLI 参数和权限模式，Git 状态检查只是咨询式二次防线，发现变化只提示不中断。
- 不要在 UI 改造中顺手修改 Agent Workshop orchestration、runner、IPC 或持久化逻辑。
