import { describe, it, expect } from 'vitest'
import { runDiscussion } from '../electron/agentWorkshop/orchestrator.js'

const baseOpts = {
  idea: 'x',
  repoContext: 'r',
  gitCheck: async () => ({ ok: true, changed: false, warning: null }),
  shouldCancel: () => false,
  agentName: (id) => id
}

describe('runDiscussion 编排状态机', () => {
  it('双 agent 全成功：round1×2、round2×2、final×1，completed', async () => {
    const calls = []
    const invoke = async ({ agentId, phase }) => {
      calls.push(`${agentId}:${phase}`)
      return { ok: true, text: `${agentId}-${phase}` }
    }
    const rec = await runDiscussion({ ...baseOpts, selectedAgents: ['codex', 'claude'], moderator: 'codex', invoke })
    expect(rec.status).toBe('completed')
    expect(calls.filter((c) => c.endsWith(':round1')).length).toBe(2)
    expect(calls.filter((c) => c.endsWith(':round2')).length).toBe(2)
    expect(calls.filter((c) => c.endsWith(':final')).length).toBe(1)
    expect(rec.messages.some((m) => m.type === 'moderator' && m.phase === 'final')).toBe(true)
  })

  it('单 agent：round1 + 自评 round2 + final = 3 次调用', async () => {
    const calls = []
    const invoke = async ({ phase }) => {
      calls.push(phase)
      return { ok: true, text: 't' }
    }
    const rec = await runDiscussion({ ...baseOpts, selectedAgents: ['codex'], moderator: 'codex', invoke })
    expect(calls.length).toBe(3)
    expect(rec.status).toBe('completed')
  })

  it('round1 部分失败：记录失败并继续完成', async () => {
    const invoke = async ({ agentId, phase }) => {
      if (agentId === 'codex' && phase === 'round1') return { ok: false, error: 'boom' }
      return { ok: true, text: `${agentId}-${phase}` }
    }
    const rec = await runDiscussion({ ...baseOpts, selectedAgents: ['codex', 'claude'], moderator: 'claude', invoke })
    expect(rec.status).toBe('completed')
    expect(rec.messages.some((m) => m.type === 'system' && /codex/i.test(m.content || ''))).toBe(true)
  })

  it('round1 部分失败：round2 只调用第一轮成功的子集', async () => {
    const r2calls = []
    const invoke = async ({ agentId, phase }) => {
      if (phase === 'round2') r2calls.push(agentId)
      if (agentId === 'codex' && phase === 'round1') return { ok: false, error: 'boom' }
      return { ok: true, text: `${agentId}-${phase}` }
    }
    const rec = await runDiscussion({ ...baseOpts, selectedAgents: ['codex', 'claude'], moderator: 'claude', invoke })
    expect(rec.status).toBe('completed')
    expect(r2calls).toEqual(['claude'])
    expect(rec.phases.round2.total).toBe(1)
  })

  it('round1 全失败：failed，不进入 round2', async () => {
    const phases = []
    const invoke = async ({ phase }) => {
      phases.push(phase)
      if (phase === 'round1') return { ok: false, error: 'x' }
      return { ok: true, text: 't' }
    }
    const rec = await runDiscussion({ ...baseOpts, selectedAgents: ['codex', 'claude'], moderator: 'codex', invoke })
    expect(rec.status).toBe('failed')
    expect(phases).not.toContain('round2')
  })

  it('round2 全失败但 round1 有成功：仍尝试 final 并完成', async () => {
    const invoke = async ({ phase }) => {
      if (phase === 'round2') return { ok: false, error: 'x' }
      return { ok: true, text: 't' }
    }
    const rec = await runDiscussion({ ...baseOpts, selectedAgents: ['codex', 'claude'], moderator: 'codex', invoke })
    expect(rec.status).toBe('completed')
  })

  it('final 失败：failed，保留先前消息', async () => {
    const invoke = async ({ phase }) => {
      if (phase === 'final') return { ok: false, error: 'x' }
      return { ok: true, text: 't' }
    }
    const rec = await runDiscussion({ ...baseOpts, selectedAgents: ['codex'], moderator: 'codex', invoke })
    expect(rec.status).toBe('failed')
    expect(rec.messages.some((m) => m.phase === 'round1')).toBe(true)
  })

  it('用户取消：round1 后停止 → canceled', async () => {
    let cancel = false
    const invoke = async ({ phase }) => {
      if (phase === 'round1') cancel = true
      return { ok: true, text: 't' }
    }
    const rec = await runDiscussion({
      ...baseOpts,
      selectedAgents: ['codex'],
      moderator: 'codex',
      invoke,
      shouldCancel: () => cancel
    })
    expect(rec.status).toBe('canceled')
  })

  it('Git 工作区变化：咨询式提示一次，不中断研讨', async () => {
    const invoke = async () => ({ ok: true, text: 't' })
    const rec = await runDiscussion({
      ...baseOpts,
      selectedAgents: ['codex'],
      moderator: 'codex',
      invoke,
      gitCheck: async () => ({ ok: false, changed: true, warning: '工作区已变化' })
    })
    // 不再硬停：仍正常完成，仅产出一条系统提示，且整场只提示一次
    expect(rec.status).toBe('completed')
    const advisories = rec.messages.filter((m) => m.type === 'system' && /变化/.test(m.content || ''))
    expect(advisories.length).toBe(1)
  })
})
