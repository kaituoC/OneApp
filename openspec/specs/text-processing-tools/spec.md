# text-processing-tools Specification

## Purpose

文本处理工具提供常见离线文本清洗能力，包括统计、大小写/命名风格转换、按行排序和按行去重。该工具作为新的一级工具接入 workbench navigation，并复用现有 tool surface pattern。

## Requirements

### Requirement: Text processing navigation entry

OneApp SHALL provide a new top-level text processing tool for common text cleanup operations.

#### Scenario: Text processing entry is visible
- **WHEN** the user views the main navigation
- **THEN** the system shows a "文本处理" entry in the text tools area after "文本对比" and before "正则"

#### Scenario: Text processing tab opens
- **WHEN** the user selects the "文本处理" entry
- **THEN** the main content area displays the text processing tool

### Requirement: Text statistics

The text processing tool SHALL calculate common text statistics from the current input.

#### Scenario: Statistics are shown for input text
- **WHEN** the user enters text in the text processing tool
- **THEN** the system displays character count, word count, line count, non-empty line count, and UTF-8 byte count

#### Scenario: Empty text statistics
- **WHEN** the text input is empty
- **THEN** the system displays zero values for all statistics

### Requirement: Case and naming style conversion

The text processing tool SHALL convert input text into supported case and naming styles.

#### Scenario: Convert to upper and lower case
- **WHEN** the user runs upper-case or lower-case conversion
- **THEN** the system outputs the input text converted to the selected case

#### Scenario: Convert to title style
- **WHEN** the user runs title-style conversion
- **THEN** the system capitalizes the first character of each token while lower-casing the rest of each Latin token

#### Scenario: Convert to code naming style
- **WHEN** the user runs camelCase, PascalCase, snake_case, or kebab-case conversion
- **THEN** the system outputs the input text transformed into the selected naming style

### Requirement: Line sorting

The text processing tool SHALL sort input text by line in ascending or descending order.

#### Scenario: Sort lines ascending
- **WHEN** the user runs A-Z line sorting
- **THEN** the system outputs all input lines sorted in ascending string order

#### Scenario: Sort lines descending
- **WHEN** the user runs Z-A line sorting
- **THEN** the system outputs all input lines sorted in descending string order

### Requirement: Line deduplication

The text processing tool SHALL deduplicate input text by line while preserving the first occurrence order.

#### Scenario: Remove duplicate lines
- **WHEN** the user runs line deduplication on text containing repeated lines
- **THEN** the system outputs lines with duplicates removed and preserves the first occurrence order

#### Scenario: Deduplication summary
- **WHEN** line deduplication completes
- **THEN** the system displays original line count, remaining line count, and removed line count

### Requirement: Text processing result workflow

The text processing tool SHALL allow users to copy and clear generated results without leaving the tool.

#### Scenario: Copy result
- **WHEN** the tool has a generated output and the user clicks copy
- **THEN** the system copies that output to the clipboard and shows copy feedback

#### Scenario: Clear input and output
- **WHEN** the user clicks clear
- **THEN** the system clears the input, output, status message, and generated summary
