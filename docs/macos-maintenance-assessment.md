# macOS 优化后的维护评估

本轮遵循 2026-10-08 优化方案：R/U 首期实现，M1 在可靠性修复后落实；M2 先核验兼容性，再作为独立 runtime 批次。E 中设置窗口、Finder 关联/拖放、CodeMirror/查找、多文档、崩溃恢复、后台研讨、diff 增强和图片隐私策略均为后续候选，不作为本次验收完成条件。

## M1 文件授权

文件 IPC 校验来源之外，main 维护用户通过系统面板选择的文件、工作目录及保存目标集合。启动恢复已配置工作目录；最近记录不自动授予文件权限，目录外的记录需系统面板重新选择。每次读写/目录遍历复核真实路径，通过 path.relative 判断目录边界；新保存文件校验真实父目录，拒绝悬空链接及未存在父目录。授权集合仅在当前进程中维护，不保存工具正文或通用文档句柄。

同一用户工作目录内的文件仍可通过合法 API 访问；这不是对恶意本地进程、瞬时文件系统竞争或系统强退的完整防护。选择目录意味着该目录内合法文件操作的授权。后续 Finder/拖放入口必须复用集合。独立文件重新启动后通过最近入口重新授权。

## M2 Electron 与 renderer sandbox

package.json 使用 Electron ^28.3.3。Electron 官方只维护最近三个稳定主版本，旧线不再受支持（[版本支持策略](https://www.electronjs.org/docs/latest/tutorial/electron-timelines)）。因此 Electron 28 必须进入优先 runtime 升级批次，本轮没有声称运行时已更新，也不预设未经兼容验证的目标版本。

当前 main 采用 ESM，electron-vite 2 的 preload 构建产物为 `.mjs`，包含 `import ... from "electron"`。官方规定 sandbox preload 不支持 ESM imports（[ESM 支持矩阵](https://www.electronjs.org/docs/latest/tutorial/esm)）；故不能直接将主窗口 sandbox 改 true。此轮已将 preload 的 HOME 环境读取移至窄 main API，外链也已移至 main；剩余 bridge 只有 contextBridge/ipcRenderer。下一批先输出 CommonJS preload，再启用 renderer sandbox，并在受支持 runtime 上核验全部 IPC、文件 I/O、PDF、Worker、Agent 检测/停止与各平台打包。[sandbox 行为](https://www.electronjs.org/docs/latest/tutorial/sandbox)明确 sandbox 不能替代文件 IPC 授权。

本轮 PDF 临时窗口单独启用 sandbox、禁脚本、无 preload，并限制静态资源及 finally 清理。主工作台仍保留 sandbox:false，列为未完成的独立安全维护工作；当前 UI/保存修复不能作为 runtime 安全升级的替代。

## M3 性能与分发

本轮不提出量化性能改善，也不增加 Worker/虚拟列表/全面懒加载。签名、公证、自动更新和 CI 属于独立分发工程；没有访问账号/证书或改动发布流程。v-show 的会话保留继续保持。安装包 arm64/x64、Windows/Linux 对应烟测在 runtime/分发批次补验。
