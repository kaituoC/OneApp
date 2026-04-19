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

## 安装与运行

```bash
# 安装依赖
npm install

# 开发模式
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