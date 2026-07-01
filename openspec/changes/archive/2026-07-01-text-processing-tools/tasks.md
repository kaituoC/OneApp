## 1. 纯逻辑与测试

- [x] 1.1 为文本统计、大小写/命名风格转换、按行排序和按行去重添加单元测试
- [x] 1.2 实现 `textHelper.js` 纯函数，并保持无 runtime 依赖
- [x] 1.3 跑通相关单测，确认 TDD 红绿闭环

## 2. UI 与导航接入

- [x] 2.1 新增 `TextTab.vue`，提供统计、大小写、排序、去重四个子工具视图
- [x] 2.2 将「文本处理」接入 `navigation.js`、`App.vue` 和 `StatusBar`，并调整快捷键到 1-9
- [x] 2.3 保持 copy、clear、状态反馈和窄宽度双栏 stack 行为可用
- [x] 2.4 更新或新增导航/组件相关测试

## 3. 文档、版本与 OpenSpec

- [x] 3.1 更新 README、ROADMAP、CHANGELOG 和版本号到 `1.13.0`
- [x] 3.2 归档 OpenSpec change，合并新 spec 与 delta，并运行 `openspec validate --specs --strict`

## 4. 验证

- [x] 4.1 运行相关单测和完整 `npm test`
- [x] 4.2 运行 `npm run build`
- [x] 4.3 执行本地 UI smoke test，覆盖导航、统计、转换、排序和去重
