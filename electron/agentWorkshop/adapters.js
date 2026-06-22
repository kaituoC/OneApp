// Codex / ClaudeCode 的命令行参数构造。纯函数，不执行进程，可单元测试。
// 实际可执行路径由 detection 解析后传入 runner；这里只负责只读参数装配。
// prompt 一律通过 stdin 传入，不进 argv，避免 shell 引号与超长参数问题。

/**
 * Codex：`codex exec` 只读沙箱、ephemeral 会话、禁用颜色、跳过 git 仓库检查。
 * 工作目录由 spawn 的 cwd 指定为 repoDir。
 */
export function buildCodexArgs(_opts = {}) {
  return [
    'exec',
    '--sandbox', 'read-only',
    '--ephemeral',
    '--color', 'never',
    '--skip-git-repo-check'
  ]
}

/**
 * ClaudeCode：`claude --print` 非交互、文本输入输出、plan 权限模式 +
 * 只读工具白名单（双重只读保证），--add-dir 限定可读目录，禁用会话持久化。
 */
export function buildClaudeArgs({ repoDir } = {}) {
  return [
    '--print',
    '--input-format', 'text',
    '--output-format', 'text',
    '--permission-mode', 'plan',
    '--allowedTools', 'Read', 'Grep', 'Glob', 'LS',
    '--add-dir', repoDir,
    '--no-session-persistence'
  ]
}

/** 按 agentId 分派到对应 adapter，未知 agent 抛错 */
export function buildAgentArgs(agentId, opts = {}) {
  if (agentId === 'codex') return buildCodexArgs(opts)
  if (agentId === 'claude') return buildClaudeArgs(opts)
  throw new Error(`未知 agent: ${agentId}`)
}
