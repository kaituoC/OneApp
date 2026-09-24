## Context

详见 proposal。现有系统消息框只支持纯文本，更新摘要的空白压缩会消除段落；语法帮助为普通 div，其他详情使用独立 dialog 实现。

## Goals / Non-Goals

Goals：完整说明可读；详情弹窗统一焦点、Esc、可见操作和受限尺寸。
Non-Goals：不改变更新频率/版本比较、Agent 费用确认、下载流程和权限，不新增依赖。

## Decisions

- 使用共享 AppDialog（原生 dialog + Teleport）承载更新、语法、发送和搜索，固定头尾、单独滚动正文；不把长 Markdown 塞入系统消息框。
- 新增 notesMarkdown 字段保留完整 Release body，notesSummary 保留兼容；renderer 安全渲染 Markdown，阻止内嵌媒体和不安全链接，HTTPS 外链经既有 openExternal 打开。
- 有 modal 时延后显示自动更新详情，关闭后恢复焦点；搜索快捷键不叠加 modal。
- 发送确认展示完整纯文本，保留原替换/追加/取消语义。

## Risks / Trade-offs

- 外部 Markdown 内容 → 消毒并限制链接协议，阻止媒体自动加载。
- 组件隐藏/卸载或连续开关 → Teleport、卸载监听清理、打开状态复核与回归测试。
- 小窗口内容溢出 → max-height、正文 overflow 与固定按钮，800×600 深浅主题烟测。
