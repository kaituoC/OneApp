## ADDED Requirements

### Requirement: Discussion progress navigation

Agent 研讨室 SHALL let users use completed progress chips as lightweight navigation anchors into the discussion timeline without changing the stored discussion record format.

#### Scenario: Navigate from progress chip to matching message
- **WHEN** a progress chip represents a phase and agent that has a corresponding timeline message
- **THEN** the system enables the chip as a navigation control that scrolls the timeline to that message and briefly highlights it

#### Scenario: Non-message progress chips remain informational
- **WHEN** a progress chip is pending, running, or has no corresponding timeline message
- **THEN** the system keeps the chip as a non-clickable status indicator

#### Scenario: Navigation preserves Agent Workshop orchestration boundaries
- **WHEN** discussion progress navigation is used
- **THEN** the system does not change Agent Workshop IPC events, orchestration, agent invocation logic, read-only constraints, or discussion record persistence format
