## Why

OneApp currently provides single-user developer utilities, but it does not help users turn a rough idea into a reviewed technical plan grounded in the current repository. An Agent Workshop page would let users ask multiple local AI coding agents to independently inspect a local repo in read-only mode, critique each other once, and produce a consolidated implementation proposal.

## What Changes

- Add an "Agent 研讨室" feature page to OneApp.
- Support Codex and ClaudeCode as the only V1 agent providers.
- Detect local agent CLI availability, cache results, and allow manual re-detection.
- Let users choose a local repository root, select available agents, choose a moderator agent, enter an idea or initial plan, and start a fixed discussion flow.
- Run a fixed flow: independent first-round proposals, one cross-review round, and a moderator final summary.
- Enforce read-only expectations through CLI options, repeated prompt constraints, and Git working tree snapshot checks.
- Persist discussion records locally, restore the most recent discussion for viewing, and export complete records as Markdown.
- Do not implement relay mode, automatic multi-round debate, Hermes/custom agents, remote repository URLs, automatic code changes, commits, push, or PR creation in V1.

## Capabilities

### New Capabilities
- `agent-workshop`: Covers the Agent 研讨室 page, local Codex/ClaudeCode availability detection, read-only repository discussion orchestration, discussion state display, persistence, and Markdown export.

### Modified Capabilities
- None.

## Impact

- Renderer: add a new Agent 研讨室 tab, configuration panel, discussion timeline, progress display, Markdown rendering, and state handling.
- Main process: add IPC handlers/events for agent detection, discussion orchestration, process execution, cancellation, persistence, export, and Git workspace safety checks.
- Preload: expose a small Agent Workshop API surface and event subscription bridge.
- Storage: extend `electron-store` for lightweight Agent Workshop configuration and availability cache; add local JSON record files under the app data directory.
- Tests: add focused unit tests for prompt generation, state transitions, call estimates, moderator fallback, Markdown export, process argument construction, and safety checks.
