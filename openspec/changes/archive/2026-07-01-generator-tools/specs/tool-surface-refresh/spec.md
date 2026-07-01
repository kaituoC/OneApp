## ADDED Requirements

### Requirement: Generator tool surface

Generator SHALL follow the shared tool surface pattern used by other first-level tools while presenting UUID, password, and Lorem sub-tools as a compact generation workflow.

#### Scenario: Generator uses shared surface
- **WHEN** the Generator tool is active
- **THEN** the system displays a command area, sub-tool selector, configuration panel, output panel, status feedback, and copy feedback using the shared tool surface styles

#### Scenario: Generator sub-tools are navigable
- **WHEN** the Generator tool is active
- **THEN** UUID、随机密码和 Lorem 子工具可发现、可切换，并且切换不会丢失无关一级工具状态

#### Scenario: Generator adapts to narrow width
- **WHEN** the Generator tool does not have enough horizontal space for a comfortable configuration and output layout
- **THEN** configuration and output areas stack vertically while remaining readable and operable
