## Context

复用 named draft Map、读取序列、保存快照、现有 AppDialog、结果 stale 与 Agent abort。详见 proposal.md。单分支交付由用户明确要求。

## Goals / Non-Goals

Goals：普通操作保护会话稿、可信反馈、受控呈现、原生核心菜单、现有输入可用面积与键盘改善。
Non-Goals：正文落盘恢复、多文档、多设置窗口、runtime/CI/签名升级、真实付费 Agent 调用。

## Decisions

- 编辑器增加响应式 savedContent 和 dirty 列表；保存互斥，匿名 guard 处理输入快照，另存目标在写盘前检查缓存冲突。批量关闭按快照许可避免反复提示。
- main 使用单次关闭 request ID，renderer 只解决 dirty，main 再停止 Agent 并重核 dirty；不响应或超时保持窗口。正式 run 与 connection 共享活动槽和 idle Promise。
- M1 以 main 内真实路径集合校验用户选择的文件/目录/保存目标；最近记录在目录外重新通过系统面板授权，不建设权限对象平台。
- IPC 使用主窗口/main frame/精确 URL 校验；配置允许键类型。sender 校验不等于文件授权。PDF 静态窗口禁 JS 并 finally destroy。
- Markdown DOMPurify 与链接委托、HTML iframe 静态呈现，各资源策略分离。原 HTML 保存不改变源码。
- 核心菜单固定 ID，renderer 统一执行；native 菜单拥有快捷键时不再重复监听。配置初始化完成后按变化 key 写回。窗口仅 bounds/maximized，恢复交集检查。
- 编辑器只增加局部分隔条和 wrap 开关，窄窗可收起，行号按实际换行高度排列。压缩页标题，保留导航。
- 错误不进入 output；随机生成成果不 stale，QR 继续 stale。破坏性输入操作记录一份局部快照，用户编辑后立即失效。

## Risks / Trade-offs

- 外部编辑冲突/崩溃恢复不保证；普通关闭保护不覆盖强退。
- 文件授权集合限制到用户选择的真实文件/目录；不声称消除所有本地文件系统竞争。M2 升级仍为独立工作。
- HTML 静态预览不执行脚本；受控外链仅 HTTPS，相对文件链接提示不支持。
- 本机仅 macOS，Win/Linux 生命周期仍需对应平台烟测。

## Migration Plan

旧 dark/light 不变，system 为新选项；未知配置安全回退，不删除数据或初始化写回。无内容格式迁移。测试使用独立 userData，不读取真实最近文件。
