# OneApp

多功能开发工具桌面应用，集成 Markdown 编辑、JSON 工具、文本对比和时间转换功能。

## 功能特性

### Markdown 编辑
- 实时预览，支持 GFM 语法
- 文件管理：新建、打开、保存、导出
- 支持导出 HTML 和 PDF
- 编辑器行号显示
- 滚动同步（编辑区与预览区）
- 可隐藏编辑器或预览区

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

## 系统要求

| 操作系统 | 状态 | 版本要求 |
|----------|------|----------|
| **macOS** | ✅ 已支持 | 10.15+ (Intel/Apple Silicon) |
| **Windows** | 🟡 计划中 | 10+ (64 位) |
| **Linux** | 🟡 计划中 | Ubuntu 20.04+ / Debian 10+ |

> 💡 **当前版本 (v1.0.0) 仅提供 macOS 安装包**。Windows 和 Linux 版本正在开发中，预计 v1.1.0 发布。

---

## 安装与运行

### 🍎 macOS 用户（推荐）

**下载安装包：**
1. 访问 [GitHub Releases](https://github.com/kaituoC/OneApp/releases)
2. 下载 `OneApp-1.0.0.dmg` (约 100MB)
3. 打开 DMG，拖拽 OneApp 到 Applications 文件夹
4. 启动应用

**或使用 Homebrew（计划中）：**
```bash
brew install --cask oneapp
```

---

### 🪟 Windows 用户（源码构建）

**系统要求：**
- Windows 10/11 (64 位)
- Node.js 18+ (推荐 20 LTS)
- Git

**构建步骤：**
```bash
# 1. 克隆仓库
git clone https://github.com/kaituoC/OneApp.git
cd OneApp

# 2. 安装依赖
npm install

# 3. 构建并打包
npm run build
npm run dist -- --win
```

**输出文件：**
- `dist/OneApp-1.0.0.exe` - NSIS 安装包（推荐）
- `dist/OneApp-1.0.0-win.zip` - 便携版（解压即用）

---

### 🐧 Linux 用户（源码构建）

**系统要求：**
- Ubuntu 20.04+ / Debian 10+ / Fedora 32+
- Node.js 18+ (推荐 20 LTS)
- Git
- build-essential (Ubuntu/Debian)

**安装依赖（Ubuntu/Debian）：**
```bash
sudo apt update
sudo apt install -y build-essential git curl
```

**构建步骤：**
```bash
# 1. 克隆仓库
git clone https://github.com/kaituoC/OneApp.git
cd OneApp

# 2. 安装依赖
npm install

# 3. 构建并打包
npm run build
npm run dist -- --linux
```

**输出文件：**
- `dist/OneApp-1.0.0.AppImage` - AppImage（推荐，通用格式）
- `dist/OneApp-1.0.0.deb` - Debian 包（Ubuntu/Debian）

**运行 AppImage：**
```bash
chmod +x OneApp-1.0.0.AppImage
./OneApp-1.0.0.AppImage
```

---

### 🔧 开发模式（所有平台）

```bash
# 1. 克隆仓库
git clone https://github.com/kaituoC/OneApp.git
cd OneApp

# 2. 安装依赖（国内用户用 install.sh）
chmod +x install.sh
./install.sh

# 或直接 npm install
npm install

# 3. 启动开发模式（热重载）
npm run dev
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

# 打包分发（Mac DMG/ZIP）
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
| Ctrl/Cmd + 1~5 | 切换到指定标签 |
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