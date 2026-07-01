## 1. OpenSpec 与导航契约

- [x] 1.1 验证 generator-tools change 状态和 delta specs 可被 OpenSpec 识别
- [x] 1.2 更新 navigation 数据，新增“生成工具”分组和“生成器”入口
- [x] 1.3 扩展数字快捷键，让第 10 个一级入口使用 Ctrl/Cmd+0

## 2. 生成器核心逻辑

- [x] 2.1 新增 generatorHelper 纯函数模块，支持 UUID v4 单个 / 批量生成
- [x] 2.2 实现随机密码生成，支持长度、字符集、符号和排除易混字符
- [x] 2.3 实现 Lorem 按词、句、段生成及输入范围校验
- [x] 2.4 为 generatorHelper 增加单元测试，覆盖成功、错误和确定性随机源

## 3. 生成器 UI

- [x] 3.1 新增 GeneratorTab 组件，提供 UUID、密码、Lorem 子工具切换
- [x] 3.2 在 App、StatusBar、Settings 快捷键说明中接入生成器入口
- [x] 3.3 使用共享 tool surface 样式完成配置、输出、状态和复制反馈
- [x] 3.4 覆盖窄宽度响应式布局，避免配置和输出区域挤压

## 4. 文档、归档与验证

- [x] 4.1 更新 README、ROADMAP、CHANGELOG 和版本号
- [x] 4.2 运行相关单测、完整测试和生产构建
- [x] 4.3 归档 OpenSpec change 并验证主 specs
- [x] 4.4 完成最终验证并整理提交前状态
