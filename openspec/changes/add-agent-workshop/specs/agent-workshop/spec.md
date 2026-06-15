## ADDED Requirements

### Requirement: Agent 研讨室 tab

OneApp SHALL provide an "Agent 研讨室" feature tab that matches the existing tool-style application layout and lets users configure and run repository-grounded agent discussions.

#### Scenario: Open Agent 研讨室
- **WHEN** the user selects the "Agent 研讨室" tab
- **THEN** the system displays a two-column interface with configuration/progress controls on the left and the idea input or discussion timeline on the right

#### Scenario: Existing tools remain available
- **WHEN** the Agent 研讨室 tab is added
- **THEN** the existing editor, JSON, diff, time, regex, encode, and settings tabs remain accessible

### Requirement: Agent availability detection

Agent 研讨室 SHALL support only Codex and ClaudeCode in V1, detect their local CLI availability and login state, cache detection results locally, and allow users to manually run detection again.

#### Scenario: First entry without cached detection
- **WHEN** the user opens Agent 研讨室 and no cached availability result exists
- **THEN** the system automatically checks Codex and ClaudeCode availability and stores each result locally

#### Scenario: Entry with cached detection
- **WHEN** the user opens Agent 研讨室 and cached availability results exist
- **THEN** the system displays the cached results without automatically re-running detection

#### Scenario: Manual re-detection
- **WHEN** the user clicks "重新检测"
- **THEN** the system checks Codex and ClaudeCode availability again and updates the cached results

#### Scenario: Unavailable agent is disabled
- **WHEN** an agent is unavailable or detection fails
- **THEN** the system shows that agent as unavailable, prevents selecting it for discussion, and excludes it from moderator choices

#### Scenario: Logged-in agent is ready
- **WHEN** an installed agent reports a logged-in state (`claude auth status` JSON `loggedIn` is true, or `codex login status` exits 0)
- **THEN** the system marks that agent as ready and allows selecting it for discussion

#### Scenario: Installed but logged-out agent
- **WHEN** an installed agent reports a logged-out state
- **THEN** the system shows the agent as installed but not logged in, prevents selecting it, excludes it from moderator choices, and points the user to the corresponding login command

### Requirement: Local repository selection

Agent 研讨室 SHALL let users choose a local repository root for the discussion and SHALL cache the most recently selected directory.

#### Scenario: Select readable local directory
- **WHEN** the user selects an existing readable local directory
- **THEN** the system uses that directory as the discussion repository root and stores it as the last Agent 研讨室 repository directory

#### Scenario: Missing Git repository metadata
- **WHEN** the selected directory does not contain Git repository metadata detectable by the system
- **THEN** the system shows a warning but still allows the user to start a discussion

#### Scenario: Invalid directory
- **WHEN** the selected path is missing, not a directory, or unreadable
- **THEN** the system prevents starting the discussion and displays a validation message

### Requirement: Agent and moderator selection

Agent 研讨室 SHALL default-select all available agents, require at least one selected agent before starting, and let users choose a moderator from the selected agents.

#### Scenario: Available agents are default selected
- **WHEN** Codex and ClaudeCode are both available
- **THEN** the system selects both agents by default

#### Scenario: Moderator defaults to first selected agent
- **WHEN** at least one available agent is selected
- **THEN** the system defaults the moderator to the first selected agent

#### Scenario: Moderator fallback after deselection
- **WHEN** the user deselects the current moderator while another selected agent remains
- **THEN** the system changes the moderator to the first remaining selected agent

#### Scenario: No selected agents
- **WHEN** no available agent is selected
- **THEN** the system disables discussion start and explains that at least one available agent is required

### Requirement: Start validation and cost notice

Agent 研讨室 SHALL validate the repository, selected agents, moderator, prompt, and detection state before starting; it SHALL show a call-count estimate and a first-use notice that local agent CLI calls may consume service usage.

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
- **THEN** the system shows a notice that Codex or ClaudeCode CLI calls may consume the corresponding service usage and remembers acceptance after the user continues

### Requirement: Fixed discussion flow

Agent 研讨室 SHALL run a fixed flow consisting of independent first-round proposals, one cross-review round, and one moderator final summary.

#### Scenario: Independent first round
- **WHEN** a discussion starts with multiple selected agents
- **THEN** each selected agent receives the same frozen input package and SHALL NOT receive any other agent's first-round response before producing its own first-round proposal

#### Scenario: Cross-review round
- **WHEN** at least one first-round proposal succeeds
- **THEN** each selected agent receives the successful first-round proposals and produces one cross-review response

#### Scenario: Single-agent self-review
- **WHEN** only one agent is selected and its first-round proposal succeeds
- **THEN** the cross-review round asks that agent to critique and revise its own first-round proposal

#### Scenario: Moderator final summary
- **WHEN** the cross-review round finishes
- **THEN** the moderator agent receives the successful prior outputs and produces one final Markdown summary

### Requirement: Read-only agent execution

Agent 研讨室 SHALL invoke agents from the selected repository root in read-only planning mode and SHALL include read-only constraints in every phase prompt.

#### Scenario: Codex read-only invocation
- **WHEN** Codex is invoked for any phase
- **THEN** the system starts Codex from the selected repository root with read-only sandboxing, ephemeral session behavior, stdin prompt input, and shell command construction disabled

#### Scenario: ClaudeCode read-only invocation
- **WHEN** ClaudeCode is invoked for any phase
- **THEN** the system starts ClaudeCode from the selected repository root in non-interactive print mode with only read-oriented tools allowed

#### Scenario: Repeated read-only prompt constraints
- **WHEN** any agent phase prompt is generated
- **THEN** the prompt states that the agent MUST NOT modify, create, delete, format, install dependencies, commit, switch branches, push, or otherwise mutate the workspace

#### Scenario: Plan-only output without write attempts
- **WHEN** any agent phase prompt is generated
- **THEN** the prompt instructs the agent to output only its analysis and plan as text, to not attempt any write or mutation even when the input mentions implementing or creating something, and to not ask whether to exit read-only or plan mode

#### Scenario: Minimal repository context
- **WHEN** any agent phase prompt is generated
- **THEN** the prompt includes only minimal repository facts and tells the agent it may read repository files as needed, without injecting key files, OpenSpec summaries, package metadata, file trees, or code snippets

### Requirement: Git workspace safety check

Agent 研讨室 SHALL record Git working tree status before a run and stop the run if the status changes after a phase.

#### Scenario: Git status unchanged
- **WHEN** the selected directory is a Git repository and the status after a phase matches the baseline status
- **THEN** the system allows the discussion to continue

#### Scenario: Git status changed
- **WHEN** the selected directory is a Git repository and the status after a phase differs from the baseline status
- **THEN** the system stops the discussion, records a system warning, and marks the run as failed

#### Scenario: Non-Git directory
- **WHEN** the selected directory is not a Git repository
- **THEN** the system warns that working tree mutation detection is unavailable and does not perform Git status safety checks

### Requirement: Running progress and timeline

Agent 研讨室 SHALL show phase progress and a Markdown timeline while a discussion runs, and SHALL freeze editable configuration fields until the run finishes, fails, or is canceled.

#### Scenario: Running state freezes configuration
- **WHEN** a discussion is running
- **THEN** repository, selected agents, moderator, prompt, and re-detection controls are disabled

#### Scenario: Invocation progress
- **WHEN** an agent invocation starts, succeeds, fails, times out, or is canceled
- **THEN** the left progress rail reflects that status for the corresponding phase and agent

#### Scenario: Markdown message timeline
- **WHEN** a user prompt, agent response, moderator summary, system warning, failure, or cancellation message is created
- **THEN** the right timeline displays it as Markdown in chronological order

#### Scenario: Oversized output truncation
- **WHEN** an agent response exceeds the stored/display limit, or is injected into a later phase prompt beyond the downstream limit
- **THEN** the system truncates the content for that purpose and explicitly marks it as truncated

### Requirement: Failure and cancellation behavior

Agent 研讨室 SHALL preserve completed messages when individual invocations fail, when the final summary fails, or when the user stops a run.

#### Scenario: Round 1 partial failure
- **WHEN** one selected agent fails in Round 1 and at least one selected agent succeeds
- **THEN** the system records the failure and continues to the cross-review round using successful proposals

#### Scenario: Round 1 total failure
- **WHEN** all selected agents fail in Round 1
- **THEN** the system marks the discussion as failed and preserves failure messages

#### Scenario: Cross-review failure
- **WHEN** one or all agents fail during cross-review after at least one first-round proposal succeeded
- **THEN** the system records the failures and still attempts the moderator final summary using available prior outputs

#### Scenario: Final summary failure
- **WHEN** the moderator final summary fails
- **THEN** the system marks the discussion as failed and preserves all completed prior messages

#### Scenario: User stops discussion
- **WHEN** the user clicks "停止研讨" during a running discussion
- **THEN** the system terminates active agent processes, marks the run as canceled, and preserves completed messages

### Requirement: Discussion persistence and restoration

Agent 研讨室 SHALL save discussion records locally as JSON files, update records incrementally, and restore the most recent record for viewing without resuming unfinished processes.

#### Scenario: Create record on start
- **WHEN** a discussion starts
- **THEN** the system creates a local JSON record containing run metadata, repository directory, selected agents, moderator, user prompt, phases, and messages

#### Scenario: Incremental save
- **WHEN** a significant run event occurs, including message creation, phase completion, failure, cancellation, or completion
- **THEN** the system updates the local JSON record

#### Scenario: Restore recent record
- **WHEN** the user opens Agent 研讨室 and a recent record exists
- **THEN** the system displays the recent record for viewing

#### Scenario: Do not resume unfinished run
- **WHEN** the recent record is incomplete, failed, or canceled
- **THEN** the system restores saved messages and state for viewing but does not restart or resume agent processes

### Requirement: Markdown export

Agent 研讨室 SHALL export the current discussion record as a complete Markdown file.

#### Scenario: Export complete record
- **WHEN** the user exports a discussion record
- **THEN** the system writes a Markdown file containing basic metadata, user input, Round 1 proposals, cross-review responses, final summary when present, and errors or cancellation details

#### Scenario: Export partial record
- **WHEN** the current discussion has failed or been canceled after producing at least one message
- **THEN** the system allows Markdown export of the partial record

#### Scenario: No record to export
- **WHEN** no discussion record is available
- **THEN** the system disables export or explains that there is no record to export
