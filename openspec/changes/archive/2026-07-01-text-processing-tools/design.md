## Context

OneApp 现有一级工具多采用「纯 helper + Vue 组件 + navigation metadata」的结构：业务逻辑放在 `src/renderer/utils/`，组件负责输入输出和操作状态，导航/快捷键由 `src/renderer/utils/navigation.js` 单一来源管理。文本处理工具应延续这个模式，避免把文本转换规则散落在组件中。

当前工具数量为 8 个，数字快捷键覆盖 Ctrl/Cmd+1 到 Ctrl/Cmd+8。新增文本处理后需要扩展到 9 个，并调整 Time、Regex、Encode、Agent、Settings 的快捷键顺序。

## Goals / Non-Goals

**Goals:**
- 新增「文本处理」一级工具，位于「文本调试」分组中「文本对比」之后、「正则」之前。
- 提供统计、大小写/命名风格转换、按行排序、按行去重四类能力。
- 将文本处理规则实现为纯函数，并用单元测试覆盖边界。
- UI 复用现有 tool surface：command bar、segmented control、双栏 panel、status chip、copy toast 和响应式 stack。
- 更新导航、快捷键、状态栏、README、ROADMAP、CHANGELOG 和 OpenSpec。

**Non-Goals:**
- 不做正则替换、查找替换、自然排序、数字排序或选中文本局部处理。
- 不新增 runtime 依赖。
- 不改主进程 IPC、preload API、文件读写、Agent Workshop 编排或记录持久化。

## Decisions

### 1. 新增独立一级工具，而不是并入编码工具

文本处理面向内容清洗和行级批处理，编码工具面向格式编码/解码，两者用户心智不同。独立一级工具可以让统计、转换、排序和去重拥有更直接的入口，也避免继续增大 `EncodeTab.vue` 的复杂度。

### 2. 纯函数 helper 承载规则

新增 `textHelper.js`，提供文本统计、大小写转换、按行排序和按行去重函数。`TextTab.vue` 只维护当前子工具、输入、输出、选项和状态消息。这样可以用 Vitest 直接覆盖规则，也符合现有 `jsonHelper.js`、`encodeHelper.js`、`diffHelper.js` 的模式。

### 3. 大小写转换采用保守 token 化

命名风格转换先按英文字母、数字、中文字符片段进行 token 化，忽略分隔符和多余符号；中文片段在大小写转换中保持原样。`camelCase`、`PascalCase`、`snake_case`、`kebab-case` 基于 token 组合，不试图处理所有自然语言标题规则。

### 4. 排序与去重均按行处理

排序使用普通字符串比较，支持 A-Z 和 Z-A；第一版不做 locale/natural/numeric 排序。去重默认保留首次出现顺序，并返回移除数量、剩余行数和原始行数。第一版不提供忽略大小写/忽略首尾空白选项，避免 UI 选项过多。

### 5. 快捷键顺序由 navigation metadata 驱动

`navigation.js` 继续作为一级工具顺序、标签、说明和 shortcut 的单一来源。新增文本处理后，`TAB_KEYS` 自动覆盖 9 个工具；需要同步 README 和现有测试断言。

## Risks / Trade-offs

- [Risk] 命名风格转换规则不可能覆盖所有语言和符号组合 → Mitigation: 第一版采用明确、可测试的 token 化规则，文案不承诺自然语言级转换。
- [Risk] 大文本输入时实时统计可能频繁计算 → Mitigation: 统计逻辑保持 O(n)，转换/排序/去重由用户点击触发，避免每次输入都做重处理。
- [Risk] 新增一级工具导致快捷键变更 → Mitigation: README、StatusBar、导航 tooltip 和测试同步更新，确保用户可发现新的顺序。
- [Risk] UI 过度复杂 → Mitigation: 第一版只做四个子工具和少量按钮，复杂选项留给后续需求。
