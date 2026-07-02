// 研讨编排器：固定流程 Round1（并行独立）→ Round2（并行交叉/自评）→ Final（主持汇总）。
// 通过注入 invoke / gitCheck / shouldCancel / emit 与副作用解耦，决策逻辑可单测。
// 返回 { status, messages, phases }；消息按时间顺序产生，部分失败/取消时仍保留已产出内容。

import {
  PHASES,
  RUN_STATUS,
  MESSAGE_TYPE,
  buildRound1Prompt,
  buildRound2Prompt,
  buildFinalPrompt
} from '../../src/renderer/utils/agentWorkshopHelper.js'

export async function runDiscussion(opts) {
  const {
    selectedAgents,
    moderator,
    idea,
    repoContext,
    invoke,
    gitCheck,
    shouldCancel,
    agentName,
    emit
  } = opts

  const messages = []
  const phases = {}
  const nameOf = agentName || ((id) => id)

  const push = (m) => {
    const msg = { id: `${Date.now()}-${messages.length}`, createdAt: new Date().toISOString(), ...m }
    messages.push(msg)
    if (emit) emit({ type: 'message', payload: msg })
    return msg
  }
  const finish = (status) => {
    if (emit) emit({ type: 'run-finished', payload: { status } })
    return { status, messages, phases }
  }
  const canceled = () => (shouldCancel ? !!shouldCancel() : false)
  const cancelOut = () => {
    push({ type: MESSAGE_TYPE.SYSTEM, content: '研讨已被取消。' })
    return finish(RUN_STATUS.CANCELED)
  }
  // Git 检查为咨询式二次防线：发现工作区变化只提示一次、不中断研讨；
  // 实时只读由各 CLI 的沙箱参数（read-only / plan + 只读工具）强制保证。
  let gitAdvised = false
  const adviseGit = (g) => {
    if (!gitAdvised && g && g.changed) {
      gitAdvised = true
      push({ type: MESSAGE_TYPE.SYSTEM, content: g.warning || '检测到工作区在研讨期间发生变化（仅提示，未中断；只读由 CLI 沙箱保证）。' })
    }
  }
  const runInvoke = async (agentId, phase, prompt) => {
    if (emit) emit({ type: 'invocation', payload: { phase, agentId, status: 'running' } })
    const res = await invoke({ agentId, phase, prompt })
    if (emit) emit({ type: 'invocation', payload: { phase, agentId, status: res.ok ? 'succeeded' : 'failed' } })
    return res
  }
  const checkGit = async (phase) => (gitCheck ? await gitCheck(phase) : { ok: true })
  // 收集某一轮的成功子集：成功项入 AGENT 消息并返回 { agentId, agentName, text }，失败项（非取消）入 SYSTEM 消息
  const collectPhase = (results, phase, failLabel) => {
    const succeeded = []
    for (const { agentId, res } of results) {
      if (res.ok) {
        push({ type: MESSAGE_TYPE.AGENT, agentId, agentName: nameOf(agentId), phase, content: res.text, truncated: res.truncated })
        succeeded.push({ agentId, agentName: nameOf(agentId), text: res.text })
      } else if (!res.canceled) {
        push({ type: MESSAGE_TYPE.SYSTEM, phase, content: `${nameOf(agentId)}（${agentId}）${failLabel}：${res.error || '未知错误'}` })
      }
    }
    return succeeded
  }

  // 用户想法入时间线
  push({ type: MESSAGE_TYPE.USER, content: idea })
  if (canceled()) return cancelOut()

  // ── Round 1：所有选中 agent 并行、独立 ──
  const round1Prompt = buildRound1Prompt({ idea, repoContext })
  const r1 = await Promise.all(
    selectedAgents.map(async (agentId) => ({ agentId, res: await runInvoke(agentId, PHASES.ROUND1, round1Prompt) }))
  )
  const s1 = collectPhase(r1, PHASES.ROUND1, '第一轮失败')
  phases[PHASES.ROUND1] = { total: selectedAgents.length, succeeded: s1.map((x) => x.agentId) }

  // 取消优先于「全失败」判定：停止研讨会让本轮调用都以 canceled 失败返回，
  // 不能据此误判为 failed（res.canceled 兜底，防 shouldCancel 未及时翻转）
  if (canceled() || r1.some(({ res }) => res.canceled)) return cancelOut()
  const g1 = await checkGit(PHASES.ROUND1)
  adviseGit(g1)
  if (s1.length === 0) {
    push({ type: MESSAGE_TYPE.SYSTEM, content: '所有 Agent 第一轮均失败，研讨结束。' })
    return finish(RUN_STATUS.FAILED)
  }

  // ── Round 2：并行；仅第一轮成功的子集 S1 进入；多 agent 交叉评审，单 agent 自评 ──
  const r2 = await Promise.all(
    s1.map(async ({ agentId }) => {
      const own = s1.find((x) => x.agentId === agentId)
      const others = s1.filter((x) => x.agentId !== agentId).map((x) => ({ agentName: x.agentName, text: x.text }))
      const prompt = buildRound2Prompt({ idea, repoContext, ownProposal: own ? own.text : '', otherProposals: others })
      return { agentId, res: await runInvoke(agentId, PHASES.ROUND2, prompt) }
    })
  )
  const s2 = collectPhase(r2, PHASES.ROUND2, '交叉评审失败')
  phases[PHASES.ROUND2] = { total: s1.length, succeeded: s2.map((x) => x.agentId) }

  if (canceled() || r2.some(({ res }) => res.canceled)) return cancelOut()
  const g2 = await checkGit(PHASES.ROUND2)
  adviseGit(g2)

  // ── Final：主持 agent 汇总（用已有的 round1/round2 成功输出）──
  const finalPrompt = buildFinalPrompt({ idea, repoContext, round1: s1, round2: s2 })
  const fres = await runInvoke(moderator, PHASES.FINAL, finalPrompt)
  if (canceled() || fres.canceled) return cancelOut()
  if (!fres.ok) {
    push({ type: MESSAGE_TYPE.SYSTEM, phase: PHASES.FINAL, content: `最终汇总失败：${fres.error || '未知错误'}` })
    phases[PHASES.FINAL] = { succeeded: [] }
    return finish(RUN_STATUS.FAILED)
  }
  push({ type: MESSAGE_TYPE.MODERATOR, agentId: moderator, agentName: nameOf(moderator), phase: PHASES.FINAL, content: fres.text, truncated: fres.truncated })
  phases[PHASES.FINAL] = { succeeded: [moderator] }

  const g3 = await checkGit(PHASES.FINAL)
  adviseGit(g3)

  return finish(RUN_STATUS.COMPLETED)
}
