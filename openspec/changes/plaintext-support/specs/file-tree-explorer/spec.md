## MODIFIED Requirements

### Requirement: Display files in directory tree

目录树 SHALL 显示当前根目录下的所有非隐藏文件和文件夹（不再按 `editableExtensions` 后缀过滤）。隐藏文件的显示/隐藏仍受「显示隐藏项」开关控制。

#### Scenario: Tree shows all file types
- **WHEN** 用户打开一个包含 `.md`、`.html`、`.txt`、`.js`、`.json` 文件的目录
- **THEN** 目录树显示所有这些文件（隐藏项除外）

#### Scenario: Hidden files toggle still works
- **WHEN** 用户关闭「显示隐藏项」
- **THEN** 以 `.` 开头的文件和 `node_modules` 等目录不显示

#### Scenario: Click file opens in editor
- **WHEN** 用户点击目录树中任意文件
- **THEN** 文件在编辑器中打开，`mode` 按后缀自动设置
