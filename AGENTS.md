# AGENTS.md

本文件是 Codex、Claude Code 等 AI agent 在此代码库中工作的统一指引。项目知识与开发规范统一维护于 `AGENTS.md`；`CLAUDE.md` 仅通过 `@AGENTS.md` 引入本文件，不重复维护正文。内容以当前 OneApp 代码为准，避免保留旧版标签数、组件名和功能描述。

## 项目概述

OneApp 是一个基于 Electron + Vue 3 的桌面开发工具应用，集成：

- 统一编辑器：按文件后缀自动切换 Markdown / HTML / 纯文本模式，支持文件树、预览、保存和导出
- 数据工具：JSON 格式化、压缩、校验、反转义、JSONPath 查询，JSON ⇄ YAML 转换与 YAML 单文档校验，CSV ⇄ JSON 转换与 CSV 表格预览，SQL / XML 格式化与压缩
- 文本对比：并排 / 统一 diff，滚动同步与差异统计
- 文本处理：统计、大小写/命名风格转换、按行排序、按行去重
- 生成器：UUID v4 单个/批量生成、随机密码、Lorem 占位文本、二维码 PNG 生成
- 时间工具：实时当前时间概览、时间戳互转、多格式输出、标准 5 位 Cron 表达式解释、多时区对照
- 正则测试器：`/pattern/flags` 输入、Web Worker 实时匹配、捕获组高亮、速查抽屉
- 编码工具合集：Base64、URL、JWT、Hash、进制、Unicode
- Agent 研讨室：多个本地 AI agent 以只读方式研讨本地仓库、交叉评审并输出实现方案
- 设置与更新：设置页可检查 GitHub Releases 最新版本，简短消息与研讨费用确认通过带 OneApp 图标的系统弹窗展示；更新详情、语法帮助、发送确认和搜索统一使用应用内 AppDialog

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

### 本地 Review 与临时产物

- 仓库根目录的 `doc_local/` 用于存放需要用户 review、讨论或比较的本地临时产物，例如 HTML 交互原型、临时方案、设计草图、截图与验证记录。
- 需要先展示方案、收集反馈或探索时，优先将产物放在 `doc_local/`，可按需求建立子目录；交付时提供具体路径及预览方式。
- `doc_local/` 已加入 `.gitignore`，默认不提交，不作为应用运行或构建依赖，不使用强制添加绕过忽略规则。
- 确认后需长期保留的结论应整理到正式文档或 OpenSpec；本地 Review 产物不能替代正式规格与实现。

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

在 Codex 中对应的 OpenSpec 技能通常是 `$openspec-explore`、`$openspec-propose`、`$openspec-apply-change`、`$openspec-archive-change`；`/opsx:explore`、`/opsx:propose`、`/opsx:apply`、`/opsx:archive` 是同一流程在 Claude Code 下的入口名。

完整流程（新功能 / 较大需求）：

1. 探索 `/opsx:explore`：厘清方案与关键决策。
2. 建分支：在执行 `/opsx:propose` 前创建需求分支。先确保当前工作区干净；若存在未提交改动，先停下来让用户决定提交、暂存、stash 或换分支。然后 `git checkout main && git pull origin main`，再开 `feature/*`。
3. 提案 `/opsx:propose`：在新分支上生成 `proposal.md`、`design.md`、`specs/**/spec.md`、`tasks.md`，确保 OpenSpec 变更文件从创建开始就属于需求分支。
4. 实现 `/opsx:apply`：按 tasks 落地并逐项勾选。
5. 自测（门禁，必做）：`npm test` 全部通过（环境相关用例如时区断言，注意区分 flaky 与真回归）+ `npm run build` 编译通过，必要时 `npm run dev` 手动验证。
6. Code Review `/code-review`（high）：修复高优先级问题后复跑构建与测试。
7. 归档 `/opsx:archive`：delta 合并进主 specs，change 移入 `archive/`；归档后运行 `openspec validate --specs --strict`。
8. 文档收尾：按需更新 README 等项目文档，项目知识与开发规范统一更新 `AGENTS.md`，保持 `CLAUDE.md` 仅引用本文件；不要在这里重复维护发布版本记录。
9. 版本与 CHANGELOG：所有改动就绪后，根据语义化版本升级 `package.json` 版本号，并更新 `CHANGELOG.md`。
10. 最终验证：版本、CHANGELOG、归档和文档都就绪后，再跑一次 `npm test` + `npm run build`。
11. 提交：按主题分组 commit（feat / fix / test / docs / chore），message 末尾按规范署名；自动推进模式下最终验证通过后可直接本地提交，执行前需告知用户。
12. Push + PR + 合并：自动推进模式下最终验证通过后可直接 `git push`、`gh pr create` 并合并 PR；非自动推进模式下需用户明确请求。每个外发动作执行前需告知用户。
13. Release（仅发版时）：PR 合并后，以下步骤作为完整发布序列一次性执行；自动推进模式下无需再次确认，但执行打 tag、推送 tag、等待 CI、补传 Intel 包等动作前需告知用户：
    - 确认 `package.json` 版本号与 CHANGELOG 就绪；正式打 tag 前可用 `workflow_dispatch` 手动触发验证 CI 三平台构建（仅 build、不创建 Release）。
    - 打 `vX.Y.Z` tag 并 `git push origin vX.Y.Z` → GitHub Actions（`.github/workflows/release.yml`）自动构建 mac arm64 / Windows / Linux 三平台并创建 GitHub Release（notes 取自 CHANGELOG 对应版本段）。tag 与 `package.json` 版本不一致时 CI 会失败。
    - mac Intel(x64) 包补传（必做，无需额外确认）：先用 `uname -m` 自检当前机器架构（`x86_64` = Intel，`arm64` = Apple Silicon）；若为 Intel，在 CI 跑包期间并行执行 `npm run dist:mac` 本地打包，CI 完成/Release 创建后立即执行 `gh release upload vX.Y.Z dist/OneApp-X.Y.Z-mac-x64.dmg dist/OneApp-X.Y.Z-mac-x64.zip` 补传。架构判断由 agent 自行完成，不询问用户。
    - 不再本地手动 `npm run dist` 全量打包 + `gh release create`；发布由 CI 负责，本地仅补 Intel 包。
14. 清理产物（防止磁盘占用，必做）：流程收尾删除本轮本地编译 / 打包产物：`out/`（`npm run build` 输出）与 `dist/`（`npm run dist*` 打包输出）。`dist/` 会累积历次发版的安装包、可达数 GB，是磁盘占用大头，发版后尤其要清；两目录均 gitignored、可随时重新生成。前提：若本轮发版，先确认 Release 所需产物（尤其 mac Intel 包）已成功上传，再删除本地 `dist/`。

简化流程（小修复 / 文档类）：跳过探索、提案、归档；保留：建分支 → 实现 → 自测/校验 → 文档（按需）→ 版本与 CHANGELOG（仅影响功能或发布时）→ 最终验证 → 提交 → Push + PR → 清理产物（如有）。

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
- 流程收尾清理本地编译 / 打包产物（`out/`、`dist/`），防止 `dist/` 累积历史安装包长期占用磁盘；发版时先确认所需产物已上传 Release 再删除本地 `dist/`

自动推进模式下，遇到以下情况必须暂停并请求用户介入：

- 工作区存在非本需求产生的未提交改动，或无法判断改动归属
- 需要改变已确认的需求范围、方案方向、branch name 或 change name
- OpenSpec delta 与主 specs 冲突，无法无歧义同步
- 测试或构建失败，且原因不是明确的本次代码回归或可直接修复的问题
- code review 提出架构级分歧、产品取舍或高风险改动
- 需要升 major version，或版本影响和 explore 阶段预估不一致
- 需要新增/变更 CI、发布流程、权限、安全边界或外部服务配置
- 需要访问敏感凭证、付费资源、外部账号或用户本机隐私数据
- 需要删除分支、丢弃改动、覆盖远端历史、强推、改写 tag 或执行其他破坏性动作（清理 gitignored 且可重新生成的 `out/` / `dist/` 编译产物不属破坏性动作，是流程收尾常规环节）

自动推进的停止条件：

- 成功：本地实现、归档、版本/CHANGELOG、最终验证、commit、push、PR、合并、Release（如需发版）和产物清理全部完成。
- 受阻：出现必须用户介入的情况；agent 汇报当前状态、已完成事项、阻塞原因和可选方案。
- 失败：验证无法通过或方案不可行；agent 保留现场，不回滚用户或未知来源改动，并给出下一步建议。

### 贯穿全程的硬性约定

- 沙箱：`npm run build` / `npm run dist` / `git push` / `gh` 等构建与网络命令在沙箱内常因证书或依赖解析（如 `vue/compiler-sfc`）失败；确认是沙箱限制后在沙箱外重试（Claude Code 可通过 `/sandbox` 管理白名单）。`npm test` 多数可在沙箱内运行，但 `tests/safeMarkdown.test.js` 用 jsdom 环境，会加载 `parse5/dist/common/token.js` 等被沙箱 `*token*` 读取拒绝规则命中的文件而导致 worker 启动失败；跑含 DOM 环境的完整测试需在沙箱外执行。
- 发布文案：GitHub Release 标题必须与 tag 完全一致，格式为 `vX.Y.Z`，不添加应用名、功能摘要或「发布」等文字；workflow 的 Release 步骤通过 `name: ${{ github.ref_name }}` 显式设置标题。更新内容全部写入描述（notes），使用中文，取自 `CHANGELOG.md` 对应版本段；未签名的 macOS 包需在 notes 提示用户「右键 → 打开」绕过 Gatekeeper。
- 测试稳定性：环境相关用例（如 `timeHelper` 时区断言）在不同时区机器上可能失败，判断 flaky 时先排除环境因素，不要误判为本次回归。
- OpenSpec 数据卫生：`/opsx:archive` 会把 delta 合并进主 specs；若主 spec 残留 delta 头（`## ADDED` / `## REMOVED Requirements`）会阻塞归档，需先规范化为 `# 标题 / ## Purpose / ## Requirements` 结构。
- 流程文档维护：如果调整需求开发流程，统一更新 `AGENTS.md`；`CLAUDE.md` 只保留 `@AGENTS.md` 引用，文件名大小写必须与实际路径一致，避免 Codex 和 Claude Code 按不同流程执行。

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

主进程通过 `workbenchPolicy.js` 统一校验主窗口 webContents、main frame、页面 URL 和 handler 参数；不得新增通用 invoke/on。`fileAccess.js` 维护系统选择的文件/目录/保存目标，每次访问复核 realpath 和目录边界；系统选择结果返回 canonical path，防止 `/tmp` 等别名绕过缓存稿冲突判断。最近记录不授予权限；已有 dirty 缓存从内存恢复，不依赖磁盘重新授权。

`closeGuard.js` 统一关闭/退出确认链，先检查全部 dirty 稿，再停止活动研讨/连接测试并等待清理，最后重核草稿；取消、超时、失败都保留窗口。macOS 关闭后 Dock 重建单个主工作台；退出必须经过同一门禁。

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

复制统一通过 preload 的 `electronAPI.clipboard.writeText(text)` / `writePng(dataUrl)` 进入主进程，由 `electron/clipboard.js` 校验后调用 Electron clipboard；不使用浏览器剪贴板 API，不开放读取或通用 IPC，浏览器权限继续默认拒绝。文本按 UTF-8 限制为 32 MiB；PNG 仅接受规范的 PNG data URL，数据不超过 2 MiB、宽高各不超过 1024，解码前后都校验。`useCopyToast` 等待结构化写入结果后展示可访问的成功/失败提示，研讨室与二维码复用同一反馈。

Agent 研讨室额外使用事件型 IPC：主进程通过 `webContents.send('agent-discussion:event', ...)` 推送阶段、调用、消息、失败与完成事件；preload 只暴露 `electronAPI.agentWorkshop.onEvent(cb)`，订阅函数必须返回取消订阅能力，不能暴露通用 channel 监听器。

## 关键目录与模块

### 主进程 Agent Workshop

`electron/agentWorkshop/`：

- `adapters.js`：Codex / ClaudeCode 只读调用参数构造
- `detection.js`：登录 shell 解析 CLI 路径、版本，通过 `claude auth status` / `codex login status` 探测登录态
- `runner.js`：spawn、超时、取消、进程组终止、输出截断、显式子进程 `env` 注入
- `gitSafety.js`：`git status --short` 快照和咨询式比较
- `records.js`：userData 下 JSON 讨论记录读写
- `orchestrator.js`：三阶段研讨流程状态机，依赖注入，便于单测；第二轮仅第一轮成功的 agent 子集进入
- `ipc.js`：IPC handlers 与事件发射，由 `main.js` 注册；start 在主进程侧通过 `validateStartParams` 复核、运行互斥及 try/catch/finally 异常兜底；含代理配置读写校验与按需 `test-agent-connection`，与正式研讨调用共用同一套 `buildAgentEnvironment` 代理 env 派生，连接测试同样受运行互斥保护且不写入研讨记录

`electron/appDialogs.js`：应用级消息弹窗图标路径解析、GitHub latest Release 检查与更新结果归一化支撑逻辑；`main.js` 通过 IPC 暴露给 preload。

Windows 暂不支持 Agent Workshop 的本地 CLI 检测与进程组管理，渲染层通过 `AgentWorkshopTab.vue` 的 `navigator.platform` 门控显示「暂不支持」。

### 渲染工具函数

`src/renderer/utils/` 中核心逻辑尽量保持纯函数、可单测：

- `jsonHelper.js`：formatJSON、minifyJSON、validateJSON、unescapeJSON、jsonToYAML、yamlToJSON、validateYAML — 均返回 `{ success, result/error }`，包含行/列错误位置
- `csvHelper.js`：CSV ⇄ JSON 转换、CSV 表格预览和 CSV 错误归一化，基于 PapaParse，返回 `{ success, result/table/error }`
- `formatHelper.js`：SQL / XML 格式化、压缩和 XML 结构错误归一化，基于 sql-formatter 与 fast-xml-parser
- `jsonPathHelper.js`：JSONPath 查询、匹配路径和值摘要归一化，基于 jsonpath-plus
- `diffHelper.js`：diffTextUnified（git 风格）、diffTextSplit（并排对比）、diffStats — 使用 diff-match-patch 库
- `timeHelper.js`：formatDate、parseDate、timestampToDate、dateToTimestamp、Cron 解析与未来执行时间计算、多时区对照
- `fileHelper.js`：IPC 封装，包含路径校验
- `regexHelper.js`：runRegex — 编译正则并执行匹配，返回 `{ success, matches/error }`，含捕获组位置/命名、命中计数与海量匹配截断；被 Web Worker 引用且可独立单元测试
- `encodeHelper.js`：编码工具合集纯逻辑——base64Encode/Decode（TextEncoder 处理 UTF-8）、urlEncode/Decode、decodeJWT（三段拆分 + exp/iat/nbf 转可读时间，不验签）、hashAll（MD5 via js-md5 + SHA-1/256/512 via crypto.subtle，异步）、convertBase（BigInt 四进制联动）、unicodeEscape/Unescape（`\u` / `\u{}` / HTML 实体三格式），均返回 `{ success, result/error }`
- `textHelper.js`：文本处理纯逻辑——getTextStats（字符/字数/行数/非空行/UTF-8 字节）、convertTextCase（大小写与命名风格转换）、sortLines、dedupeLines，供 TextTab 与单测复用
- `updateHelper.js`：语义化版本解析/比较、GitHub Release 响应归一化和更新说明摘要，供 Settings 更新检查与主进程 IPC 支撑逻辑复用
- `agentWorkshopHelper.js`：Agent 研讨室与进程无关的纯逻辑——常量/状态枚举、就绪态与配置派生（readyAgents、三态 agentCardState、moderator 默认与回退、validateStart、主进程侧 validateStartParams）、代理配置（DEFAULT_PROXY_CONFIG、normalizeProxyConfig、validateProxyConfig，及 `PROXY_ENV_MAP` 表驱动的 `buildAgentEnvironment`——启用时按开关注入大小写 `HTTP(S)_PROXY`/`ALL_PROXY`，关闭时清理继承的代理变量）、调用次数估算（2n+1）、三阶段 prompt 构造（含只读/plan-only/不反问约束）、minimal 仓库上下文、研讨记录 Markdown 导出；渲染进程与主进程双向 import、可单测
- `safeMarkdown.js`：`marked` 解析 + `DOMPurify` 消毒的安全 Markdown 渲染（剥离 `<script>`/`on*`/`javascript:`，外链补 `target=_blank`+`rel=noopener`），供 Agent 研讨室时间线 `v-html` 使用；测试在 jsdom 环境下运行

### 主要组件

- `ToolSearch.vue`：工具与操作关键词搜索，支持方向键、Enter、Esc 与焦点恢复。
- `useSendTo.js` / `TransferDialog.vue`：跨工具发送保留原目标集合；目标已有输入时确认替换、追加或取消，长度上限继续生效。
- `App.vue`：根组件，管理编辑器、数据、文本、编码、时间、生成、研讨室七类入口与独立设置；context-bar 直接显示具体任务，不重复父工具；维护最近工具、会话级子工具选择、主题、字号、最近文件和快捷键。macOS 使用 `Cmd+1-9/0`，Windows/Linux 使用 `Ctrl+1-9/0`；全平台 `Ctrl+Tab` / `Ctrl+Shift+Tab` 循环，`Cmd/Ctrl+K` 搜索；不拦截 macOS `Cmd+Tab`。
- `Header.vue` / `ContextNav.vue`：顶部七类文字导航与直接任务 chips，设置、搜索和主题独立；窄宽度可横向查看，保留 tooltip、accessible name 与键盘操作。当前任务图标、标题和说明在页面标题展示。
- `StatusBar.vue`：底部状态栏，必须覆盖全部一级工具名称。
- `EditorTab.vue`：默认首个工具；Markdown/HTML 默认目录、编辑、预览左右三栏，各栏独立开关，目录支持上下和左右滚动。按后缀切换 Markdown/HTML/纯文本；保留打开、保存、新建、导出、语法帮助和预览联动。`useEditorFile` 保留已命名文件的未保存草稿，防止迟到的读取覆盖新选择。
- `EditorWithLineNumbers.vue`：带同步行号的复用 textarea。
- `FileTree.vue` / `TreeNode.vue`：可复用的懒加载目录树，被 EditorTab 使用，支持 `editableExtensions` prop 过滤文件类型；当前统一编辑器传入空数组，不按编辑模式过滤。
- `MarkdownPreview.vue` / `HtmlPreview.vue`：Markdown 与 HTML 预览。
- `JsonTab.vue`：数据工具合集，提供 JSON / YAML / CSV / SQL / XML 子工具（子工具由 context-bar 导航条切换，页内无第三层导航）；JSON 主操作（格式化/压缩/校验/去除转义/转 YAML）平铺为一排主按钮，JSONPath 查询条按需展开；CSV 子工具支持 CSV ⇄ JSON 与只读表格预览，SQL / XML 子工具支持格式化与压缩
- `DiffTab.vue`：并排/统一差异视图，带滚动同步，使用 diff-match-patch 库
- `TextTab.vue`：文本处理通过页内模式选择器切换大小写、排序、去重，统计常驻输入面板；保留各模式结果，输入或配置变化后旧结果标记待更新。
- `RegexTab.vue`：正则测试器，结构化 `/pattern/flags` 输入、实时匹配、编辑/高亮预览双区、捕获组多色、匹配结果列表（与预览双向 hover 联动）、右侧速查抽屉；结果区分隔条支持指针和键盘调节，匹配经 `useRegexMatcher` 在 Web Worker 中执行
- `EncodeTab.vue`：编码工具合集，6 个子工具（Base64 / URL / JWT / Hash / 进制 / Unicode）由 context-bar 导航条切换；编解码类用「左源右果 + ⇄ 方向」实时计算，Hash 异步（generation 计数防过期响应），进制四框联动，纯逻辑全在 `encodeHelper.js`
- `GeneratorTab.vue`：生成器合集，子工具（UUID、随机密码、Lorem、二维码）由 context-bar 导航条切换，页内无横向子工具栏，纯逻辑在 `generatorHelper.js`
- `TimeTab.vue`：时间转换、Cron、多时区三个独立子任务，所有宽度仅呈现选中任务；时间转换包含实时概览和方向切换，保留秒/毫秒、全部格式与复制。各任务保留会话输入和结果，Cron 初始展示默认表达式解释及未来五次。
- `AgentWorkshopTab.vue`：Agent 研讨室标签，仅从现有前端状态派生「准备 / 运行 / 结果」三阶段；准备阶段展示配置与启动，运行/结果阶段展示进度和 Markdown 时间线；经 `window.electronAPI.agentWorkshop` 调用主进程，订阅 `agent-discussion:event` 事件流（卸载时取消订阅），用 `activeRunId` 区分本会话运行与恢复查看的旧记录，不改变 IPC、编排和持久化语义
- `SettingsTab.vue`：以常用设置、最近文件、快捷键、关于四个分区组织工作目录、主题、字号、平台感知快捷键、electron-store 持久化、GitHub Release 更新检查与统一消息弹窗结果展示。

### Composables 与 Worker

- `composables/useEditorFile.js`：编辑器打开、新建、真实保存/互斥、匿名替换 guard、named dirty 缓存、批量保存和关闭快照；固定命令由 App/Main 统一分发。
- `composables/useInputUndo.js`：清空、互换、预设或发送输入操作的一次局部撤销；后续编辑或工具上下文变化使快照失效，不替代系统编辑撤销。
- `composables/useRegexMatcher.js`：封装正则匹配 Worker 的生命周期，维护完整输入签名，输入变化立即失效旧结果，丢弃乱序响应，超时（1.5s）通过 `terminate` 兜底并重建待命 Worker，组件卸载时释放，避免灾难性回溯冻结 UI。
- `workers/regex.worker.js`：子线程内调用 `regexHelper.runRegex` 执行匹配，通过 `postMessage` 回传位置数组。

## 构建系统

electron-vite 构建三个独立 bundle：

- `out/main/main.js`：主进程（ESM）
- `out/preload/preload.mjs`：预加载脚本
- `out/renderer/`：渲染进程生产产物；开发模式通过 Vite 开发服务器提供

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

`theme` 可选 dark/light/system，用户偏好与 effective theme 分离；初始化读取完成前不写回，只保存实际变化的允许键。旧配置 dark/light 原样保留，不猜测迁移为 system。窗口只保存 normal bounds 与 maximized，恢复时校验最小尺寸和显示区域。开发回归可设置 `ONEAPP_TEST_USER_DATA` 使用隔离配置（打包应用忽略此变量）。

菜单通过 preload 的固定 commands 接口分发新建、打开、保存、另存为、设置、搜索；编辑器不另绑相同 accelerator，避免双执行。composition 和应用内 modal 阻止命令穿透。生产打包应用不暴露 Reload/DevTools/F12。

## PDF 导出机制

PDF 导出创建隐藏的 `BrowserWindow` 渲染 HTML 内容，加载后使用 `printToPDF()` API 导出，以保留样式和布局。

## 样式约定

- 全局样式位于 `src/renderer/styles/main.css`。
- 深色 / 浅色主题通过 `App.vue` 设置 `<html>` 的 `data-theme` 属性切换，CSS 变量通过 `[data-theme="light"]` 覆盖。
- macOS 窗口使用 `titleBarStyle: 'hiddenInset'`，导航区域需要保留左侧约 78px 给红绿灯按钮；Dock 图标通过 `app.dock.setIcon()` 设置，应用名通过 `app.setName('OneApp')` 设置。
- UI 改造应优先复用全局 token 和共享样式，避免各页面重复发明按钮、面板和状态样式。

### 弹窗约定

- 简短结果、错误和研讨费用确认继续使用系统 `showMessageBox`；更新说明、语法帮助、发送确认和工具搜索等详情类弹窗使用 `AppDialog.vue`。
- 详情正文完整保留并独立滚动，标题和操作区固定；Esc、关闭按钮、Tab 焦点循环和关闭后焦点恢复必须一致。已有 modal 时延后更新提示，不叠加搜索。
- Release Markdown 经 `releaseNotes.js` 安全渲染，不嵌入远端媒体；外链仅允许 HTTPS，使用现有 `openExternal`。不得将完整说明压成摘要用于详情展示。

## 安全与边界

- 渲染进程不要直接使用 Node API；系统能力通过 preload 暴露的窄接口进入。
- 使用 `v-html` 时必须经过 `safeMarkdown.js` 等安全消毒，不直接渲染 agent 或仓库来源的不可信内容。
- HTML 源码保存保留原文；预览与 Markdown HTML/PDF 导出属于安全静态呈现，禁脚本。PDF 临时窗口无 preload、禁 JavaScript、启用 sandbox，finally 清理；主工作台 ESM preload 的 sandbox/runtime 升级见 `docs/macos-maintenance-assessment.md`，当前不能宣称已完成。
- Agent Workshop 的只读边界主要依赖 CLI 参数和权限模式，Git 状态检查只是咨询式二次防线，发现变化只提示不中断。
- 不要在 UI 改造中顺手修改 Agent Workshop orchestration、runner、IPC 或持久化逻辑。
