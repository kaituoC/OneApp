## Why

OneApp 已覆盖 JSON/YAML、编码、正则和 diff 等开发高频场景，但缺少面向普通文本清洗的轻量工具。新增文本处理工具可以补齐统计、大小写转换、按行排序和去重等日常操作，减少用户在外部编辑器或命令行之间切换。

## What Changes

- 新增一级工具「文本处理」，位于「文本调试」分组中「文本对比」之后、「正则」之前。
- 新增文本统计能力：字符数、字数、行数、非空行数和 UTF-8 字节数。
- 新增大小写/命名风格转换能力：大写、小写、首字母大写、camelCase、PascalCase、snake_case、kebab-case。
- 新增按行排序能力：A-Z、Z-A。
- 新增按行去重能力：保留首次出现顺序，并展示移除行数、剩余行数等摘要。
- 同步数字快捷键：编辑器 1、JSON / YAML 2、文本对比 3、文本处理 4、时间工具 5、正则 6、编码 7、Agent 研讨室 8、设置 9。
- 不做正则替换/查找替换、自然排序/数字排序、选中文本局部处理，也不改主进程 IPC、文件读写或 Agent Workshop 逻辑。

## Capabilities

### New Capabilities
- `text-processing-tools`: 文本处理一级工具，覆盖统计、大小写/命名风格转换、按行排序和按行去重。

### Modified Capabilities
- `workbench-shell`: 数字快捷键覆盖范围与导航顺序新增「文本处理」入口。
- `tool-surface-refresh`: 文本处理工具作为新的一级工具遵循既有 tool surface、双栏和响应式布局规则。

## Impact

- 渲染层：新增 `TextTab.vue`，更新 `App.vue`、`navigation.js` 和状态栏/快捷键相关展示。
- 工具函数：新增纯函数 helper，供 UI 和单测复用。
- 测试：新增文本处理 helper 单测，必要时更新导航 metadata 测试。
- 文档与版本：更新 README、ROADMAP、CHANGELOG，版本号升级到 `1.13.0`。
- OpenSpec：新增 `text-processing-tools` spec，并对 `workbench-shell`、`tool-surface-refresh` 提供 delta。
