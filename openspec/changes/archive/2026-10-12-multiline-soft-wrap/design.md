## Context

见 proposal.md 的动机。数据工具共用 JsonTab，输入显式 wrap=false、输出使用默认 wrap=true，左右不一致。EditorWithLineNumbers 已有镜像逐行测量，但文本区与镜像没有完整共用排版规则，测量还硬编码左右 padding 为 32px。普通 textarea 分散于编码、二维码与研讨描述。

## Goals / Non-Goals

**Goals:** 在现有 textarea 与共享行号组件内实现一致的软换行，保留原文与业务状态；按子工具使用既有草稿 Map 保存开关；让字号、宽度与滚动后的逻辑行号可靠对齐。

**Non-Goals:** 不引入编辑器框架、全局设置或磁盘迁移；不改动主进程、安全边界、研讨状态机、diff 结果行高和 CSV 表格。

## Decisions

1. 使用 wrap=soft 与 pre-wrap，必要时 overflow-wrap:anywhere；关闭换行时显式恢复 pre/normal。普通多行 textarea 采用共享 CSS，单行 input 不受影响。比输入时格式化更适合错误文本，也不会改变原文。
2. 数据工具 toolbar 添加固定名称“自动换行”的 aria-pressed 开关，输入及所有文本输出传入相同状态；将 wrapLines 纳入已有子工具草稿，默认 true，不额外持久化。
3. 文本区与镜像共用字体、行高、Tab 和断行规则；根据真实 padding 与可用宽度测量。通过 animation frame 合并重测，在 Vue DOM 更新后统一读取镜像高度；重新同步行号 scrollTop，并在卸载时取消 observer/待测任务。沿用每个逻辑行一个测量节点，不逐字符测量。
4. 复用文档编辑器现有开关，文本对比输入沿用共享组件默认状态；正则高亮仅统一断行规则，不改变匹配算法与坐标。

## Risks / Trade-offs

- [长串折行与行号测量不一致] → 文本及镜像使用同一排版规则，在真实 Electron 中覆盖中文、Tab、空行、字号和窄窗口。
- [大文本测量成本] → 每帧合并测量、统一写后读，使用较大样本烟测；保留关闭换行能力。
- [视觉折行被误认为真实行] → 只编号逻辑行；自动换行不触发内容修改或结果失效。

## Migration Plan

完整验证、审查与 OpenSpec 归档后发布 patch 1.31.2，无配置或数据迁移。回退应用版本即可恢复旧呈现，原始数据不受影响。
