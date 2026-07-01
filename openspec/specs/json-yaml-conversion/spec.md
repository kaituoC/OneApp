# json-yaml-conversion Specification

## Purpose

数据工具在既有 JSON 工具基础上提供 JSON / YAML 子工具能力，包括 YAML 单文档校验与 JSON/YAML 双向转换，并保留原有 tab key、快捷键、JSON 操作和输入输出双栏体验。

## Requirements

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

### Requirement: JSON to YAML conversion

The JSON / YAML tool SHALL convert valid JSON input into YAML output using a readable block-style YAML representation.

#### Scenario: Convert object JSON to YAML
- **WHEN** the user enters a valid JSON object and runs JSON to YAML conversion
- **THEN** the system displays equivalent YAML output in the output panel

#### Scenario: Invalid JSON conversion error
- **WHEN** the user runs JSON to YAML conversion on invalid JSON
- **THEN** the system displays a JSON parse error and does not produce misleading YAML output

### Requirement: YAML validation and JSON conversion

The JSON / YAML tool SHALL validate single-document YAML and convert it to formatted JSON output.

#### Scenario: Convert YAML to formatted JSON
- **WHEN** the user enters valid single-document YAML and runs YAML to JSON conversion
- **THEN** the system displays equivalent formatted JSON output in the output panel

#### Scenario: Validate YAML
- **WHEN** the user enters valid single-document YAML and runs YAML validation
- **THEN** the system reports that the YAML format is valid

#### Scenario: Invalid YAML error
- **WHEN** the user enters invalid YAML
- **THEN** the system displays an error message that includes the parser message and line/column information when available

### Requirement: YAML single-document boundary

The JSON / YAML tool SHALL reject YAML multi-document input in the first version.

#### Scenario: Leading document marker is accepted
- **WHEN** the YAML input starts with a single `---` document marker and contains only one document
- **THEN** the system accepts the input as a single YAML document

#### Scenario: Multiple YAML documents are rejected
- **WHEN** the YAML input contains more than one YAML document
- **THEN** the system displays a clear error explaining that YAML multi-document input is not supported

### Requirement: Conservative YAML scalar handling

The JSON / YAML tool SHALL preserve date-like YAML scalar values as JSON strings while converting ordinary booleans, numbers, and null values to their natural JSON types.

#### Scenario: Date-like scalar remains string
- **WHEN** the user converts YAML containing `date: 2026-06-30` to JSON
- **THEN** the JSON output contains `"date": "2026-06-30"`

#### Scenario: Primitive scalar types remain useful
- **WHEN** the user converts YAML containing boolean, numeric, and null values to JSON
- **THEN** those values are represented as JSON boolean, number, and null values
