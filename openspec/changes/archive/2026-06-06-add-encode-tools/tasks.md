## 1. 依赖与工具模块

- [x] 1.1 添加依赖 `js-md5` 到 package.json 并安装
- [x] 1.2 创建 `src/renderer/utils/encodeHelper.js`：`base64Encode/Decode`（TextEncoder/TextDecoder 处理 UTF-8）
- [x] 1.3 encodeHelper：`urlEncode/Decode`（encodeURIComponent / decodeURIComponent，含非法转义容错）
- [x] 1.4 encodeHelper：`decodeJWT`（三段拆分、base64url 解码 Header/Payload、exp/iat/nbf 转可读时间、Signature 原样、畸形容错）
- [x] 1.5 encodeHelper：`hashAll`（MD5 同步 + SHA-1/256/512 via crypto.subtle，统一 Promise，hex 小写）
- [x] 1.6 encodeHelper：`convertBase`（BigInt，非负整数，Dec/Hex/Oct/Bin 互转，非法字符报错）
- [x] 1.7 encodeHelper：`unicodeEscape/Unescape`（codePointAt/fromCodePoint，支持 `\u` / `\u{}` / HTML 实体三格式）
- [x] 1.8 各函数统一返回 `{ success, result/error }` 形态

## 2. 单元测试

- [x] 2.1 创建 `tests/encodeHelper.test.js`：Base64（UTF-8/emoji 往返、非法解码）
- [x] 2.2 测试 URL 编解码（特殊字符、非法转义）
- [x] 2.3 测试 JWT 解码（标准 token、时间戳字段、畸形 token）
- [x] 2.4 测试 hashAll（已知向量校验四种算法 hex）
- [x] 2.5 测试进制转换（大整数不失真、非法字符报错）
- [x] 2.6 测试 Unicode 转义（emoji 代理对、三种格式往返）

## 3. EncodeTab 组件

- [x] 3.1 创建 `EncodeTab.vue` 骨架：左侧菜单（6 项）+ 右侧工作区切换
- [x] 3.2 Base64 / URL / Unicode 子视图：左源右果 + ⇄ 方向切换，实时计算
- [x] 3.3 JWT 子视图：单输入 + Header/Payload/Signature 三段展示
- [x] 3.4 Hash 子视图：单输入 + 四算法结果行，各行可复制
- [x] 3.5 进制子视图：Dec/Hex/Oct/Bin 四框联动
- [x] 3.6 统一「复制结果」与就地红字错误提示
- [x] 3.7 Unicode 格式下拉（`\u` / `\u{}` / HTML 实体）

## 4. 标签注册

- [x] 4.1 `App.vue`：注册 encode 标签（正则与设置之间）、v-show 渲染、Ctrl+1~7 范围、循环切换覆盖
- [x] 4.2 `Header.vue`：在正则与设置之间加入「编码」标签项
- [x] 4.3 `StatusBar.vue`：tabNames 加入 `encode: '编码'`
- [x] 4.4 `SettingsTab.vue`：快捷键说明 `Ctrl+1~6` → `Ctrl+1~7`

## 5. 自测与文档

- [x] 5.1 `npm test` 全部通过（仅 timeHelper 时区断言为已知环境 flaky，与本改动无关）
- [x] 5.2 `npm run build` 编译通过（关沙箱）
- [x] 5.3 `npm run dev` 手动验证 6 个子工具与标签切换/快捷键
- [x] 5.4 同步 README（功能特性 + 快捷键表 1~7）
- [x] 5.5 同步 CLAUDE.md（组件/工具模块列表、标签数 6→7、Ctrl+1~7）
- [x] 5.6 更新 CHANGELOG 与 ROADMAP（勾选编码转换合集）
