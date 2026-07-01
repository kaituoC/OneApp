## ADDED Requirements

### Requirement: Text processing tool surface

Text Processing SHALL follow the shared tool surface pattern used by other first-level tools.

#### Scenario: Text processing uses shared surface
- **WHEN** the Text Processing tool is active
- **THEN** the system displays a command area, input panel, output or statistics panel, status feedback, and copy feedback using the shared tool surface styles

#### Scenario: Text processing adapts to narrow width
- **WHEN** the Text Processing tool does not have enough horizontal space for two comfortable panels
- **THEN** the input and output panels stack vertically while remaining readable and operable
