// Agent 研讨室主进程 IPC：配置读写、检测、最近记录、启动/停止研讨、Markdown 导出，
// 以及通过 webContents 向渲染层推送 `agent-discussion:event` 事件流。
import { ipcMain, dialog, app } from 'electron'
import fs from 'fs'
import { validPath } from '../workbenchPolicy.js'
import { detectAll } from './detection.js'
import { runAgent } from './runner.js'
import { createRecordStore } from './records.js'
import { isGitRepo, readGitStatus, readGitBranch, gitSafetyResult } from './gitSafety.js'
import { runDiscussion } from './orchestrator.js'
import { buildAgentArgs } from './adapters.js'
import {
  exportMarkdown,
  buildRepoContext,
  validateStartParams,
  normalizeProxyConfig,
  validateProxyConfig,
  buildAgentEnvironment,
  DEFAULT_PROXY_CONFIG,
  AGENTS,
  STORE_KEYS,
  RUN_STATUS,
  MESSAGE_TYPE
} from '../../src/renderer/utils/agentWorkshopHelper.js'

const isExistingDir = (dir) => {
  try { return typeof dir === 'string' && !!dir && fs.statSync(dir).isDirectory() } catch { return false }
}

export function registerAgentWorkshopIpc({ store, getWindow, handle = ipcMain.handle.bind(ipcMain), runner = runAgent, fileAccess, canStart = () => true }) {
  const records = createRecordStore(app.getPath('userData'))
  let active = null // { runId, abort, canceled }

  let idleWaiters = []
  const clearActive = () => { active = null; idleWaiters.splice(0).forEach(resolve => resolve()) }
  const cancel = () => { if (active) { active.canceled = true; active.abort?.abort() } }
  const waitForIdle = () => active ? new Promise(resolve => idleWaiters.push(resolve)) : Promise.resolve()
  const emitEvent = (runId, type, payload) => {
    const win = getWindow()
    if (win && !win.isDestroyed()) win.webContents.send('agent-discussion:event', { runId, type, payload })
  }
  const readProxyConfig = () => normalizeProxyConfig(store.get(STORE_KEYS.proxyConfig, DEFAULT_PROXY_CONFIG))
  const buildCurrentAgentEnv = () => buildAgentEnvironment(process.env, readProxyConfig())

  handle('agent-discussion:get-config', () => ({
    repoDir: store.get(STORE_KEYS.repoDir, ''),
    selectedAgents: store.get(STORE_KEYS.selectedAgents, []),
    moderator: store.get(STORE_KEYS.moderator, null),
    availability: store.get(STORE_KEYS.availability, null),
    costNoticeAccepted: store.get(STORE_KEYS.costNoticeAccepted, false),
    proxyConfig: readProxyConfig()
  }))

  handle('agent-discussion:set-config', (e, partial) => {
    if (!partial || typeof partial !== 'object' || Array.isArray(partial) || Object.entries(partial).some(([key,value]) => !({repoDir:v => v === '' || validPath(v), selectedAgents:v => Array.isArray(v) && v.length <= 2 && v.every(id => typeof id === 'string' && Object.hasOwn(AGENTS,id)), moderator:v => v === null || (typeof v === 'string' && Object.hasOwn(AGENTS,v)), costNoticeAccepted:v => typeof v === 'boolean', proxyConfig:v => v && typeof v === 'object' && !Array.isArray(v)})[key]?.(value))) return {success:false,error:'配置参数无效'}
    if (partial.repoDir && fileAccess && !fileAccess.canAccess(partial.repoDir,{directory:true})) return {success:false,error:'请先选择仓库目录授权'}
    // 先持久化其余合法键，proxyConfig 校验失败只拒绝它自身，不牵连兄弟键
    const map = {
      repoDir: STORE_KEYS.repoDir,
      selectedAgents: STORE_KEYS.selectedAgents,
      moderator: STORE_KEYS.moderator,
      costNoticeAccepted: STORE_KEYS.costNoticeAccepted
    }
    for (const [k, v] of Object.entries(partial || {})) {
      if (map[k]) store.set(map[k], v)
    }
    if (partial && Object.prototype.hasOwnProperty.call(partial, 'proxyConfig')) {
      const proxyConfig = normalizeProxyConfig(partial.proxyConfig)
      const valid = validateProxyConfig(proxyConfig)
      if (!valid.ok) return { success: false, error: valid.error }
      store.set(STORE_KEYS.proxyConfig, proxyConfig)
    }
    return { success: true }
  })

  handle('agent-discussion:check-agents', async () => {
    const availability = await detectAll()
    store.set(STORE_KEYS.availability, availability)
    return availability
  })

  handle('agent-discussion:get-last-run', () => records.loadLatest())

  // 探测当前所选目录是否 Git 仓库（供 UI 实时提示，不依赖历史记录）
  handle('agent-discussion:check-repo', (e, dir) => ({ isGit: validPath(dir) && (!fileAccess || fileAccess.canAccess(dir,{directory:true})) && isGitRepo(dir) }))

  handle('agent-discussion:test-agent-connection', async (e, params = {}) => {
    if (!canStart()) return {success:false,error:'工作台正在关闭，无法开始连接测试'}
    // 与正式研讨互斥：运行中禁止再 spawn 测试进程（不信任 renderer 的按钮禁用态）
    if (active) return { success: false, error: '已有活动调用，无法测试连接' }
    if (!params || typeof params !== 'object' || Array.isArray(params)) return {success:false,error:'参数无效'}
    const { agentId } = params
    if (typeof agentId !== 'string' || !Object.hasOwn(AGENTS,agentId)) return { success: false, error: '未知 Agent' }

    const availability = store.get(STORE_KEYS.availability, {}) || {}
    const entry = availability[agentId]
    if (!entry?.installed || !entry?.resolvedPath) return { success: false, error: 'Agent 未安装或尚未检测' }

    const repoDir = params.repoDir || store.get(STORE_KEYS.repoDir, '')
    if (fileAccess && !fileAccess.canAccess(repoDir,{directory:true})) return {success:false,error:'请先选择仓库目录授权'}
    if (!isExistingDir(repoDir)) return { success: false, error: '仓库目录无效或不存在' }

    const args = buildAgentArgs(agentId, { repoDir })
    const abort = new AbortController()
    active = { kind: 'connection', abort, canceled: false }
    try {
      const res = await runner({
        signal: abort.signal,
        command: entry.resolvedPath,
        args,
        cwd: repoDir,
        prompt: 'Reply with exactly: OK',
        env: buildCurrentAgentEnv(),
        timeoutMs: 120000
      })
      return {
        success: res.ok,
        text: res.text || '',
        error: res.ok ? null : (res.error || '连接测试失败'),
        truncated: !!res.truncated,
        timeout: !!res.timeout
      }
    } catch (error) { return { success: false, error: error.message } }
    finally { clearActive() }
  })

  handle('agent-discussion:stop', () => {
    cancel()
    return { success: true }
  })

  handle('agent-discussion:export-markdown', async (e, record) => {
    if (!record || !Array.isArray(record.messages) || !Array.isArray(record.selectedAgents) || record.messages.some(m => !m || typeof m.content !== 'string')) return {success:false,error:'记录参数无效'}
    const md = exportMarkdown(record)
    const win = getWindow()
    const res = await dialog.showSaveDialog(win, {
      defaultPath: 'agent-workshop.md',
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (res.canceled || !res.filePath) return { success: false, canceled: true }
    try {
      fileAccess?.grantFile(res.filePath,true)
      fs.writeFileSync(fileAccess ? fileAccess.requireAccess(res.filePath,{write:true}) : res.filePath, md, 'utf-8')
      return { success: true, filePath: res.filePath }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  handle('agent-discussion:start', async (e, params) => {
    if (!canStart()) return {success:false,error:'工作台正在关闭，无法开始研讨'}
    // 运行互斥：已有研讨进行中直接拒绝，避免覆盖 active 导致旧 run 失控
    if (active) return { success: false, error: '已有活动调用，请先停止当前调用。' }

    const { repoDir, selectedAgents, moderator, idea } = params || {}
    const availability = store.get(STORE_KEYS.availability, {}) || {}

    // 主进程参数校验：不信任 renderer 传来的参数
    const valid = validateStartParams({ repoDir, idea, selectedAgents, moderator, availability, repoDirIsDir: isExistingDir(repoDir) })
    if (!valid.ok) return { success: false, error: valid.error }
    if (typeof idea !== 'string' || idea.length > 512 * 1024 || !validPath(repoDir)) return {success:false,error:'参数无效'}
    if (fileAccess && !fileAccess.canAccess(repoDir,{directory:true})) return {success:false,error:'请先选择仓库目录授权'}

    const isGit = isGitRepo(repoDir)
    const branch = isGit ? readGitBranch(repoDir) : null
    const baselineStatus = isGit ? readGitStatus(repoDir) : null
    const repoContext = buildRepoContext({
      repoPath: repoDir,
      isGit,
      branch,
      clean: !((baselineStatus || '').trim())
    })

    const runId = `run-${Date.now()}`
    const abort = new AbortController()
    active = { kind: 'discussion', runId, abort, canceled: false }
    store.set(STORE_KEYS.lastRunId, runId)

    const record = {
      id: runId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      repoDir,
      isGit,
      branch,
      selectedAgents,
      moderator,
      idea,
      status: RUN_STATUS.RUNNING,
      phases: {},
      messages: []
    }
    try {
      records.save(record)
      emitEvent(runId, 'run-started', { record })

      const resolvedPath = (id) => availability[id]?.resolvedPath || id
      const agentEnv = buildCurrentAgentEnv()

      const invoke = async ({ agentId, prompt }) => {
        const args = buildAgentArgs(agentId, { repoDir })
        return runner({ command: resolvedPath(agentId), args, cwd: repoDir, prompt, signal: abort.signal, env: agentEnv })
      }
      const gitCheck = async () => {
        if (!isGit) return { ok: true }
        return gitSafetyResult({ isGit, baseline: baselineStatus, current: readGitStatus(repoDir) })
      }
      const onEvent = (ev) => {
        if (ev.type === 'message') {
          record.messages.push(ev.payload)
          record.updatedAt = new Date().toISOString()
          records.save(record)
        }
        emitEvent(runId, ev.type, ev.payload)
      }

      const result = await runDiscussion({
        selectedAgents,
        moderator,
        idea,
        repoContext,
        invoke,
        gitCheck,
        shouldCancel: () => !!(active && active.runId === runId && active.canceled),
        agentName: (id) => AGENTS[id]?.name || id,
        emit: onEvent
      })

      record.status = result.status
      record.phases = result.phases
      record.updatedAt = new Date().toISOString()
      records.save(record)
      return { success: true, record }
    } catch (err) {
      // 编排异常兜底：写系统消息、置 failed、补发 run-finished，避免记录卡在 running
      const msg = {
        id: `${Date.now()}-err`,
        createdAt: new Date().toISOString(),
        type: MESSAGE_TYPE.SYSTEM,
        content: `研讨异常终止：${err.message}`
      }
      record.messages.push(msg)
      record.status = RUN_STATUS.FAILED
      record.updatedAt = new Date().toISOString()
      records.save(record)
      emitEvent(runId, 'message', msg)
      emitEvent(runId, 'run-finished', { status: RUN_STATUS.FAILED })
      return { success: false, error: err.message }
    } finally {
      // 仅清理当前 run，避免误清理其他 run（互斥下通常等价，但语义更稳）
      if (active && active.runId === runId) clearActive()
    }
  })
  return { isActive: () => !!active, activityKind: () => active?.kind, cancel, waitForIdle }
}
