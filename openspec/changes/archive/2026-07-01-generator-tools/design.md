## Context

OneApp 当前采用左侧分组 workbench navigation、顶部 context bar 和共享 tool surface pattern。已有一级入口包含 Editor、JSON / YAML、Diff、Text Processing、Time、Regex、Encode、Agent Workshop 和 Settings。生成器合集一期需要新增一个低风险高频工具入口，同时不破坏现有 1~9 数字直达习惯。

生成器能力全部是纯前端离线逻辑，适合放在 `src/renderer/utils/` 中以纯函数实现，并通过 Vue 组件负责配置、输出和复制反馈。后续二维码生成会继续进入“生成工具”分组，因此本次导航设计要为该分组留出扩展空间。

## Goals / Non-Goals

**Goals:**
- 新增“生成工具”分组和“生成器”一级入口。
- 提供 UUID v4、随机密码和 Lorem 三类生成能力。
- 生成逻辑保持离线、可单测、无主进程依赖。
- 页面遵循现有 tool surface 视觉与响应式策略。
- 扩展数字快捷键，让第 10 个一级入口可通过 Ctrl/Cmd+0 访问。
- 同步 README、ROADMAP、CHANGELOG 和 OpenSpec 主规格。

**Non-Goals:**
- 不实现 UUID v7、密码强度评分、密码短语或生成历史。
- 不实现二维码生成。
- 不引入账号、云同步、外部 API 或主进程持久化。
- 不重构现有工具的功能语义。

## Decisions

1. **新增 GeneratorTab + generatorHelper**

   生成规则放入 `src/renderer/utils/generatorHelper.js`，Vue 组件只管理用户配置、结果展示、错误状态和复制。这样与现有 `jsonHelper.js`、`textHelper.js`、`encodeHelper.js` 模式一致，便于单元测试。

2. **使用 Web Crypto 生成随机值**

   UUID v4 和随机密码使用 `crypto.getRandomValues`。如果测试环境缺少 Web Crypto，则 helper 内部提供可注入随机源，测试使用确定性随机源，不在生产代码中降级到 `Math.random`。

3. **生成器作为第 10 个一级入口，快捷键使用 Ctrl/Cmd+0**

   保留现有 Ctrl/Cmd+1~9 映射，新增生成器入口使用 Ctrl/Cmd+0。导航数据允许 `shortcut` 为数字 0，并让快捷键排序逻辑将 0 视为第 10 位。这样不会改变已有用户肌肉记忆，也不会让新增工具失去键盘入口。

4. **生成器内部采用子工具 segmented control**

   UUID、密码、Lorem 在同一页面内用顶部 segmented control 切换。每个子工具展示自己的配置表单和结果面板，复制反馈复用 `useCopyToast`。这比新增多个一级入口更符合“收敛成合集”的全局决策。

5. **Lorem 采用内置词库**

   Lorem 使用一组内置英文占位词组合词、句、段。第一版不做中文假文、不做模板管理，也不引入外部依赖。

## Risks / Trade-offs

- [Risk] Web Crypto 在 Node 测试环境和浏览器环境 API 形态不同。 → Mitigation: helper 使用可注入随机源，默认读取 `globalThis.crypto`，测试覆盖 deterministic source。
- [Risk] 新增第 10 个一级入口会让快捷键说明和导航排序出现不一致。 → Mitigation: 将快捷键格式化和排序集中在 `navigation.js`，同步 Settings、README 和 workbench spec，并保留现有 1~9 映射不变。
- [Risk] 密码选项可能组合为空，例如全部字符集关闭。 → Mitigation: helper 返回结构化错误，UI 禁用或显示明确错误。
- [Risk] 批量生成数量过大可能造成 UI 卡顿。 → Mitigation: 第一版设置合理上限，并在 helper 中校验数量范围。

## Migration Plan

- 在功能分支中新增 OpenSpec change、组件、helper、测试和文档。
- 归档时将 `generator-tools`、`workbench-shell` 和 `tool-surface-refresh` delta 合并进主 specs。
- 发布后用户可通过左侧“生成工具”分组进入生成器；原有工具入口和 1~9 快捷键保持不变。
- 若需回滚，可移除生成器入口、组件和 helper，恢复 navigation 中第 10 个快捷键映射不会影响 1~9。

## Open Questions

无。当前范围和不做范围已在 roadmap 设计文档中确认。
