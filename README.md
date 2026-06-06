# OneApp

多功能开发工具桌面应用，集成统一编辑器（Markdown / HTML 自动识别）、JSON 工具、文本对比、时间转换和正则测试功能。

## 功能特性

### 编辑器（Markdown / HTML）
- 按文件后缀自动识别类型：`.md` 使用 Markdown 预览（支持 GFM，双向滚动同步），`.html`/`.htm` 使用 iframe 沙箱实时预览（脚本/样式隔离）
- 文件管理：新建（Markdown / HTML 各有模板）、打开、保存、导出（Markdown → HTML / PDF）
- **目录树浏览**：侧边栏内像文件管理器一样浏览子目录、切换目录根、直接点开文件，按当前模式过滤显示对应类型
- **系统文件对话框**：可打开工作目录外的任意 `.md` / `.html` / `.htm` 文件
- 编辑器行号显示，可分别隐藏文件列表、编辑器或预览区

### JSON 工具
- JSON 格式化（美化）
- JSON 压缩（最小化）
- JSON 验证（语法检查，定位错误行/列）
- JSON 反转义处理
- 语法高亮显示

### 文本对比
- 并排对比模式：左右对照显示差异
- 统一对比模式：类似 git diff 格式
- 差异统计：新增、删除、修改行数
- 支持水平/垂直滚动同步

### 时间工具
- 实时显示当前时间和时间戳
- 时间戳转日期（支持秒/毫秒，多种输出格式）
- 日期转时间戳（同时输出秒和毫秒）
- 一键复制结果

### 正则测试器
- 结构化输入 `/ pattern / flags`，flags（g/i/m/s/u/y）可点击切换
- 实时匹配：编辑 pattern 或测试文本即时刷新结果
- 测试文本「编辑 / 高亮预览」分栏，匹配片段染色，多个捕获组用不同颜色
- 匹配结果列表（序号、位置、匹配值、各捕获组值），与预览高亮双向 hover 联动
- 右侧速查抽屉：常用模式（邮箱/URL/IP…点击填入）、语法元字符（点击插入光标处）、flags 说明
- 正则匹配在 Web Worker 中执行并设超时兜底，灾难性回溯也不会冻结界面

## 系统要求

| 操作系统 | 状态 | 版本要求 |
|----------|------|----------|
| **macOS** | ✅ 已支持 | 10.15+ (Intel/Apple Silicon) |
| **Windows** | ✅ 已支持 | 10+ (64 位) |
| **Linux** | ✅ 已支持 | Ubuntu 20.04+ / Debian 10+ |

> 💡 自 **v1.4.0** 起，每次发布由 CI 自动构建三平台安装包并上传到 [GitHub Releases](https://github.com/kaituoC/OneApp/releases)。（v1.3.0 及更早仅提供 macOS 包。）

---

## 安装与运行

前往 [GitHub Releases](https://github.com/kaituoC/OneApp/releases) 下载最新版本对应平台的安装包。产物命名格式为 `OneApp-<版本>-<平台>-<架构>.<扩展名>`。

### 🍎 macOS

- Apple Silicon：`OneApp-<版本>-mac-arm64.dmg`（或 `-mac-arm64.zip`）
- Intel：`OneApp-<版本>-mac-x64.dmg`（或 `-mac-x64.zip`）

打开 DMG，拖拽 OneApp 到 Applications。应用未签名，首次打开请**右键 →「打开」**，或在「系统设置 → 隐私与安全性」中点「仍要打开」。

### 🪟 Windows

- `OneApp-<版本>-win-x64.exe` — NSIS 安装包（推荐，可选安装路径、创建快捷方式）
- `OneApp-<版本>-win-x64.zip` — 便携版（解压即用）

### 🐧 Linux

- `OneApp-<版本>-linux-x86_64.AppImage` — 通用格式，免安装单文件
- `OneApp-<版本>-linux-amd64.deb` — Debian / Ubuntu 系统安装

**AppImage 运行：**

```bash
# 加可执行权限后直接运行（或右键 → 属性 → 勾选「允许作为程序执行」）
chmod +x OneApp-<版本>-linux-x86_64.AppImage
./OneApp-<版本>-linux-x86_64.AppImage
```

> ⚠️ **FUSE 提示**：部分发行版（如 Ubuntu 22.04+）默认缺少旧版 FUSE，运行时可能报 `dlopen(): error loading libfuse.so.2`。二选一解决：
> - 安装 FUSE：`sudo apt install libfuse2`
> - 或免 FUSE 解压运行：`./OneApp-<版本>-linux-x86_64.AppImage --appimage-extract-and-run`

**deb 安装：** `sudo apt install ./OneApp-<版本>-linux-amd64.deb`（或 `sudo dpkg -i OneApp-<版本>-linux-amd64.deb`）

---

### 🔧 从源码构建（所有平台）

需 Node.js 18+（推荐 20 LTS）与 Git：

```bash
git clone https://github.com/kaituoC/OneApp.git
cd OneApp
npm install            # 国内用户可用 ./install.sh（已配镜像）
npm run dist:mac       # 或 dist:win / dist:linux，产物输出到 dist/
```

---

### 快速安装（推荐）

国内用户建议使用自动化安装脚本，已配置淘宝镜像和 Electron 国内镜像：

```bash
# 赋予执行权限
chmod +x install.sh

# 一键安装依赖
./install.sh
```

脚本功能：
- 🧹 自动清理旧的 `node_modules` 和 `package-lock.json`
- ⚙️ 自动配置 npm 淘宝镜像
- 📦 自动配置 Electron 国内镜像
- 🔄 安装失败自动重试（最多 3 次）
- ✅ 安装完成后验证关键依赖

### 手动安装

```bash
# 安装依赖
npm install

# 或手动指定镜像源
npm install --registry=https://registry.npmmirror.com
```

### 开发模式

```bash
# 本地开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 打包分发（三平台 target；单平台用 dist:mac / dist:win / dist:linux）
npm run dist
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl/Cmd + N | 新建文件 |
| Ctrl/Cmd + O | 打开文件 |
| Ctrl/Cmd + S | 保存文件 |
| Ctrl/Cmd + W | 关闭当前文件 |
| Ctrl/Cmd + R / F5 | 刷新页面 |
| Ctrl/Cmd + Tab | 切换下一个标签 |
| Ctrl/Cmd + Shift + Tab | 切换上一个标签 |
| Ctrl/Cmd + 1~6 | 切换到指定标签 |
| F12 | 打开/关闭调试工具 |

## 技术栈

- Electron 28
- Vue 3 (Composition API)
- electron-vite 构建工具
- marked (Markdown 解析)
- diff-match-patch (文本对比)
- CodeMirror 6 (JSON 编辑器)
- electron-store (配置持久化)

## 项目结构

```
OneApp/
├── electron/
│   ├── main.js          # 主进程入口
│   └── assets/          # 应用图标
├── preload.cjs          # 预加载脚本（IPC 桥接）
├── src/renderer/
│   ├── App.vue          # 根组件
│   ├── components/      # UI 组件
│   ├── utils/           # 工具函数
│   └── styles/          # 全局样式
├── electron.vite.config.js  # 构建配置
└── package.json         # 项目配置
```

## 许可证

MIT License