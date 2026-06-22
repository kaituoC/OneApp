import { describe, it, expect } from 'vitest'
import { buildCodexArgs, buildClaudeArgs, buildAgentArgs } from '../electron/agentWorkshop/adapters.js'

describe('buildCodexArgs', () => {
  it('codex exec：只读沙箱、ephemeral、禁用颜色、跳过 git 检查', () => {
    const args = buildCodexArgs({ repoDir: '/p' })
    expect(Array.isArray(args)).toBe(true)
    expect(args).toContain('exec')
    expect(args.join(' ')).toContain('--sandbox read-only')
    expect(args).toContain('--ephemeral')
    expect(args).toContain('--color')
    expect(args).toContain('--skip-git-repo-check')
  })
})

describe('buildClaudeArgs', () => {
  it('print + plan + 只读工具白名单 + add-dir + 无会话持久化', () => {
    const args = buildClaudeArgs({ repoDir: '/p' })
    expect(args).toContain('--print')
    expect(args.join(' ')).toContain('--permission-mode plan')
    expect(args).toContain('--add-dir')
    expect(args).toContain('/p')
    expect(args).toContain('--no-session-persistence')
    expect(args).toContain('--allowedTools')
    expect(args).toContain('Read')
    expect(args).toContain('Grep')
    expect(args).toContain('Glob')
    expect(args).toContain('LS')
  })

  it('不包含任何写类工具', () => {
    const joined = buildClaudeArgs({ repoDir: '/p' }).join(' ')
    expect(joined).not.toMatch(/\bWrite\b|\bEdit\b|\bBash\b/)
  })
})

describe('buildAgentArgs', () => {
  it('按 agentId 分派', () => {
    expect(buildAgentArgs('codex', { repoDir: '/p' })).toContain('exec')
    expect(buildAgentArgs('claude', { repoDir: '/p' })).toContain('--print')
  })

  it('未知 agent 抛错', () => {
    expect(() => buildAgentArgs('x', { repoDir: '/p' })).toThrow()
  })
})
