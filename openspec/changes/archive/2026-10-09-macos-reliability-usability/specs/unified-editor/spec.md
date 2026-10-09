## MODIFIED Requirements

### Requirement: Save/new keyboard shortcuts

应用 SHALL 统一通过原生菜单与固定 commands 执行 Ctrl/Cmd+S 保存、Ctrl/Cmd+N 新建；保存只在编辑器上下文可用，新建经匿名稿 guard。菜单 accelerator 与 renderer 不得重复执行，composition 与 modal 期间不得穿透；订阅必须成对解绑。

#### Scenario: Save shortcut
- **WHEN** 编辑器上下文中用户按 Ctrl/Cmd+S
- **THEN** 单次触发真实保存，失败或取消保留草稿

#### Scenario: Listener cleaned up on unmount
- **WHEN** 工作台卸载
- **THEN** 固定命令及状态订阅解绑，不再重复触发
