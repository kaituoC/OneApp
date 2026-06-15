## Context

OneApp is an Electron + Vue 3 desktop app. Existing feature tabs keep UI state in the renderer and use `preload.cjs` to call main-process IPC for system capabilities such as file I/O, dialogs, PDF export, and persisted settings. Agent Workshop needs the same separation, but with a longer-running main-process orchestration layer because it launches local CLI agents, handles cancellation and timeouts, writes discussion records, and protects the repository from accidental writes.

The V1 feature is a local, read-only planning tool. It supports only Codex and ClaudeCode CLIs, starts them from a user-selected local repository root, asks them to inspect the repository as needed, and produces Markdown discussion output. It does not implement code changes.

## Goals / Non-Goals

**Goals:**
- Add an "Agent 研讨室" tab that lets users run a repository-grounded multi-agent planning discussion.
- Detect Codex and ClaudeCode availability, cache results locally, and let users manually re-detect.
- Let users choose a local repository root, select available agents, choose a moderator, enter an idea, and start the fixed discussion flow.
- Run independent first-round proposals, one cross-review round, and one moderator final summary.
- Keep all agent invocations read-only using CLI options, prompt constraints, and Git working tree snapshot checks.
- Persist discussion records incrementally, restore the most recent record for viewing, stop active runs, and export complete Markdown records.

**Non-Goals:**
- No Hermes, custom agents, remote repository URLs, or existing background session integration.
- No relay/接力 mode, user-configurable multi-round debate, or automatic repeated critique loops.
- No automatic implementation, branch creation, file edits, commits, push, PR creation, or release actions.
- No deep repository indexing or precomputed code summary; agents decide what to read.
- No token-level streaming UI in V1; messages appear when each invocation finishes.

## Decisions

### 1. Main-process orchestration owns all agent execution

The renderer will send start/stop/check/export requests through `preload.cjs`; the main process will detect CLIs, spawn child processes, sequence phases, persist records, and emit progress events. The renderer will render configuration, progress, and timeline state from these events.

Alternative considered: run orchestration in the renderer. That is rejected because the renderer should not directly spawn local commands, manage process groups, or write app data files.

### 2. Support only Codex and ClaudeCode adapters in V1

V1 will use hard-coded adapters for:
- Codex: run `codex exec` from the selected repo with read-only sandboxing.
- ClaudeCode: run `claude --print` from the selected repo with read-only tool restrictions.

Alternative considered: a generic command-template adapter. That is deferred because arbitrary commands make safety, prompting, and error handling harder to reason about before the core workflow is stable.

### 3. Detect through login shell, run through resolved executable paths

Agent detection will resolve CLI paths with a login shell because Electron apps launched from the Dock may not inherit the user's shell `PATH`. Detection caches status, resolved path, version, checked time, and error details in `electron-store`. Runtime invocations use the cached resolved path with `spawn(..., { shell: false })`.

Detection also probes login state after resolving the CLI: ClaudeCode via `claude auth status` (parsing the JSON `loggedIn` field) and Codex via `codex login status` (exit code 0 means logged in). Both commands return quickly without consuming model usage (verified on real CLIs). An agent counts as ready for discussion only when it is both installed and logged in; an installed-but-logged-out agent is shown as such, cannot be selected, and is pointed to its login command.

Alternative considered: directly calling `spawn("codex")` and `spawn("claude")`. That is less reliable for packaged Electron apps and more exposed to shell quoting problems.

### 4. Fixed discussion flow

The flow is:
1. Round 1: all selected agents run in parallel with the same frozen input package and no access to other agents' responses.
2. Round 2: all selected agents run in parallel after Round 1, reading all successful Round 1 proposals and producing one cross-review response.
3. Final: the moderator agent runs once after Round 2 and produces the final Markdown summary.

For one selected agent, Round 2 becomes self-review. The moderator defaults to the first selected available agent and can be changed to any selected agent.

Alternative considered: relay mode where later agents see earlier Round 1 answers. That is rejected for V1 because it creates anchoring bias and makes first-round outputs less independent.

### 5. Minimal repository context

The prompt will include only the repository root, whether it is a Git repository, the current branch when available, whether the working tree is clean, and the instruction that agents may read repository files as needed. It will not inject key files, OpenSpec summaries, package metadata, file trees, or code snippets.

Alternative considered: generating a rich repository context pack. That is deferred because agents can inspect files themselves and a generated summary could bias or stale the discussion.

### 6. Read-only safety uses layered defenses

Each invocation will include read-only CLI options where supported, repeated prompt constraints, and Git working tree snapshot checks:
- Codex adapter uses `--sandbox read-only`, `--ephemeral`, `--color never`, and stdin prompt input.
- ClaudeCode adapter uses `--print`, `--input-format text`, `--output-format text`, `--permission-mode plan`, `--tools Read,Grep,Glob,LS`, `--add-dir <repoDir>`, and `--no-session-persistence`.
- The prompt for every phase states that the agent must not create, modify, delete, format, install dependencies, commit, switch branches, push, or otherwise mutate the workspace. The prompt also instructs the agent to output only its analysis and plan as text, to never attempt a write action even when the idea mentions implementing or creating something, and to never ask whether to exit read-only or plan mode. (Verified on real CLIs: ClaudeCode plan mode otherwise pauses in non-interactive runs to ask for confirmation, while Codex read-only sandbox hard-rejects writes at the tool layer.)
- For Git repositories, the main process records `git status --short` before the run and rechecks after each phase. If the status changes, the run stops and records a system warning.

Alternative considered: relying only on prompt instructions. That is insufficient because local CLI behavior can vary by version and prompt constraints are not a hard boundary.

### 7. Event-based IPC for long-running work

The main process will expose short IPC methods and one event channel:
- `agent-discussion:get-config`
- `agent-discussion:set-config`
- `agent-discussion:check-agents`
- `agent-discussion:get-last-run`
- `agent-discussion:start`
- `agent-discussion:stop`
- `agent-discussion:export-markdown`
- `agent-discussion:event`

The event payload includes `runId`, `type`, and `payload`. Event types include run/phase/invocation started and finished, message creation, failures, cancellation, and completion.

Because the existing `preload.cjs` only bridges request/response `invoke` calls and exposes no event channel, the preload will add a single dedicated subscription `onAgentDiscussionEvent(callback)` that returns an `unsubscribe` function; it listens only on `agent-discussion:event` and never exposes a generic `on(channel, ...)`. Renderer components subscribe on mount and call `unsubscribe` on unmount to avoid leaked or duplicated listeners.

Alternative considered: polling the main process for run state. Events are more responsive and fit the phase/message timeline UI.

### 8. Persist records outside `electron-store`

`electron-store` stores lightweight configuration and availability cache. Each discussion run is saved as a JSON record under the app data directory, incrementally updated after significant events. The page restores the most recent record for viewing but never resumes unfinished child processes automatically.

Alternative considered: storing full records in `electron-store`. That is rejected because discussion output can be large and is better managed as standalone JSON files.

### 9. Single-page UI with left control/progress rail and right timeline

The Agent Workshop tab will use a two-column layout. Before running, the left rail holds repository, agent, moderator, and action controls while the right side holds the idea input. During and after a run, the left rail shows phase progress and actions, while the right side shows a Markdown timeline. Completion, failure, and cancellation stay in the same page; completed content remains exportable. The tab is placed after 编码 (encode) and before 设置 (settings), extending the tab keyboard shortcuts to Ctrl+1–8.

Alternative considered: a multi-step wizard. That would add navigation overhead for a workflow users may run repeatedly.

### 10. Agents run with the user's existing local configuration

V1 invokes Codex and ClaudeCode with the user's normal local setup, including global instruction files and installed skills/plugins; the orchestrator does not pass isolation flags such as Codex `--ignore-user-config`/`--ignore-rules`. This lets each agent bring its own analysis capabilities into the discussion.

Alternative considered: isolating agents from local configuration. That is deferred because the user's local skills can improve plan quality; isolation can be revisited if global configuration noticeably biases or degrades output.

## Risks / Trade-offs

- CLI versions may change argument behavior -> keep adapter construction covered by tests, expose useful failure messages, and allow manual re-detection.
- ClaudeCode read-only enforcement depends on tool/permission behavior -> restrict tools to read-only operations and add prompt and Git snapshot defenses.
- A user may edit files while a discussion is running -> treat any Git status change as a safety stop, even if the agent did not cause it.
- Long agent output can make later prompts too large -> cap stored/displayed content at 512 KB and cap each per-agent response injected into later phases at 20000 characters, marking truncation explicitly.
- Agent calls can be slow or costly -> each agent invocation uses a 600s timeout, the UI shows call-count estimates before running, and a first-use cost notice is remembered in local config. V1 keeps each CLI's default model and reasoning settings (e.g. Codex defaults to high reasoning effort, ~16k tokens for a trivial task in testing); cost tuning is deferred until real usage shows it is needed.
- Final summary can fail after successful earlier rounds -> mark the run failed, keep completed messages, and allow Markdown export of partial records.
- Packaged Electron PATH differences can make CLIs appear unavailable -> detect through login shell and run through resolved executable paths.

## Migration Plan

This is an additive feature. Add the new tab, IPC handlers, storage keys, and record directory without changing existing feature behavior. If the feature is removed or disabled, existing Agent Workshop records can remain unused in the app data directory without affecting current tools.

## Open Questions

- None for V1. Future changes can revisit Hermes/custom agents, remote repositories, richer history management, streaming output, and OpenSpec proposal export.
