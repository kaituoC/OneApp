# workbench-nav-consolidation 提案

## Why

经代码分析与逐页截图验证，当前工作台存在四类 UI 一致性问题：三层导航叠加（Header 分组 → 左侧 contextual-nav → 页面内 segmented/横向菜单）、单工具分组无左侧 nav 导致切换时内容宽度跳变、context bar 固定 56px 且「深色/14px」chips 与设置页功能重复、数据工具高频操作（压缩/校验）被收进「更多」菜单且 JSONPath 条常驻占位、时间工具宽屏大面积空白。这些问题降低信息密度并让各工具页形态不一致，需要一次整体收敛。

## What Changes

- 左侧 contextual-nav 恒定渲染：全部 6 个分组（含单工具分组）一律显示左侧导航，消除分组切换时的内容宽度跳变。
- 子工具导航收敛进左侧 nav：数据工具（JSON/YAML/CSV/SQL/XML）、文本处理（统计/转换/排序/去重）、编码（Base64/URL/JWT/Hash/进制/Unicode）、生成器（UUID/密码/Lorem/二维码）、时间（当前时间/时间转换/Cron/多时区）的子工具入口并入左侧 nav 二级项，页面内 segmented 与横向子工具栏移除。统一后全局仅两层导航：Header 分组 + 左侧 nav。
- Context bar 收紧：高度从 56px 压缩为 40px，移除「深色/浅色」「字号」等与设置页重复的 meta chips，保留工具名、上下文描述与快捷键提示。
- 数据工具高频操作提升：JSON 模式的格式化/压缩/校验/反转义全部作为一排主操作按钮呈现，取消「更多」折叠；JSONPath 查询条默认折叠为按需展开。
- 时间工具宽屏适配：宽屏下四个子工具内容以双列 grid 呈现，窄屏单列堆叠，消除大面积空白与整页滚动。
- **BREAKING**（仅 UI 结构）：页面内 segmented 子工具导航被移除，子工具状态改由左侧 nav 驱动。

## Capabilities

### New Capabilities

（无新增能力，本次为既有能力的行为收敛）

### Modified Capabilities

- `workbench-shell`: 左侧上下文 navigation 由「多工具分组条件渲染」改为「全部分组恒定渲染」；context bar 不再展示与设置页重复的主题/字号 meta chips。
- `tool-surface-refresh`: 数据工具主操作层级调整为「格式化/压缩/校验/反转义并列主操作 + JSONPath 按需展开」；子工具导航从页面内 segmented/横向栏收敛进左侧 nav；Time 子工具宽屏双列呈现。

## Impact

- 渲染层组件：`App.vue`、`ToolMenu.vue`、`JsonTab.vue`、`TextTab.vue`、`EncodeTab.vue`、`GeneratorTab.vue`、`TimeTab.vue`、`Header.vue`（不改行为，仅确认分组导航不变）。
- 工具与测试：`utils/navigation.js`（新增子工具导航数据）、`tests/navigation.test.js`。
- 样式：`styles/main.css` 全局 token 复用，移除不再使用的 `tool-segmented` 页内引用（样式本体保留给仍在使用的场景）。
- 不改动：主进程、preload、各 helper 纯函数逻辑、Agent Workshop orchestration/runner/IPC/持久化。
