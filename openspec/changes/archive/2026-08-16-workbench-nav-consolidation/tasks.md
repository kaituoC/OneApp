# workbench-nav-consolidation 任务清单

## 1. 导航数据与壳层

- [x] 1.1 在 `utils/navigation.js` 新增 `SUB_TOOLS` 常量（json / text / encode / generator / time 五组子工具定义），并导出 `DEFAULT_SUB_TOOL` 默认子工具查找表
- [x] 1.2 `tests/navigation.test.js` 补充 `SUB_TOOLS` 覆盖五个工具、key 唯一、label 非空的断言
- [x] 1.3 `ToolMenu.vue` 支持 `children` 两级条目渲染与 `@select` 负载扩展（`{ key, subKey? }`）
- [x] 1.4 `App.vue` 左侧 nav 恒定渲染（移除 `hasContextualTools` 条件），接入 `SUB_TOOLS`，持有会话级 `activeSubToolByTab` 并通过 `:sub-tool` prop 下发
- [x] 1.5 `App.vue` context bar 收紧：高度 40px，移除主题/字号 meta chips，保留工具名、上下文描述与快捷键 chip

## 2. 工具页子导航收敛

- [x] 2.1 `JsonTab.vue` 移除页内 segmented 子工具栏，改为 `subTool` prop 驱动；JSON/YAML/CSV/SQL/XML 主操作平铺为一排主按钮，移除「更多」折叠
- [x] 2.2 `JsonTab.vue` JSONPath 查询条默认折叠为按需展开入口，展开后保留既有查询与结果反馈行为
- [x] 2.3 `TextTab.vue` 移除页内横向子工具菜单，改为 `subTool` prop 驱动统计/转换/排序/去重
- [x] 2.4 `EncodeTab.vue` 移除页内横向工具栏，改为 `subTool` prop 驱动六个子工具
- [x] 2.5 `GeneratorTab.vue` 移除页内横向子工具栏，改为 `subTool` prop 驱动 UUID/密码/Lorem/二维码
- [x] 2.6 `TimeTab.vue` 移除页内 segmented，改为 `subTool` prop 驱动；宽屏（≥1100px）四任务区双列 grid 并排，窄屏单列切换，清理失效 scoped 样式

## 3. 验证

- [x] 3.1 `npm test` 全量通过（重点 `navigation.test.js`；时区用例按环境因素判断）
- [x] 3.2 `npm run build` 编译通过
- [x] 3.3 `npm run dev` 截图烟测：深色 + 浅色主题 × 全部 10 个工具页，验证两层导航、子工具切换、Cmd+1~0 快捷键与 JSONPath 折叠行为（浅色全量关键页 + 宽屏双列已验证；深色截图被锁屏阻断，样式全部复用全局 token）

## 4. 收尾

- [x] 4.1 Code Review 修复高优先级问题并复跑 `npm test` + `npm run build`
- [x] 4.2 同步 CLAUDE.md / AGENTS.md 中「横向子工具栏」「条件化左侧导航」等过时组件描述，README 如提及导航形态一并更新
- [x] 4.3 升级 `package.json` 版本号（minor）并更新 CHANGELOG
- [x] 4.4 归档 change 并运行 `openspec validate --specs --strict`
