## ADDED Requirements

### Requirement: Base64 编解码

编码工具 SHALL 提供 Base64 编码与解码，编码方向支持任意 UTF-8 文本（含中文、emoji），解码方向将合法 Base64 还原为文本。界面采用「左源右果 + ⇄ 方向切换」，输入实时计算。

#### Scenario: 编码 UTF-8 文本
- **WHEN** 用户在编码方向输入「你好🌍」
- **THEN** 右侧实时输出其 Base64（经 UTF-8 字节编码，结果可被标准解码器还原）

#### Scenario: 解码合法 Base64
- **WHEN** 用户在解码方向输入合法 Base64 字符串
- **THEN** 右侧实时输出还原后的 UTF-8 文本

#### Scenario: 解码非法输入
- **WHEN** 用户在解码方向输入非法 Base64
- **THEN** 就地显示红字错误提示，不输出结果

### Requirement: URL 编解码

编码工具 SHALL 提供基于 `encodeURIComponent` / `decodeURIComponent` 的 URL 编码与解码，「左源右果 + ⇄ 方向切换」，实时计算。

#### Scenario: 编码含特殊字符的文本
- **WHEN** 用户在编码方向输入含空格与 `&=?` 的文本
- **THEN** 右侧输出这些字符被百分号转义后的结果

#### Scenario: 解码非法转义序列
- **WHEN** 用户在解码方向输入非法的百分号转义（如孤立的 `%`）
- **THEN** 就地显示红字错误提示，不输出结果

### Requirement: JWT 解码

编码工具 SHALL 仅解码 JWT（不验签）：按 `.` 拆为三段，base64url 解码 Header 与 Payload 并格式化为 JSON 展示，Signature 段原样展示并标注「未验证」。Payload 中的 `exp` / `iat` / `nbf` 时间戳字段 SHALL 附带人类可读时间。

#### Scenario: 解码标准 JWT
- **WHEN** 用户输入一个合法的三段式 JWT
- **THEN** 分别展示格式化的 Header 与 Payload（JSON）以及原始 Signature

#### Scenario: 时间戳字段转可读时间
- **WHEN** Payload 含 `exp` / `iat` / `nbf` 字段
- **THEN** 在对应字段旁附带人类可读的日期时间

#### Scenario: 畸形 token
- **WHEN** 输入的 token 不是三段式或某段非合法 base64url/JSON
- **THEN** 就地显示红字错误提示

### Requirement: Hash 计算

编码工具 SHALL 对输入文本一次性计算并列出 MD5 / SHA-1 / SHA-256 / SHA-512 四种摘要，结果以小写十六进制展示，每种支持单独复制。

#### Scenario: 同时输出四种摘要
- **WHEN** 用户输入任意文本
- **THEN** 同时显示该文本的 MD5、SHA-1、SHA-256、SHA-512 小写 hex 摘要

#### Scenario: 空输入
- **WHEN** 输入为空
- **THEN** 展示空字符串对应的各算法摘要或不显示结果（不报错）

### Requirement: 进制转换

编码工具 SHALL 提供 Dec / Hex / Oct / Bin 四进制联动转换，基于 BigInt 支持任意大非负整数，任一字段修改即重算其余三字段。

#### Scenario: 大整数跨进制联动
- **WHEN** 用户在 Hex 框输入一个超过 2^53 的十六进制数
- **THEN** Dec / Oct / Bin 三框实时显示等值且不失真

#### Scenario: 非法字符提示
- **WHEN** 用户在某进制框输入该进制不允许的字符（如 Hex 框输入「G」）
- **THEN** 就地显示红字错误提示，不污染其他字段

### Requirement: Unicode 转义

编码工具 SHALL 提供 Unicode 转义与反转义，格式经下拉三选一：`\u`（BMP）、`\u{}`（ES6 码点，支持增补平面）、`&#x;`（HTML 实体）。码点处理 SHALL 正确支持 emoji 等代理对字符。

#### Scenario: emoji 转义
- **WHEN** 用户选择 `\u{}` 格式并输入含 emoji 的文本
- **THEN** emoji 被转义为完整码点（如 `\u{1f600}`）而非拆成两个半字符

#### Scenario: 反转义
- **WHEN** 用户在反转义方向输入合法的转义序列
- **THEN** 还原为对应的 Unicode 文本

### Requirement: 统一复制与错误提示

编码工具的各子工具 SHALL 提供结果「复制」操作，并在输入非法时以就地红字方式提示错误，而非静默失败或抛异常。

#### Scenario: 复制结果
- **WHEN** 用户点击某结果的复制按钮
- **THEN** 该结果文本被写入系统剪贴板

#### Scenario: 错误就地提示
- **WHEN** 任一子工具的输入非法
- **THEN** 在该子工具区域内显示红字错误说明，界面不崩溃
