# OneApp 剩余功能开发队列设计

## 背景

本设计用于收敛 OneApp 当前 ROADMAP 中剩余待开发功能，明确后续每个需求的范围、顺序和自动推进边界。后续每个功能仍保持“一条分支、一个 OpenSpec change、一次独立发布”的节奏。

## 全局决策

- 后续小工具入口采用合集策略，避免继续膨胀左侧一级导航。
- 数据类工具逐步收敛到“数据工具”合集，现有 JSON / YAML 后续作为其中一个子工具。
- 生成类工具收敛到新的“生成工具”分组，二维码作为后续增强进入同一分组。
- 时间类增强并入现有时间工具，不新增一级入口。
- 每个功能完成后独立发布：OpenSpec propose -> apply -> archive -> 测试构建 -> 升版本 -> PR -> 合并 -> Release。
- 每个功能默认是新功能，版本影响预估为 minor；若实际只涉及小修补，再按语义化版本下调。
- 自动推进模式下，最终验证通过后直接执行本地提交、push、PR、合并、tag 和 Release；执行每个外发动作时必须明确告知用户。

## 自动推进队列

### 1. 生成器合集一期

- 建议 change name：`generator-tools`
- 建议 branch name：`feature/generator-tools`
- 流程类型：完整 OpenSpec 流程
- 版本影响：minor

范围：
- 新建“生成工具”分组和“生成器”入口。
- UUID v4 单个生成和批量生成。
- 随机密码生成，支持长度、大小写、数字、符号、排除易混字符。
- Lorem 占位文本生成，支持按词、句、段生成。
- 纯前端离线生成，支持复制结果。

不做范围：
- UUID v7。
- 密码强度评分。
- 密码短语。
- 生成历史。
- 二维码。

验收标准：
- 用户可以在左侧“生成工具”分组进入生成器。
- 三类生成器互不干扰，切换配置后能立即生成符合条件的结果。
- 批量 UUID 每行一个，且符合 v4 格式。
- 密码选项组合为空或不可生成时有明确提示。
- Lorem 支持词、句、段数量控制。

验证命令：
- `npm test`
- `npm run build`
- 生成器相关单测
- UI smoke test 覆盖深色和浅色主题

### 2. 检查更新与统一弹窗

- 建议 change name：`app-update-check-dialogs`
- 建议 branch name：`feature/app-update-check-dialogs`
- 流程类型：完整 OpenSpec 流程
- 版本影响：minor

范围：
- 设置页“检查更新”请求 `kaituoC/OneApp` 最新 GitHub Release。
- 比较当前 `__APP_VERSION__` 与最新 `tag_name`。
- 按钮点击后禁用并显示检查中状态，完成后用统一弹窗展示结果。
- 新增主进程统一消息框 IPC，默认使用 OneApp 应用图标。
- 替换设置页原生 `alert`。
- 替换 Agent 研讨室成本提示的原生 `confirm`。

不做范围：
- 不接入 `electron-updater`。
- 不自动下载、安装或提示重启。
- 不重构全项目所有未来提示场景。
- 不改变 Agent 研讨室主进程编排、只读约束、记录持久化和事件订阅行为。

验收标准：
- 无新版时提示“已是最新版本”。
- 有新版时展示版本号、发布日期、更新说明摘要，并提供打开 Release 页面入口。
- 网络或接口失败时有清晰错误提示。
- 统一弹窗在 macOS / Windows / Linux 打包路径下能找到应用图标，找不到时安全降级。

验证命令：
- `npm test`
- `npm run build`
- 设置页更新检查 UI smoke test
- Agent 研讨室开始前成本确认 smoke test

### 3. 数据工具合集一期：CSV / JSON / 表格预览

- 建议 change name：`data-tools-csv-json`
- 建议 branch name：`feature/data-tools-csv-json`
- 流程类型：完整 OpenSpec 流程
- 版本影响：minor

范围：
- 将现有 JSON / YAML 入口升级为“数据工具”合集。
- 保留 JSON / YAML 子工具能力。
- 新增 CSV 子工具。
- CSV -> JSON：输出对象数组，以表头作为 key。
- JSON -> CSV：支持对象数组，字段来自所有对象 key 的并集。
- 表格预览为只读，支持横向滚动。
- 引入成熟轻量 CSV 库，支持标准 CSV 规则。

不做范围：
- 不做表格单元格编辑。
- 不做排序筛选。
- 不做文件导入导出。
- 不做大文件虚拟滚动。
- 不做 SQL / XML / JSONPath。

验收标准：
- 标准 CSV 中的引号、字段内逗号、字段内换行、双引号转义能正确解析。
- CSV 列数不一致、空输入、JSON 非对象数组时有明确错误。
- JSON / YAML 原能力不回退。
- 数据工具合集导航、状态栏和快捷键说明一致。

验证命令：
- `npm test`
- `npm run build`
- JSON / YAML 既有测试
- CSV helper 新增单测
- 数据工具 UI smoke test

### 4. 数据工具合集二期：SQL / XML 格式化

- 建议 change name：`data-tools-sql-xml-format`
- 建议 branch name：`feature/data-tools-sql-xml-format`
- 流程类型：完整 OpenSpec 流程
- 版本影响：minor

范围：
- 在“数据工具”合集内新增 SQL / XML 子工具。
- SQL 支持格式化和压缩。
- XML 支持格式化和压缩。
- 错误提示覆盖明显结构问题。
- 优先使用成熟轻量格式化库。

不做范围：
- 不做 SQL 方言语义校验。
- 不做数据库连接。
- 不做 XML Schema / DTD 校验。
- 不做 XPath。

验收标准：
- SQL 格式化输出稳定、可复制。
- XML 格式化保持节点结构，明显不闭合等结构问题有提示。
- 压缩操作能去除无意义空白但不破坏内容。

验证命令：
- `npm test`
- `npm run build`
- SQL / XML helper 单测
- 数据工具 UI smoke test

### 5. JSON 工具增强：JSONPath 查询

- 建议 change name：`jsonpath-query`
- 建议 branch name：`feature/jsonpath-query`
- 流程类型：完整 OpenSpec 流程
- 版本影响：minor

范围：
- 在数据工具的 JSON 相关区域新增 JSONPath 查询能力。
- 输入 JSON 和 JSONPath 表达式。
- 展示匹配数量。
- 列表展示每个结果的路径和值摘要。
- 输出完整匹配结果 JSON。

不做范围：
- 不做原 JSON 树高亮。
- 不做批量修改。
- 不做可视化路径选择器。

验收标准：
- JSON 无效、JSONPath 无效、无匹配时分别有明确状态。
- 查询结果列表与输出 JSON 一致。
- 复杂对象和数组路径可读。

验证命令：
- `npm test`
- `npm run build`
- JSONPath helper 单测
- 数据工具 UI smoke test

### 6. 时间工具增强一期：Cron 表达式解释器

- 建议 change name：`cron-expression-helper`
- 建议 branch name：`feature/cron-expression-helper`
- 流程类型：完整 OpenSpec 流程
- 版本影响：minor

范围：
- 并入现有时间工具。
- 支持标准 5 位 Cron：`分钟 小时 日 月 星期`。
- 使用本地时区。
- 展示人类可读解释。
- 展示未来 5 次执行时间。

不做范围：
- 不支持秒字段。
- 不支持 Quartz 年份字段。
- 不支持时区选择。

验收标准：
- 合法表达式能给出解释和未来 5 次时间。
- 非法字段、范围越界、无法计算时有明确错误。
- 不影响现有时间戳互转功能。

验证命令：
- `npm test`
- `npm run build`
- Cron helper 单测
- 时间工具 UI smoke test

### 7. 生成器增强：二维码生成

- 建议 change name：`qr-code-generator`
- 建议 branch name：`feature/qr-code-generator`
- 流程类型：完整 OpenSpec 流程
- 版本影响：minor

范围：
- 并入“生成工具”分组。
- 输入文本或 URL 生成二维码预览。
- 支持尺寸设置。
- 支持纠错级别设置。
- 支持下载 PNG。
- 支持复制 PNG。

不做范围：
- 不做 Logo。
- 不做颜色、圆角等品牌样式。
- 不做图片识别或扫码解析。

验收标准：
- 空输入时不生成并提示用户。
- 不同尺寸和纠错级别能重新生成二维码。
- 下载 PNG 和复制 PNG 可用。

验证命令：
- `npm test`
- `npm run build`
- 二维码 helper 单测
- 生成工具 UI smoke test

### 8. 时间工具增强二期：多时区对照表

- 建议 change name：`timezone-board`
- 建议 branch name：`feature/timezone-board`
- 流程类型：完整 OpenSpec 流程
- 版本影响：minor

范围：
- 并入现有时间工具。
- 预置常用时区 / 城市。
- 支持添加和移除城市。
- 实时显示当前时间。
- 显示日期差异，例如今天、明天、昨天。

不做范围：
- 不做会议时间换算。
- 不做办公时间重叠分析。
- 不做复杂时区数据库编辑。

验收标准：
- 预置城市打开即有可用对照。
- 添加和移除城市即时生效。
- 日期差异显示正确。
- 不影响现有时间戳互转和 Cron 功能。

验证命令：
- `npm test`
- `npm run build`
- 多时区 helper 单测
- 时间工具 UI smoke test

## 自动推进入口要求

开始任一功能前，需要在 explore / propose 阶段再次确认：

- 当前工作区干净，且基于最新 `main` 创建功能分支。
- OpenSpec CLI 可用：当前确认版本为 `1.3.1`。
- 需求范围、change name、branch name、验收标准和验证命令未发生变化。
- 自动推进会在最终验证通过后执行本地提交、push、PR、合并、tag 和 Release。
- 执行本地提交、push、PR、合并、tag 和 Release 等动作时，agent 必须先明确告知用户。
