## MODIFIED Requirements

### Requirement: JSON YAML tool entry

OneApp SHALL upgrade the existing JSON / YAML tool entry into a Data Tools entry while preserving the existing tab key, shortcut position, and JSON / YAML operations as sub-tools.

#### Scenario: Existing JSON entry becomes Data Tools
- **WHEN** the user views the main navigation
- **THEN** the existing JSON tool entry is labeled as a Data Tools tool and remains reachable from the same shortcut position

#### Scenario: Existing JSON operations remain available
- **WHEN** the user selects JSON mode inside Data Tools
- **THEN** the system provides JSON formatting, minifying, validation, unescaping, and JSON to YAML conversion actions

#### Scenario: Existing YAML operations remain available
- **WHEN** the user selects YAML mode inside Data Tools
- **THEN** the system provides YAML validation and YAML to JSON conversion actions
