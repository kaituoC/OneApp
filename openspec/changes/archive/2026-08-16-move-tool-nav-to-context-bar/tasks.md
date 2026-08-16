## 1. 组件实现

- [x] 1.1 新建 `src/renderer/components/ContextNav.vue`：固定段渲染分组内全部工具 chips（图标 + 名称、active 态、title 使用 `getNavigationTooltip`），动态段渲染激活工具的子工具 chips（仅名称、active 态）
- [x] 1.2 ContextNav 两段各自 `role="radiogroup"` 并复用 `handleSegmentedKeydown` 键盘导航；chips 容器与 chip 显式 `-webkit-app-region: no-drag`
- [x] 1.3 ContextNav 样式：复用全局 token 与 `tool-segmented` 视觉语言，分隔符、横向滚动（`overflow-x: auto`）、深浅主题可用

## 2. App.vue 接线与侧栏移除

- [x] 2.1 context-bar 替换为 ContextNav（props: 当前分组工具、activeTab、activeSubTool；select 事件接现有 `handleNavSelect`），移除原工具图标 + 名称 + 描述 + 快捷键徽章的静态标题区
- [x] 2.2 移除 `contextual-nav` aside（含 `contextual-nav-header` 与 ToolMenu 引用）及 `ToolMenu` import
- [x] 2.3 清理 App.vue 中 `contextual-nav` / `contextual-nav-header` 全部样式与 760px 断点侧栏宽度规则；确认 `workbench-main` 占满全宽
- [x] 2.4 删除 `src/renderer/components/ToolMenu.vue`（唯一调用方已移除）

## 3. 规格与文档同步

- [x] 3.1 核对 delta specs 与实现一致（contextual-tool-navigation、workbench-shell）
- [x] 3.2 更新 `AGENTS.md`、`CLAUDE.md`、`README.md` 中"左侧两级工具导航 / contextual-nav"相关架构描述为 context-bar 横向工具导航

## 4. 验证

- [x] 4.1 `npm test` 全量通过；`npm run build` 编译通过
- [ ] 4.2 `npm run dev` 烟测：多工具分组（数据处理/文本调试）固定段 + 动态段切换与子工具记忆；单工具分组（工作区/生成工具/AI/系统）无侧栏直达内容；深浅主题；窄窗口横向滚动；键盘方向键导航；Cmd+数字直达与 Ctrl+Tab 循环正常
