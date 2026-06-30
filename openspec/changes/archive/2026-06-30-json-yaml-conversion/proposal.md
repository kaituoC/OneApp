## Why

OneApp 当前 JSON 工具只覆盖 JSON 格式化、压缩、校验和反转义，但开发者日常经常需要在配置文件 YAML 与 API/调试用 JSON 之间转换。将 YAML ⇆ JSON 并入现有 JSON 工具，可以复用双栏输入输出、错误反馈和复制体验，补齐高频离线数据格式转换能力。

## What Changes

- 将「JSON 工具」升级为「JSON / YAML」工具，不新增一级导航入口。
- 在工具页顶部增加 `JSON` / `YAML` 模式切换。
- JSON 模式保留现有格式化、压缩、校验、去除转义能力，并新增「转 YAML」。
- YAML 模式提供「校验」和「转 JSON」。
- YAML → JSON 仅支持单文档 YAML；检测到多文档时明确报错。
- YAML → JSON 使用保守类型策略：日期等时间样式值保持字符串，避免隐式时区或 Date 对象转换。
- JSON → YAML 使用默认 block style 输出，第一版不提供样式选项。
- 更新 README、ROADMAP、CHANGELOG 和版本号。

## Capabilities

### New Capabilities

- `json-yaml-conversion`: JSON / YAML 工具的模式切换、互转、校验、错误反馈与单文档边界。

### Modified Capabilities

## Impact

- 影响 `src/renderer/components/JsonTab.vue` 的工具栏、模式切换、按钮展示、输入输出提示和状态文案。
- 影响 `src/renderer/utils/jsonHelper.js`，新增 YAML 解析、校验和转换纯函数，并保留现有 JSON helper 行为。
- 影响 `src/renderer/utils/navigation.js`、`README.md`、`ROADMAP.md`、`CHANGELOG.md`、`package.json` 和 `package-lock.json`。
- 新增 runtime 依赖 `yaml`，用于可靠解析/序列化 YAML；不手写 YAML parser。
- 不引入网络调用，不上传用户内容，不改变 Electron IPC 或主进程逻辑。
