// Agent 研讨室主进程 IPC：配置读写、检测、最近记录、启动/停止研讨、Markdown 导出，
// 以及通过 webContents 向渲染层推送 `agent-discussion:event` 事件流。
import { ipcMain, dialog, app } from 'electron'
import fs from 'fs'
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
  AGENTS,
  STORE_KEYS,
  RUN_STATUS,
  MESSAGE_TYPE
} from '../../src/renderer/utils/agentWorkshopHelper.js'

export function registerAgentWorkshopIpc({ store, getWindow }) {
  const records = createRecordStore(app.getPath('userData'))
  let active = null // { runId, abort, canceled }

  const emitEvent = (runId, type, payload) => {
    const win = getWindow()
    if (win && !win.isDestroyed()) win.webContents.send('agent-discussion:event', { runId, type, payload })
  }

  ipcMain.handle('agent-discussion:get-config', () => ({
    repoDir: store.get(STORE_KEYS.repoDir, ''),
    selectedAgents: store.get(STORE_KEYS.selectedAgents, []),
    moderator: store.get(STORE_KEYS.moderator, null),
    availability: store.get(STORE_KEYS.availability, null),
    costNoticeAccepted: store.get(STORE_KEYS.costNoticeAccepted, false)
  }))

  ipcMain.handle('agent-discussion:set-config', (e, partial) => {
    const map = {
      repoDir: STORE_KEYS.repoDir,
      selectedAgents: STORE_KEYS.selectedAgents,
      moderator: STORE_KEYS.moderator,
      costNoticeAccepted: STORE_KEYS.costNoticeAccepted
    }
    for (const [k, v] of Object.entries(partial || {})) {
      if (map[k]) store.set(map[k], v)
    }
    return { success: true }
  })

  ipcMain.handle('agent-discussion:check-agents', async () => {
    const availability = await detectAll()
    store.set(STORE_KEYS.availability, availability)
    return availability
  })

  ipcMain.handle('agent-discussion:get-last-run', () => records.loadLatest())

  // 探测当前所选目录是否 Git 仓库（供 UI 实时提示，不依赖历史记录）
  ipcMain.handle('agent-discussion:check-repo', (e, dir) => ({ isGit: isGitRepo(dir) }))

  ipcMain.handle('agent-discussion:stop', () => {
    if (active) {
      active.canceled = true
      if (active.abort) active.abort.abort()
    }
    return { success: true }
  })

  ipcMain.handle('agent-discussion:export-markdown', async (e, record) => {
    const md = exportMarkdown(record)
    const win = getWindow()
    const res = await dialog.showSaveDialog(win, {
      defaultPath: 'agent-workshop.md',
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (res.canceled || !res.filePath) return { success: false, canceled: true }
    try {
      fs.writeFileSync(res.filePath, md, 'utf-8')
      return { success: true, filePath: res.filePath }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('agent-discussion:start', async (e, params) => {
    // 运行互斥：已有研讨进行中直接拒绝，避免覆盖 active 导致旧 run 失控
    if (active) return { success: false, error: '已有研讨进行中，请先停止当前研讨。' }

    const { repoDir, selectedAgents, moderator, idea } = params || {}
    const availability = store.get(STORE_KEYS.availability, {}) || {}

    // 主进程参数校验：不信任 renderer 传来的参数
    let repoDirIsDir = false
    try { repoDirIsDir = !!repoDir && fs.statSync(repoDir).isDirectory() } catch { repoDirIsDir = false }
    const valid = validateStartParams({ repoDir, idea, selectedAgents, moderator, availability, repoDirIsDir })
    if (!valid.ok) return { success: false, error: valid.error }

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
    active = { runId, abort, canceled: false }
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
    records.save(record)
    emitEvent(runId, 'run-started', { record })

    const resolvedPath = (id) => availability[id]?.resolvedPath || id

    const invoke = async ({ agentId, prompt }) => {
      const args = buildAgentArgs(agentId, { repoDir })
      return runAgent({ command: resolvedPath(agentId), args, cwd: repoDir, prompt, signal: abort.signal })
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

    try {
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
      if (active && active.runId === runId) active = null
    }
  })
}
