## 为什么

OneApp 已经从一组轻量开发小工具，成长为包含统一 Editor、文本/数据处理工具和 Agent Workshop AI 规划流程的 developer workbench。当前横向 tab bar 和偏默认控件的界面不再能清晰表达这个产品形态，Agent Workshop 也需要比普通顶部 tab 更醒目的入口。

## 变更内容

- 将顶部横向 tab bar 替换为新的 app workbench shell：左侧主导航 + 顶部 context bar。
- 按用户意图组织导航：工作区编辑、数据处理、文本调试、AI、系统设置。
- 将 Agent Workshop 作为 AI 分组下的核心入口突出呈现。
- 引入图标库，用于导航和紧凑命令控件。
- 建立专业冷静、略带科技感的视觉语言：优化 dark/light theme、克制的 accent、统一 panel、command bar、button、form control、empty state、status chip 和 timeline surface。
- 刷新所有一级页面，使 Editor、JSON、Diff、Time、Regex、Encode、Agent Workshop 和 Settings 整体一致。
- 变更范围限定在 UI、information architecture 和 interaction polish；不重写现有工具算法、Electron IPC 或 Agent Workshop orchestration。
- 修复探索阶段发现的可见一致性问题，包括 status bar 缺少 Agent Workshop 标签名、Settings 快捷键仍写作 1-7。

## 能力影响

### 新增能力

- `workbench-shell`：应用级 workbench shell、主导航、图标使用、theme token、全局 command/status surface 和 AI 分组。
- `tool-surface-refresh`：内置工具页的共享 visual/interaction pattern，包括 Editor panel、input/output tool、Settings 页面和 Agent Workshop 展示状态。

### 修改能力

- `agent-workshop`：更新导航要求，使 Agent Workshop 在新的 workbench shell 中作为核心 AI 入口呈现，而不是位于「Encode」和「Settings」之间的普通顶部 tab。

## 影响范围

- 受影响的 Renderer 文件包括 `src/renderer/App.vue`、`src/renderer/components/Header.vue`、`src/renderer/components/StatusBar.vue`、`src/renderer/styles/main.css` 以及 `src/renderer/components/` 下的一级页面组件。
- `package.json` 和 `package-lock.json` 会新增图标依赖 `lucide-vue-next`。
- 现有 Renderer 状态、键盘切换、文件操作、JSON/Diff/Regex/Time/Encode 工具函数和 Agent Workshop main process orchestration 应保持功能不变。
- 实现后需要进行聚焦的 UI regression check，并运行现有 unit tests，防止行为回归。
