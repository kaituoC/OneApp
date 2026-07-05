import { describe, it, expect } from 'vitest'
import {
  AGENT_IDS,
  DEFAULT_TIMEOUT_MS,
  STORE_LIMIT_BYTES,
  DOWNSTREAM_CHAR_LIMIT,
  STORE_KEYS,
  DEFAULT_PROXY_CONFIG,
  isAgentReady,
  agentCardState,
  readyAgents,
  defaultSelectedAgents,
  defaultModerator,
  moderatorFallback,
  normalizeProxyConfig,
  validateProxyConfig,
  buildAgentEnvironment,
  validateStart,
  validateStartParams,
  estimateCallCount,
  buildRepoContext,
  truncateForDownstream,
  buildRound1Prompt,
  buildRound2Prompt,
  buildFinalPrompt,
  buildMessageNavigationTargets,
  agentsForDiscussionPhase,
  exportMarkdown
} from '../src/renderer/utils/agentWorkshopHelper.js'

describe('常量与模型', () => {
  it('V1 仅支持 codex 与 claude 两个 agent', () => {
    expect(AGENT_IDS).toEqual(['codex', 'claude'])
  })

  it('超时与截断阈值符合方案定值', () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(600000)
    expect(STORE_LIMIT_BYTES).toBe(512 * 1024)
    expect(DOWNSTREAM_CHAR_LIMIT).toBe(20000)
  })

  it('store keys 带 agentWorkshop 命名空间前缀', () => {
    for (const key of Object.values(STORE_KEYS)) {
      expect(key.startsWith('agentWorkshop.')).toBe(true)
    }
  })

  it('代理默认配置默认禁用', () => {
    expect(DEFAULT_PROXY_CONFIG).toEqual({
      enabled: false,
      url: '',
      applyHttp: true,
      applyHttps: true,
      applyAll: false
    })
    expect(STORE_KEYS.proxyConfig).toBe('agentWorkshop.proxyConfig')
  })
})

describe('isAgentReady', () => {
  it('已安装且已登录才算就绪', () => {
    expect(isAgentReady({ installed: true, loggedIn: true })).toBe(true)
  })

  it('连接测试结果不影响就绪态', () => {
    expect(isAgentReady({ installed: true, loggedIn: true, connection: { ok: false } })).toBe(true)
    expect(isAgentReady({ installed: true, loggedIn: false, connection: { ok: true } })).toBe(false)
  })

  it('已安装未登录不就绪', () => {
    expect(isAgentReady({ installed: true, loggedIn: false })).toBe(false)
  })

  it('未安装不就绪', () => {
    expect(isAgentReady({ installed: false, loggedIn: false })).toBe(false)
  })

  it('缺失条目不就绪', () => {
    expect(isAgentReady(undefined)).toBe(false)
  })
})

describe('proxy config helpers', () => {
  it('归一化有效代理配置并保留默认 HTTP/HTTPS 注入', () => {
    expect(normalizeProxyConfig({ enabled: true, url: ' http://127.0.0.1:7897 ' })).toEqual({
      enabled: true,
      url: 'http://127.0.0.1:7897',
      applyHttp: true,
      applyHttps: true,
      applyAll: false
    })
  })

  it('拒绝启用状态下的无效代理 URL', () => {
    const result = validateProxyConfig({ enabled: true, url: 'ftp://127.0.0.1:7897' })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/HTTP|HTTPS|代理/)
  })

  it('禁用代理时允许空 URL', () => {
    expect(validateProxyConfig({ enabled: false, url: '' })).toEqual({ ok: true, error: null })
  })

  it('启用代理时写入大小写 HTTP/HTTPS 变量', () => {
    const env = buildAgentEnvironment({ PATH: '/bin' }, { enabled: true, url: 'http://127.0.0.1:7897' })
    expect(env.PATH).toBe('/bin')
    expect(env.HTTP_PROXY).toBe('http://127.0.0.1:7897')
    expect(env.HTTPS_PROXY).toBe('http://127.0.0.1:7897')
    expect(env.http_proxy).toBe('http://127.0.0.1:7897')
    expect(env.https_proxy).toBe('http://127.0.0.1:7897')
    expect(env.ALL_PROXY).toBeUndefined()
    expect(env.all_proxy).toBeUndefined()
  })

  it('按需写入 ALL_PROXY 变量', () => {
    const env = buildAgentEnvironment({}, { enabled: true, url: 'http://127.0.0.1:7897', applyAll: true })
    expect(env.ALL_PROXY).toBe('http://127.0.0.1:7897')
    expect(env.all_proxy).toBe('http://127.0.0.1:7897')
  })

  it('禁用代理时清理继承的代理变量', () => {
    const env = buildAgentEnvironment({
      PATH: '/bin',
      HTTP_PROXY: 'http://old',
      HTTPS_PROXY: 'http://old',
      ALL_PROXY: 'http://old',
      http_proxy: 'http://old',
      https_proxy: 'http://old',
      all_proxy: 'http://old'
    }, { enabled: false })
    expect(env.PATH).toBe('/bin')
    expect(env.HTTP_PROXY).toBeUndefined()
    expect(env.HTTPS_PROXY).toBeUndefined()
    expect(env.ALL_PROXY).toBeUndefined()
    expect(env.http_proxy).toBeUndefined()
    expect(env.https_proxy).toBeUndefined()
    expect(env.all_proxy).toBeUndefined()
  })
})

describe('agentCardState 三态', () => {
  it('未安装 → not-installed', () => {
    expect(agentCardState({ installed: false })).toBe('not-installed')
    expect(agentCardState(undefined)).toBe('not-installed')
  })

  it('已安装未登录 → logged-out', () => {
    expect(agentCardState({ installed: true, loggedIn: false })).toBe('logged-out')
  })

  it('已安装已登录 → ready', () => {
    expect(agentCardState({ installed: true, loggedIn: true })).toBe('ready')
  })
})

describe('readyAgents', () => {
  it('仅返回就绪 agent，并保持 AGENT_IDS 顺序', () => {
    const availability = {
      claude: { installed: true, loggedIn: true },
      codex: { installed: true, loggedIn: true }
    }
    expect(readyAgents(availability)).toEqual(['codex', 'claude'])
  })

  it('排除未登录与未安装', () => {
    const availability = {
      codex: { installed: true, loggedIn: false },
      claude: { installed: true, loggedIn: true }
    }
    expect(readyAgents(availability)).toEqual(['claude'])
  })

  it('空可用性返回空数组', () => {
    expect(readyAgents({})).toEqual([])
  })
})

describe('defaultSelectedAgents', () => {
  it('默认选中所有就绪 agent', () => {
    const availability = {
      codex: { installed: true, loggedIn: true },
      claude: { installed: true, loggedIn: true }
    }
    expect(defaultSelectedAgents(availability)).toEqual(['codex', 'claude'])
  })
})

describe('defaultModerator', () => {
  it('默认取首个被选中的 agent', () => {
    expect(defaultModerator(['codex', 'claude'])).toBe('codex')
  })

  it('无选中时为 null', () => {
    expect(defaultModerator([])).toBe(null)
  })
})

describe('moderatorFallback', () => {
  it('当前主持仍在选中列表时保持不变', () => {
    expect(moderatorFallback('claude', ['codex', 'claude'])).toBe('claude')
  })

  it('当前主持被取消时回退到首个剩余 agent', () => {
    expect(moderatorFallback('claude', ['codex'])).toBe('codex')
  })

  it('无剩余选中时为 null', () => {
    expect(moderatorFallback('codex', [])).toBe(null)
  })
})

describe('validateStart', () => {
  const ok = {
    promptText: '帮我设计一个登录模块',
    repoDirValid: true,
    selectedAgents: ['codex', 'claude'],
    moderator: 'codex',
    detecting: false
  }

  it('完整输入通过校验', () => {
    expect(validateStart(ok)).toEqual({ ok: true, reason: null })
  })

  it('检测进行中禁止开始', () => {
    const r = validateStart({ ...ok, detecting: true })
    expect(r.ok).toBe(false)
    expect(r.reason).toBeTruthy()
  })

  it('仓库目录无效禁止开始', () => {
    expect(validateStart({ ...ok, repoDirValid: false }).ok).toBe(false)
  })

  it('未选中任何 agent 禁止开始', () => {
    expect(validateStart({ ...ok, selectedAgents: [], moderator: null }).ok).toBe(false)
  })

  it('主持不在选中列表禁止开始', () => {
    expect(validateStart({ ...ok, moderator: 'claude', selectedAgents: ['codex'] }).ok).toBe(false)
  })

  it('空白 prompt 禁止开始', () => {
    expect(validateStart({ ...ok, promptText: '   ' }).ok).toBe(false)
  })
})

describe('validateStartParams（主进程侧不信任校验）', () => {
  const availability = {
    codex: { installed: true, loggedIn: true },
    claude: { installed: true, loggedIn: true }
  }
  const ok = {
    repoDir: '/repo',
    repoDirIsDir: true,
    idea: '设计登录模块',
    selectedAgents: ['codex', 'claude'],
    moderator: 'codex',
    availability
  }

  it('完整合法参数通过', () => {
    expect(validateStartParams(ok)).toEqual({ ok: true, error: null })
  })

  it('仓库目录不存在被拒', () => {
    expect(validateStartParams({ ...ok, repoDirIsDir: false }).ok).toBe(false)
  })

  it('空想法被拒', () => {
    expect(validateStartParams({ ...ok, idea: '   ' }).ok).toBe(false)
  })

  it('未选 agent 被拒', () => {
    expect(validateStartParams({ ...ok, selectedAgents: [], moderator: null }).ok).toBe(false)
  })

  it('重复 agent 被拒', () => {
    expect(validateStartParams({ ...ok, selectedAgents: ['codex', 'codex'] }).ok).toBe(false)
  })

  it('未知 agent 被拒', () => {
    expect(validateStartParams({ ...ok, selectedAgents: ['codex', 'ghost'], moderator: 'codex' }).ok).toBe(false)
  })

  it('未就绪（未登录）agent 被拒', () => {
    const av = { codex: { installed: true, loggedIn: false }, claude: { installed: true, loggedIn: true } }
    expect(validateStartParams({ ...ok, availability: av }).ok).toBe(false)
  })

  it('主持不在选中范围被拒', () => {
    expect(validateStartParams({ ...ok, selectedAgents: ['codex'], moderator: 'claude' }).ok).toBe(false)
  })
})

describe('estimateCallCount', () => {
  it('单 agent 共 3 次调用', () => {
    expect(estimateCallCount(1)).toBe(3)
  })

  it('双 agent 共 5 次调用', () => {
    expect(estimateCallCount(2)).toBe(5)
  })

  it('零 agent 为 0', () => {
    expect(estimateCallCount(0)).toBe(0)
  })
})

describe('buildRepoContext', () => {
  it('包含仓库路径与 Git 分支，不注入代码/文件树', () => {
    const ctx = buildRepoContext({ repoPath: '/x/proj', isGit: true, branch: 'main', clean: true })
    expect(ctx).toContain('/x/proj')
    expect(ctx).toContain('main')
    expect(ctx.toLowerCase()).not.toContain('function ')
  })

  it('clean 与 dirty 状态有区分', () => {
    expect(buildRepoContext({ repoPath: '/p', isGit: true, branch: 'm', clean: true })).toMatch(/clean|干净/i)
    expect(buildRepoContext({ repoPath: '/p', isGit: true, branch: 'm', clean: false })).toMatch(/dirty|改动|未提交/i)
  })

  it('非 Git 目录明确注明', () => {
    const ctx = buildRepoContext({ repoPath: '/x/proj', isGit: false })
    expect(ctx).toContain('/x/proj')
    expect(ctx).toMatch(/未检测到.*Git|非\s*Git/)
  })
})

describe('truncateForDownstream', () => {
  it('超过下游上限时截断并标注', () => {
    const long = 'a'.repeat(DOWNSTREAM_CHAR_LIMIT + 100)
    const t = truncateForDownstream(long)
    expect(t.length).toBeLessThan(long.length)
    expect(t).toMatch(/truncated|已截断/)
  })

  it('未超限时原样返回', () => {
    expect(truncateForDownstream('short')).toBe('short')
  })
})

describe('prompt builders 通用约束', () => {
  const base = { idea: '加一个登录模块', repoContext: 'REPO: /x/proj' }

  it('每个阶段都带只读 / plan-only / 不反问退出约束', () => {
    for (const p of [
      buildRound1Prompt(base),
      buildRound2Prompt({ ...base, ownProposal: 'A', otherProposals: [{ agentName: 'Codex', text: 'B' }] }),
      buildFinalPrompt({ ...base, round1: [{ agentName: 'Codex', text: 'A' }], round2: [{ agentName: 'Codex', text: 'B' }] })
    ]) {
      expect(p).toMatch(/只读|read-only/i)
      expect(p).toMatch(/不要(创建|修改|删除|写)/)
      expect(p).toMatch(/不要询问|不得询问|不要反问/)
      expect(p).toMatch(/只(输出|产出)/)
    }
  })

  it('Round1 携带想法与仓库上下文，且不含他人提案（独立性）', () => {
    const p = buildRound1Prompt(base)
    expect(p).toContain('加一个登录模块')
    expect(p).toContain('REPO: /x/proj')
    expect(p).not.toContain('其他 Agent 的提案')
  })
})

describe('buildRound2Prompt', () => {
  it('多 agent：包含自己与他人的提案', () => {
    const p = buildRound2Prompt({
      idea: 'x', repoContext: 'r',
      ownProposal: '我的方案AAA',
      otherProposals: [{ agentName: 'Codex', text: '他的方案BBB' }]
    })
    expect(p).toContain('我的方案AAA')
    expect(p).toContain('Codex')
    expect(p).toContain('他的方案BBB')
  })

  it('单 agent：otherProposals 为空时进入自我评审', () => {
    const p = buildRound2Prompt({ idea: 'x', repoContext: 'r', ownProposal: '我的方案AAA', otherProposals: [] })
    expect(p).toMatch(/自我评审|自评|审视.*自己/)
    expect(p).toContain('我的方案AAA')
  })

  it('注入的他人提案超长时被截断标注', () => {
    const huge = 'b'.repeat(DOWNSTREAM_CHAR_LIMIT + 50)
    const p = buildRound2Prompt({ idea: 'x', repoContext: 'r', ownProposal: 'A', otherProposals: [{ agentName: 'Codex', text: huge }] })
    expect(p).toMatch(/truncated|已截断/)
  })
})

describe('buildFinalPrompt', () => {
  it('包含各轮内容与汇总指示', () => {
    const p = buildFinalPrompt({
      idea: 'x', repoContext: 'r',
      round1: [{ agentName: 'Codex', text: 'R1内容' }],
      round2: [{ agentName: 'Codex', text: 'R2内容' }]
    })
    expect(p).toContain('R1内容')
    expect(p).toContain('R2内容')
    expect(p).toMatch(/最终|汇总|综合/)
  })
})

describe('buildMessageNavigationTargets', () => {
  it('按 phase + agentId 建立首条 agent/moderator 消息导航目标', () => {
    const targets = buildMessageNavigationTargets([
      { id: 'user-1', type: 'user', content: 'idea' },
      { id: 'r1-codex-1', type: 'agent', phase: 'round1', agentId: 'codex', content: 'first' },
      { id: 'r1-codex-2', type: 'agent', phase: 'round1', agentId: 'codex', content: 'second' },
      { id: 'r1-system', type: 'system', phase: 'round1', agentId: 'claude', content: 'failed' },
      { id: 'r2-claude', type: 'agent', phase: 'round2', agentId: 'claude', content: 'review' },
      { id: 'final-codex', type: 'moderator', phase: 'final', agentId: 'codex', content: 'summary' },
      { id: 'missing-agent', type: 'agent', phase: 'round2', content: 'no agent id' }
    ])

    expect(targets).toEqual({
      'round1:codex': 'r1-codex-1',
      'round2:claude': 'r2-claude',
      'final:codex': 'final-codex'
    })
  })

  it('空消息列表返回空目标映射', () => {
    expect(buildMessageNavigationTargets([])).toEqual({})
    expect(buildMessageNavigationTargets(null)).toEqual({})
  })
})

describe('agentsForDiscussionPhase', () => {
  it('查看历史记录时使用记录中的参与 agent 与主持 agent', () => {
    const record = {
      selectedAgents: ['claude'],
      moderator: 'claude'
    }
    const config = {
      selectedAgents: ['codex'],
      moderator: 'codex'
    }

    expect(agentsForDiscussionPhase('round1', { record, config })).toEqual(['claude'])
    expect(agentsForDiscussionPhase('round2', { record, config })).toEqual(['claude'])
    expect(agentsForDiscussionPhase('final', { record, config })).toEqual(['claude'])
  })

  it('没有记录时使用当前配置', () => {
    const config = {
      selectedAgents: ['codex', 'claude'],
      moderator: 'codex'
    }

    expect(agentsForDiscussionPhase('round1', { record: null, config })).toEqual(['codex', 'claude'])
    expect(agentsForDiscussionPhase('final', { record: null, config })).toEqual(['codex'])
  })
})

describe('exportMarkdown', () => {
  function sampleRecord(overrides = {}) {
    return {
      id: 'run1',
      createdAt: '2026-06-15T00:00:00.000Z',
      updatedAt: '2026-06-15T00:05:00.000Z',
      repoDir: '/x/proj',
      isGit: true,
      branch: 'main',
      selectedAgents: ['codex', 'claude'],
      moderator: 'codex',
      idea: '加登录模块',
      status: 'completed',
      messages: [
        { type: 'user', content: '加登录模块' },
        { type: 'agent', agentId: 'codex', agentName: 'Codex', phase: 'round1', content: 'R1-codex' },
        { type: 'agent', agentId: 'claude', agentName: 'ClaudeCode', phase: 'round1', content: 'R1-claude' },
        { type: 'agent', agentId: 'codex', agentName: 'Codex', phase: 'round2', content: 'R2-codex' },
        { type: 'moderator', agentId: 'codex', agentName: 'Codex', phase: 'final', content: 'FINAL-summary' }
      ],
      ...overrides
    }
  }

  it('完整记录含元数据 / 想法 / 各轮 / 最终', () => {
    const md = exportMarkdown(sampleRecord())
    expect(md).toContain('/x/proj')
    expect(md).toContain('加登录模块')
    expect(md).toContain('R1-codex')
    expect(md).toContain('R1-claude')
    expect(md).toContain('R2-codex')
    expect(md).toContain('FINAL-summary')
  })

  it('取消记录保留已产出消息并注明取消', () => {
    const md = exportMarkdown(sampleRecord({
      status: 'canceled',
      messages: [
        { type: 'user', content: '加登录模块' },
        { type: 'system', content: '用户已停止研讨' }
      ]
    }))
    expect(md).toMatch(/取消|canceled/i)
    expect(md).toContain('用户已停止研讨')
  })

  it('失败的部分记录仍可导出已产出内容', () => {
    const md = exportMarkdown(sampleRecord({
      status: 'failed',
      messages: [
        { type: 'user', content: '加登录模块' },
        { type: 'agent', agentName: 'Codex', phase: 'round1', content: 'R1-codex' },
        { type: 'system', content: '最终汇总失败' }
      ]
    }))
    expect(md).toContain('R1-codex')
    expect(md).toMatch(/失败|failed/i)
  })
})
