## MODIFIED Requirements

### Requirement: Start validation and cost notice

Agent 研讨室 SHALL validate the repository, selected agents, moderator, prompt, and detection state before starting; it SHALL show a call-count estimate and a first-use notice through the unified app message dialog that local agent CLI calls may consume service usage.

#### Scenario: Start disabled for incomplete input
- **WHEN** the prompt is empty, the repository directory is invalid, no available agent is selected, the moderator is invalid, or detection is running
- **THEN** the system disables the start action and shows the relevant reason

#### Scenario: Call-count estimate
- **WHEN** one agent is selected
- **THEN** the system shows that the discussion will make 3 agent calls

#### Scenario: Two-agent call-count estimate
- **WHEN** two agents are selected
- **THEN** the system shows that the discussion will make 5 agent calls

#### Scenario: First-use cost notice
- **WHEN** the user starts Agent 研讨室 for the first time
- **THEN** the system shows a notice through the unified app message dialog that Codex or ClaudeCode CLI calls may consume the corresponding service usage and remembers acceptance after the user continues

#### Scenario: User cancels first-use cost notice
- **WHEN** the first-use cost notice is shown and the user chooses not to continue
- **THEN** the system does not start the discussion and does not remember acceptance
