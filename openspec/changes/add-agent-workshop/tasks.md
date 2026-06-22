## 1. Shared Models And Pure Logic

- [x] 1.1 Define Agent 研讨室 constants for agent ids, display names, phase ids, statuses, default per-invocation timeout (600s), output limits (512 KB stored/display, 20000 chars injected into downstream prompts), and app-store keys
- [x] 1.2 Implement pure configuration helpers for available-agent filtering, default selected agents, moderator defaulting, moderator fallback, and start validation
- [x] 1.3 Implement call-count estimation for one-agent and two-agent runs
- [x] 1.4 Implement fixed prompt builders for Round 1 independent proposal, Round 2 cross-review/self-review, and Final moderator summary with repeated read-only constraints, plan-only text output, and no prompting to exit read-only/plan mode
- [x] 1.5 Implement minimal repository context generation from repo path, Git presence, current branch, and clean/dirty status without injecting key files or code summaries
- [x] 1.6 Implement Markdown export generation for full and partial discussion records

## 2. Main Process Services

- [x] 2.1 Add Agent 研讨室 config storage in `electron-store` for repo dir, selected agents, moderator, availability cache, last run id, and first-use cost notice acceptance
- [x] 2.2 Implement local record storage under the app data directory with create, load latest, incremental save, and error-tolerant read behavior
- [x] 2.3 Implement Codex and ClaudeCode detection using a login shell to resolve executable paths and version commands, plus login-state probes (`claude auth status` JSON `loggedIn`, `codex login status` exit code) to mark each agent installed / logged-out / ready
- [x] 2.4 Implement Codex adapter argument construction for `codex exec` with repo cwd, read-only sandbox, ephemeral mode, color disabled, stdin prompt, and output capture
- [x] 2.5 Implement ClaudeCode adapter argument construction for `claude --print` with repo cwd, text input/output, plan permission mode, read-only tools, `--add-dir`, and no session persistence
- [x] 2.6 Implement a generic agent invocation runner with stdin prompt writing, stdout/stderr collection, timeout handling (600s default), cancellation handling, output truncation (512 KB stored / 20000-char downstream), and process-tree termination
- [x] 2.7 Implement Git safety snapshot helpers for baseline `git status --short`, post-phase comparison, non-Git warnings, and safety-stop errors
- [x] 2.8 Implement the discussion orchestrator for Round 1 parallel execution, Round 2 parallel execution, single-agent self-review, Final moderator summary, partial failure handling, cancellation, and record updates
- [x] 2.9 Add main-process IPC handlers and event emission for get/set config, check agents, get last run, start, stop, export Markdown, and discussion events

## 3. Preload Bridge

- [x] 3.1 Expose Agent 研讨室 IPC methods through `preload.cjs`
- [x] 3.2 Expose a single `onAgentDiscussionEvent(callback)` subscription that returns an unsubscribe function for `agent-discussion:event`, with no generic channel access
- [x] 3.3 Keep the exposed API narrow and avoid exposing generic command execution to the renderer

## 4. Renderer State And UI

- [x] 4.1 Add the Agent 研讨室 tab (after 编码, before 设置) to `App.vue`, `Header.vue`, extend tab shortcuts to Ctrl+1–8, and update status labels
- [x] 4.2 Create the Agent 研讨室 component with a left control/progress rail and right input/timeline area matching existing OneApp styling
- [x] 4.3 Load cached config and latest record on mount; auto-detect agents only when no cached availability result exists
- [x] 4.4 Implement repository directory selection, validation messages, non-Git warning display, and repo-dir caching
- [x] 4.5 Implement Codex/ClaudeCode status cards with installed / logged-out / ready states, disabled state with login hints for unavailable or logged-out agents, manual re-detection, and default selection of ready agents
- [x] 4.6 Implement moderator selection from selected agents, defaulting, and fallback when the current moderator is deselected
- [x] 4.7 Implement prompt input, call-count estimate, first-use cost notice, and start-button disabled reasons
- [x] 4.8 Implement running-state behavior that freezes editable controls, shows phase/agent progress, and exposes a stop action
- [x] 4.9 Implement Markdown timeline rendering for user, agent, moderator, and system messages with copy affordances for messages
- [x] 4.10 Implement completed, failed, canceled, and restored states with preserved messages, New Discussion action, and Markdown export action

## 5. Unit Tests

- [x] 5.1 Add tests for ready-agent filtering (installed + logged-in), selected-agent defaults, moderator default/fallback, start validation, and call-count estimation
- [x] 5.2 Add tests for prompt builders to verify phase-specific structure, repeated read-only constraints, independent Round 1 inputs, and minimal repository context
- [x] 5.3 Add tests for Markdown export generation for completed, failed, canceled, and partial records
- [x] 5.4 Add tests for adapter argument construction to ensure shell-free execution and read-only Codex/ClaudeCode options
- [x] 5.5 Add tests for Git safety snapshot comparison and non-Git warning behavior
- [x] 5.6 Add tests for orchestrator decisions using mocked agent invocations, including partial Round 1 failure, Round 1 total failure, Round 2 failure, Final failure, and cancellation

## 6. Manual Verification

- [ ] 6.1 Verify first tab entry with no cache auto-detects Codex and ClaudeCode without invoking model calls
- [ ] 6.2 Verify cached availability avoids repeat detection and manual re-detection refreshes results
- [ ] 6.3 Verify unavailable or logged-out agents are disabled and excluded from moderator choices
- [ ] 6.4 Verify a two-agent run uses parallel Round 1, parallel Round 2, serial Final, and produces Markdown timeline messages
- [ ] 6.5 Verify a one-agent run performs Round 1, self-review, and Final with a 3-call estimate
- [ ] 6.6 Verify stopping a running discussion terminates active processes and preserves completed messages
- [ ] 6.7 Verify Git working tree changes during a run trigger a safety stop
- [ ] 6.8 Verify completed, failed, and canceled records can be restored for viewing and exported as Markdown

## 7. Documentation And Release Readiness

- [x] 7.1 Update README feature list and screenshots/usage notes as appropriate for Agent 研讨室
- [x] 7.2 Update AGENTS.md and CLAUDE.md architecture notes for the new main-process services, renderer components, and event IPC pattern
- [x] 7.3 Update CHANGELOG and ROADMAP for the Agent 研讨室 feature
- [x] 7.4 Run `npm test` and resolve regressions
- [x] 7.5 Run `npm run build` and resolve build errors
- [ ] 7.6 Manually run `npm run dev` and verify the Agent 研讨室 happy path and failure states
