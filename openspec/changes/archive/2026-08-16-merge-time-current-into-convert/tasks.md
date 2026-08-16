# merge-time-current-into-convert · 任务

## 1. 导航元数据

- [x] 1.1 `SUB_TOOLS.time` 移除 `current` 条目（4 → 3），确认 `DEFAULT_SUB_TOOL.time` 自动派生为 `'convert'`
- [x] 1.2 更新 navigation.js 中涉及 time 子工具的注释

## 2. TimeTab 合并

- [x] 2.1 live-section 的 `v-show` 条件从 `activeSection === 'current'` 归并为 `'convert'`，实时卡随时间转换子任务呈现
- [x] 2.2 props 默认 `subTool: 'current'` → `'convert'`；确认宽屏 scrollIntoView 锚点行为正常
- [x] 2.3 确认窄屏顺序为 实时卡 → 时间戳转日期 → 日期转时间戳，宽屏双列 grid 布局保持不变

## 3. 测试与构建

- [x] 3.1 检查并更新 `tests/navigation.test.js` 中 time 子工具相关断言（数量、默认值）——断言为通用遍历，无 current 硬编码，无需修改
- [x] 3.2 `npm test` 全量通过
- [x] 3.3 `npm run build` 通过

## 4. 手动验收（留待用户本地烟测）

- [ ] 4.1 `npm run dev`：时间转换页顶部实时卡常驻且每秒跳动、秒/毫秒切换与复制可用；Cron / 多时区不受影响；context-bar 动态段仅 3 个子工具 chips；深浅主题正常
