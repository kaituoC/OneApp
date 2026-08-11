// Agent 研讨室纯逻辑层：与进程无关的常量、配置派生、调用次数估算等。
// 全部为纯函数/常量，可被渲染进程与主进程双向 import，并脱离运行环境单元测试。

// ───────────────────────── 常量与模型 ─────────────────────────

/** V1 仅支持 Codex 与 ClaudeCode 两个本地 agent */
export const AGENTS = {
  codex: { id: 'codex', name: 'Codex' },
  claude: { id: 'claude', name: 'ClaudeCode' }
}

/** agent id 列表，作为遍历/排序的权威顺序 */
export const AGENT_IDS = ['codex', 'claude']

/** 固定研讨流程的三个阶段 */
export const PHASES = { ROUND1: 'round1', ROUND2: 'round2', FINAL: 'final' }

/** 整场研讨的状态 */
export const RUN_STATUS = {
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELED: 'canceled'
}

/** 时间线消息类型 */
export const MESSAGE_TYPE = {
  USER: 'user',
  AGENT: 'agent',
  MODERATOR: 'moderator',
  SYSTEM: 'system'
}

/** 单次 agent 调用默认超时（10 分钟） */
export const DEFAULT_TIMEOUT_MS = 600000

/** 单条响应存储/展示上限（512 KB），超出截断并标注 */
export const STORE_LIMIT_BYTES = 512 * 1024

/** 注入下游阶段 prompt 时每段上限（字符数），超出截断并标注 */
export const DOWNSTREAM_CHAR_LIMIT = 20000

/** electron-store 配置键，统一 agentWorkshop 命名空间前缀 */
export const STORE_KEYS = {
  repoDir: 'agentWorkshop.repoDir',
  selectedAgents: 'agentWorkshop.selectedAgents',
  moderator: 'agentWorkshop.moderator',
  availability: 'agentWorkshop.availability',
  lastRunId: 'agentWorkshop.lastRunId',
  costNoticeAccepted: 'agentWorkshop.costNoticeAccepted',
  proxyConfig: 'agentWorkshop.proxyConfig'
}

export const DEFAULT_PROXY_CONFIG = {
  enabled: false,
  url: '',
  applyHttp: true,
  applyHttps: true,
  applyAll: false
}

// 每个开关 → 它控制的大小写环境变量名；「删除继承值」与「注入配置值」共用这一张表，单一真相源
const PROXY_ENV_MAP = [
  { flag: 'applyHttp', keys: ['HTTP_PROXY', 'http_proxy'] },
  { flag: 'applyHttps', keys: ['HTTPS_PROXY', 'https_proxy'] },
  { flag: 'applyAll', keys: ['ALL_PROXY', 'all_proxy'] }
]

export const PROXY_ENV_KEYS = PROXY_ENV_MAP.flatMap((m) => m.keys)

export function normalizeProxyConfig(config = {}) {
  return {
    enabled: Boolean(config.enabled),
    url: String(config.url || '').trim(),
    applyHttp: config.applyHttp !== false,
    applyHttps: config.applyHttps !== false,
    applyAll: Boolean(config.applyAll)
  }
}

export function validateProxyConfig(config = {}) {
  const normalized = normalizeProxyConfig(config)
  if (!normalized.enabled) return { ok: true, error: null }
  if (!normalized.url) return { ok: false, error: '请输入代理地址' }
  try {
    const url = new URL(normalized.url)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { ok: false, error: '代理地址必须使用 HTTP 或 HTTPS' }
    }
    if (!url.hostname) return { ok: false, error: '代理地址缺少主机名' }
  } catch {
    return { ok: false, error: '代理地址格式无效' }
  }
  if (!normalized.applyHttp && !normalized.applyHttps && !normalized.applyAll) {
    return { ok: false, error: '请至少选择一种代理环境变量' }
  }
  return { ok: true, error: null }
}

export function buildAgentEnvironment(baseEnv = {}, proxyConfig = DEFAULT_PROXY_CONFIG) {
  const env = { ...(baseEnv || {}) }
  for (const key of PROXY_ENV_KEYS) delete env[key]

  const config = normalizeProxyConfig(proxyConfig)
  if (!validateProxyConfig(config).ok) return env
  if (!config.enabled) return env

  for (const { flag, keys } of PROXY_ENV_MAP) {
    if (config[flag]) for (const key of keys) env[key] = config.url
  }
  return env
}

// ───────────────────────── 可用性与就绪态 ─────────────────────────

/** 已安装且已登录才算「就绪」，可被选入研讨 */
export function isAgentReady(entry) {
  return !!(entry && entry.installed && entry.loggedIn)
}

/** 将检测结果映射为卡片三态：not-installed / logged-out / ready */
export function agentCardState(entry) {
  if (!entry || !entry.installed) return 'not-installed'
  if (!entry.loggedIn) return 'logged-out'
  return 'ready'
}

/** 按 AGENT_IDS 顺序返回所有就绪的 agent id */
export function readyAgents(availability) {
  return AGENT_IDS.filter((id) => isAgentReady(availability?.[id]))
}

// ───────────────────────── 选择与主持派生 ─────────────────────────

/** 默认选中所有就绪 agent */
export function defaultSelectedAgents(availability) {
  return readyAgents(availability)
}

/** 主持默认取首个被选中的 agent，无则 null */
export function defaultModerator(selectedAgents) {
  return selectedAgents.length > 0 ? selectedAgents[0] : null
}

/** 主持回退：仍在选中列表则保持，否则取首个剩余 agent（无则 null） */
export function moderatorFallback(currentModerator, selectedAgents) {
  if (currentModerator && selectedAgents.includes(currentModerator)) {
    return currentModerator
  }
  return selectedAgents.length > 0 ? selectedAgents[0] : null
}

// ───────────────────────── 开始校验 ─────────────────────────

/**
 * 校验是否可开始研讨，返回 { ok, reason }。
 * 优先级：检测中 → 仓库无效 → 无选中 → 主持无效 → prompt 为空。
 */
export function validateStart({ promptText, repoDirValid, selectedAgents, moderator, detecting }) {
  if (detecting) return { ok: false, reason: '正在检测 Agent 可用性，请稍候' }
  if (!repoDirValid) return { ok: false, reason: '请选择有效的本地仓库目录' }
  if (!selectedAgents || selectedAgents.length === 0) {
    return { ok: false, reason: '请至少选择一个就绪的 Agent' }
  }
  if (!moderator || !selectedAgents.includes(moderator)) {
    return { ok: false, reason: '请选择一个有效的主持 Agent' }
  }
  if (!promptText || !promptText.trim()) {
    return { ok: false, reason: '请输入想法或初始方案' }
  }
  return { ok: true, reason: null }
}

/**
 * 主进程侧开始校验：不信任 renderer 传来的参数，独立复核一遍。
 * 仓库目录是否真实存在由调用方以 `repoDirIsDir` 传入（fs 副作用不放进纯函数）。
 * 返回 { ok, error }。
 */
export function validateStartParams({ repoDir, idea, selectedAgents, moderator, availability, repoDirIsDir }) {
  if (!repoDir || !repoDirIsDir) return { ok: false, error: '仓库目录无效或不存在' }
  if (!idea || !String(idea).trim()) return { ok: false, error: '想法 / 初始方案不能为空' }
  if (!Array.isArray(selectedAgents) || selectedAgents.length === 0) {
    return { ok: false, error: '未选择任何 Agent' }
  }
  const unique = [...new Set(selectedAgents)]
  if (unique.length !== selectedAgents.length) return { ok: false, error: 'Agent 选择存在重复' }
  if (!unique.every((id) => AGENT_IDS.includes(id))) return { ok: false, error: '包含未知 Agent' }
  if (!unique.every((id) => isAgentReady(availability?.[id]))) {
    return { ok: false, error: '存在未就绪（未安装或未登录）的 Agent' }
  }
  if (!moderator || !unique.includes(moderator)) return { ok: false, error: '主持 Agent 无效或不在所选范围内' }
  return { ok: true, error: null }
}

// ───────────────────────── 调用次数估算 ─────────────────────────

/**
 * 估算整场研讨的 agent 调用次数：Round1(n) + Round2(n) + Final(1) = 2n + 1。
 * 单 agent → 3，双 agent → 5。
 */
export function estimateCallCount(selectedCount) {
  return selectedCount > 0 ? selectedCount * 2 + 1 : 0
}

// ───────────────────────── 仓库上下文（minimal） ─────────────────────────

/**
 * 生成注入 prompt 的最小仓库上下文：仅事实，不注入文件内容/文件树/代码摘要。
 */
export function buildRepoContext({ repoPath, isGit, branch, clean }) {
  const lines = [`仓库根目录：${repoPath}`]
  if (isGit) {
    lines.push('Git 仓库：是')
    if (branch) lines.push(`当前分支：${branch}`)
    lines.push(`工作区状态：${clean ? 'clean（无未提交改动）' : 'dirty（存在未提交改动）'}`)
  } else {
    lines.push('Git 仓库：未检测到 Git 元数据')
  }
  lines.push('你可以按需读取该目录下的文件来分析，但不要修改任何内容。')
  return lines.join('\n')
}

// ───────────────────────── Prompt 构造 ─────────────────────────

/** 每个阶段 prompt 都重复的只读 / plan-only / 不反问约束 */
export const READ_ONLY_CONSTRAINTS = [
  '## 硬性约束（只读分析模式）',
  '- 你处于只读模式：不要创建、修改、删除或格式化任何文件，不要安装依赖，不要提交、切换分支或推送，不要以任何方式改动工作区。',
  '- 只输出你的分析与方案文本；即使需求中提到"实现"或"创建"，也不要尝试任何写操作。',
  '- 不要询问是否退出只读或 plan 模式，直接给出方案。',
  '- 你可以按需读取仓库内的文件来支撑判断。'
].join('\n')

/** 把注入下游 prompt 的单段文本截断到上限并标注 */
export function truncateForDownstream(text) {
  const s = String(text ?? '')
  if (s.length <= DOWNSTREAM_CHAR_LIMIT) return s
  return s.slice(0, DOWNSTREAM_CHAR_LIMIT) + '\n\n…（已截断 / truncated for downstream prompt）'
}

/** 第一轮：独立提案，看不到其他 agent 的回答 */
export function buildRound1Prompt({ idea, repoContext }) {
  return [
    '你是一名资深技术评审，请基于下面的需求与仓库情况，独立给出一份实现方案。',
    '',
    '## 需求 / 想法',
    idea,
    '',
    '## 仓库情况',
    repoContext,
    '',
    '## 你的任务',
    '独立分析并产出一份结构化的实现方案（背景理解、关键设计、步骤、风险）。这是第一轮独立提案，你看不到其他 Agent 的回答。',
    '',
    READ_ONLY_CONSTRAINTS
  ].join('\n')
}

/** 第二轮：交叉评审（多 agent）或自我评审（单 agent） */
export function buildRound2Prompt({ idea, repoContext, ownProposal, otherProposals }) {
  const others = otherProposals || []
  const head = [
    '这是第二轮评审。',
    '',
    '## 需求 / 想法', idea,
    '',
    '## 仓库情况', repoContext,
    '',
    '## 你的第一轮提案', truncateForDownstream(ownProposal || '')
  ]
  let body
  if (others.length === 0) {
    body = [
      '',
      '## 你的任务（自我评审）',
      '当前只有你一个 Agent。请审视你自己上面的第一轮提案，指出其中的薄弱点、风险与遗漏，并据此修订出一份更完善的方案。'
    ]
  } else {
    const blocks = others.map((o) => `### ${o.agentName} 的提案\n${truncateForDownstream(o.text || '')}`)
    body = [
      '',
      '## 其他 Agent 的提案',
      ...blocks,
      '',
      '## 你的任务（交叉评审）',
      '对照其他 Agent 的提案，指出彼此的优劣与分歧，吸收合理之处，给出你修订后的方案。'
    ]
  }
  return [...head, ...body, '', READ_ONLY_CONSTRAINTS].join('\n')
}

/** 终轮：主持 agent 综合各轮，产出最终方案 */
export function buildFinalPrompt({ idea, repoContext, round1, round2 }) {
  const section = (arr) => (arr || []).map((o) => `### ${o.agentName}\n${truncateForDownstream(o.text || '')}`)
  const r1 = section(round1)
  const r2 = section(round2)
  return [
    '你是本次研讨的主持人，请综合前面各轮内容，产出一份最终的实现方案（Markdown）。',
    '',
    '## 需求 / 想法', idea,
    '',
    '## 仓库情况', repoContext,
    '',
    '## 第一轮独立提案', ...r1,
    '',
    '## 第二轮交叉评审', ...r2,
    '',
    '## 你的任务',
    '综合上述讨论，输出一份结构清晰、可执行的最终方案，解决分歧并给出明确建议。',
    '',
    READ_ONLY_CONSTRAINTS
  ].join('\n')
}

// ───────────────────────── Timeline 导航 ─────────────────────────

/**
 * 从 timeline 消息推导可导航目标：key 为 `${phase}:${agentId}`，value 为首条消息 id。
 * 仅 agent / moderator 输出可作为进度 chip 的定位目标，系统消息不参与导航。
 */
export function buildMessageNavigationTargets(messages) {
  const targets = {}
  for (const message of Array.isArray(messages) ? messages : []) {
    if (!message?.id || !message.phase || !message.agentId) continue
    if (message.type !== MESSAGE_TYPE.AGENT && message.type !== MESSAGE_TYPE.MODERATOR) continue
    const key = `${message.phase}:${message.agentId}`
    if (!targets[key]) targets[key] = message.id
  }
  return targets
}

/**
 * 返回某个进度阶段应展示的 agent。查看已有记录时以记录快照为准；
 * 尚未开始/无记录时以当前配置为准。
 */
export function agentsForDiscussionPhase(phase, { record, config }) {
  const source = record || config || {}
  if (phase === PHASES.FINAL) return source.moderator ? [source.moderator] : []
  return Array.isArray(source.selectedAgents) ? source.selectedAgents : []
}

export function getWorkshopUiStage(record, activeRunId) {
  if (!record) return 'prepare'
  if (record.status === 'running' && record.id === activeRunId) return 'running'
  return 'result'
}

// ───────────────────────── Markdown 导出 ─────────────────────────

function statusLabel(status) {
  switch (status) {
    case RUN_STATUS.RUNNING: return '进行中'
    case RUN_STATUS.COMPLETED: return '已完成'
    case RUN_STATUS.FAILED: return '失败（failed）'
    case RUN_STATUS.CANCELED: return '已取消（canceled）'
    default: return status || '—'
  }
}

/**
 * 将一条研讨记录导出为完整 Markdown。
 * 对未完成/失败/取消的部分记录同样有效——只输出已产出的消息。
 */
export function exportMarkdown(record) {
  const r = record || {}
  const msgs = r.messages || []
  const nameOf = (id) => AGENTS[id]?.name || id || '—'
  const out = ['# Agent 研讨室记录', '']

  out.push('## 基本信息')
  out.push(`- 创建时间：${r.createdAt || '—'}`)
  out.push(`- 仓库目录：${r.repoDir || '—'}`)
  out.push(`- Git：${r.isGit ? `是（分支 ${r.branch || '—'}）` : '否'}`)
  out.push(`- 参与 Agent：${(r.selectedAgents || []).map(nameOf).join('、') || '—'}`)
  out.push(`- 主持 Agent：${nameOf(r.moderator)}`)
  out.push(`- 状态：${statusLabel(r.status)}`)
  out.push('')

  const userMsg = msgs.find((m) => m.type === 'user')
  out.push('## 用户想法', userMsg?.content ?? r.idea ?? '—', '')

  const phaseSection = (phase, title) => {
    const items = msgs.filter((m) => m.phase === phase && (m.type === 'agent' || m.type === 'moderator'))
    if (items.length === 0) return
    out.push(`## ${title}`)
    for (const m of items) {
      out.push(`### ${m.agentName || nameOf(m.agentId)}${m.truncated ? '（内容已截断）' : ''}`)
      out.push(m.content || '', '')
    }
  }
  phaseSection('round1', '第一轮 · 独立提案')
  phaseSection('round2', '第二轮 · 交叉评审')
  phaseSection('final', '最终方案')

  const sys = msgs.filter((m) => m.type === 'system')
  if (sys.length > 0) {
    out.push('## 系统提示与错误')
    for (const m of sys) out.push(`- ${m.content || ''}`)
    out.push('')
  }

  return out.join('\n')
}
