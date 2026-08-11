## 1. Shell 与快捷键基础

- [x] 1.1 将一级工具数字直达与循环切换规则集中到 `navigation.js`，让 macOS 使用 `Cmd+1…9/0` 数字直达、所有平台使用 `Ctrl+Tab` / `Ctrl+Shift+Tab` 循环切换，并补充单测
- [x] 1.2 将 navigation collapsed 状态提升到 shell 层，实现约 900px 以下自动收起、当前会话手动覆盖及受控的 Header 展开/收起交互
- [x] 1.3 为一级导航补充当前页面语义、准确 tooltip/label，并确保 compact 状态下名称与快捷键信息仍可访问
- [x] 1.4 固定 context bar 与全局 status bar，明确各工具页主要滚动容器，消除 shell 与页面根之间的竞争性纵向滚动

## 2. 共享视觉与可访问交互基础

- [x] 2.1 扩展实际被模板引用的 tool page、command bar、panel、empty state、status 和 responsive primitive，形成双栏转换器、配置 + 结果、任务流三类布局基础
- [x] 2.2 调整深浅主题次要文字、placeholder、行号和快捷键 token，使必要小号文字达到至少 4.5:1 对比度，并统一 scrollbar token 与 focus indicator
- [x] 2.3 实现可复用的更多操作菜单，支持 Enter/Space、方向键、Escape、外部点击、disabled item 和焦点回归
- [x] 2.4 为 segmented control、互斥选择、独立 toggle、icon-only button 与必要内部滚动区补齐匹配行为的原生/ARIA 语义
- [x] 2.5 收敛页面状态职责：全局 status bar 接收短反馈，panel 内仅保留结果相关 error、warning、running、ready 与 copy toast

## 3. Editor、Data Tools 与 Diff

- [x] 3.1 将 Editor 的列表、编辑、预览控制改为可并存的面板显示开关，并保持打开文件、mode 推断、预览与导出行为不变
- [x] 3.2 将 Editor 新建入口改为可复用的键盘菜单，覆盖 Markdown、HTML、纯文本选择和焦点恢复
- [x] 3.3 重排 Data Tools command bar：每种数据模式保留一个主操作，将低频操作放入更多菜单，并把复制/清空移到输出 panel 上下文
- [x] 3.4 去除 Data Tools 重复空态/状态条，并验证 JSONPath、CSV 表格预览、JSON/YAML、SQL/XML 现有结果与错误反馈不变
- [x] 3.5 强化 Diff primary button 的 disabled 状态和未对比空态，禁用或解释无结果时的并排/统一视图控制，同时保留可逆编辑与显式计算流程

## 4. Text Processing、Encode 与 Generator

- [x] 4.1 将 Text Processing 统计结果改为紧凑指标卡，转换/排序/去重继续使用统一输入输出模板，并移除与全局 status bar 重复的空反馈
- [x] 4.2 重构 Encode 双向工具的方向控件，使当前编码/解码状态与切换动作分别可理解，并为所有子工具补充有上下文的空输出提示
- [x] 4.3 让 Encode 子导航和双栏内容在紧凑宽度下转为低占宽导航与上下布局，保持 JWT、Hash、进制和 Unicode 结果结构不变
- [x] 4.4 让 Generator 配置 panel 按当前子工具内容自适应尺寸，在紧凑宽度按配置、生成、结果顺序堆叠，并为 UUID、密码、Lorem、二维码补充空结果提示

## 5. Time 工具结构与 Cron 初始状态

- [x] 5.1 将 Time 页面重组为当前时间、时间转换、Cron、时区四个带选中语义的子工具，默认展示当前时间概览
- [x] 5.2 保持各 Time 子工具在页面生命周期内的输入、选项与有效结果，确保 800×600 下当前任务的输入、主操作和主结果可直接访问
- [x] 5.3 在首次进入 Cron 子工具时自动解释合法默认表达式，并保留显式重新解释、字段错误和未来执行时间行为
- [x] 5.4 新增或调整 Time/Cron 单测，覆盖默认自动解释、子工具切换状态保持和现有解析错误场景

## 6. Regex 一致性与结果空间

- [x] 6.1 为 Regex flags 添加完整名称、开启/关闭状态与键盘切换语义，保留现有 pattern/flags 计算结果
- [x] 6.2 让 matcher 与渲染层记录完整输入签名，在 debounce 等待和 Worker 乱序时清除或隐藏不匹配当前输入的旧高亮与结果列表
- [x] 6.3 实现有最小/最大范围的结果区分隔控件，支持指针拖动、键盘调整、恢复默认和紧凑窗口自然堆叠
- [x] 6.4 补充 Regex composable/组件测试，覆盖输入快照一致性、陈旧响应丢弃、flag 状态和分隔控件键盘行为

## 7. Agent Workshop 三阶段前端

- [x] 7.1 仅使用现有前端状态派生准备、运行、结果阶段，重排 repository、agent、moderator、idea、progress 与 timeline，不修改 IPC 或记录结构
- [x] 7.2 让准备阶段的开始研讨操作保持可见，让运行阶段突出进度/timeline/停止操作，并避免配置栏独立纵向滚动
- [x] 7.3 在结果与历史记录状态中合并重复的新研讨、导出和 timeline 入口，保持 succeeded、failed、canceled、interrupted、unsupported 状态可区分
- [x] 7.4 回归验证启动、停止、历史恢复、进度跳转、导出和事件取消订阅，并确认 `electron/agentWorkshop/`、preload API 与持久化语义无改动

## 8. Settings 与跨页面收尾

- [x] 8.1 将 Settings 的主题/字号压缩为高频设置区，将最近文件改为稳定行列表，并用二级分区组织快捷键和关于信息
- [x] 8.2 让 Settings 的快捷键帮助从共享定义生成，明确展示 `Ctrl+Tab` / `Ctrl+Shift+Tab` 和当前平台数字直达组合
- [x] 8.3 检查十个一级页面的 active、selected、pressed、disabled、error、warning、running 状态，确保不只依赖颜色且 icon-only control 均有名称
- [x] 8.4 删除本次迁移后未被模板引用的旧页面状态条样式与重复 CSS primitive，避免保留死代码

## 9. 验证与文档

- [x] 9.1 运行相关组件/helper 单测并修复本次变更引入的回归
- [x] 9.2 运行 `npm test`，区分环境相关 flaky 与真实回归，确保全量单测通过
- [x] 9.3 运行 `npm run build`，确认 main、preload、renderer 三个 bundle 构建通过
- [x] 9.4 实际启动 App，在深色/浅色、14px/18px、1200×800/800×600 下 smoke test 十个一级页面、导航自动/手动收起、键盘焦点与关键操作流程
- [x] 9.5 对照 specs 复核无多行 command bar 挤压、无竞争性滚动、无页面级横向溢出，并记录必要截图作为 review 证据
- [x] 9.6 按实现结果同步 README、CLAUDE.md、AGENTS.md 中受影响的页面结构或快捷键说明；若无文档语义变化则记录无需修改
