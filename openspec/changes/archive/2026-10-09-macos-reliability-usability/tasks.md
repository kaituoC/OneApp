## 1. 可靠性
- [x] 1.1 R1 真实保存、保存互斥、另存冲突与导出反馈
- [x] 1.2 R2 匿名 guard、缓存 dirty 列表与批量保存
- [x] 1.3 R4 Markdown/IPC/URL/CSP/PDF 边界
- [x] 1.4 R3/R5 关闭握手与 Agent 活动停止等待
- [x] 1.5 M1 文件选择授权集合/真实路径/最近重新授权
## 2. 易用性
- [x] 2.1 U1 核心菜单/统一命令/设置返回
- [x] 2.2 U2 配置容错、system 主题、最近文件、窗口恢复
- [x] 2.3 U3 本地原型、紧凑标题、分隔条、行号/换行
- [x] 2.4 U4 错误分离、成果语义、一次撤销
- [x] 2.5 U5 文件树键盘、输入名、焦点与反馈
- [x] 2.6 M2 runtime/sandbox 兼容性评估与独立升级清单
## 3. 验证与交付
- [x] 3.1 有意义单测与全部自动化检查
- [x] 3.2 本机隔离 App 实操回归与证据（主流程及真实系统外观切换通过；VoiceOver 已开启操作并恢复，用户人工听测确认播读正常）
- [x] 3.3 Review、修复、归档校验、版本文档、最终复验（归档已同步主规格；归档后354项单测、生产构建、29份主规格严格校验通过）
- [x] 3.4 清理产物与未提交状态报告

## 验收证据与明确缺项

本机回归报告：`doc_local/macos-regression-2026-10-08/report.md`（gitignored）。源码 Review：同目录 `review.md`。2026-10-09 最后代码/版本修改后 `npm test` 40文件354项全部通过，`npm run build` 成功。主流程和各工具实际操作、fake Agent成功/失败/取消/活动退出、800×600深浅主题与18px均已覆盖。

用户明确授权后完成系统外观浅→深→浅切换，OneApp 跟随系统联动通过，外观恢复浅色；VoiceOver 实际启用并执行焦点朗读指令/Tab/Esc，随后核实恢复关闭。当前工具不能监听音频或捕获其独立字幕；用户2026-10-09 03:09:29 UTC回复“读出正常”，补齐人工听测证据，U5通过。具体用户原话见本机报告目录 voiceover-human-confirmation.md；不将自动化或AX检查替代播读。多显示器/Win/Linux/安装包/真实网络服务未执行，明确列为后续专项。

归档位置：`openspec/changes/archive/2026-10-09-macos-reliability-usability/`。最终日志为本机报告目录 `tests-archive-final.log`、`build-archive-final.log`、`openspec-specs-archive-final.log`；15项tasks全部完成。没有commit/push/PR。
