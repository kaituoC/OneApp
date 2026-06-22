// 单次 agent 调用执行器：spawn 子进程（shell:false，独立进程组），
// 把 prompt 写入 stdin，收集 stdout/stderr，支持超时与取消（杀整个进程组），输出超限截断。
import { spawn } from 'child_process'
import { DEFAULT_TIMEOUT_MS, STORE_LIMIT_BYTES } from '../../src/renderer/utils/agentWorkshopHelper.js'

function truncateOutput(s) {
  if (s.length <= STORE_LIMIT_BYTES) return { text: s, truncated: false }
  return { text: s.slice(0, STORE_LIMIT_BYTES) + '\n\n…（输出已截断 / truncated）', truncated: true }
}

/**
 * @returns Promise<{ ok, text?, error?, truncated?, timeout?, canceled? }>
 */
export function runAgent({ command, args, cwd, prompt, timeoutMs = DEFAULT_TIMEOUT_MS, signal }) {
  return new Promise((resolve) => {
    let child
    try {
      child = spawn(command, args, { cwd, shell: false, detached: true })
    } catch (e) {
      resolve({ ok: false, error: `无法启动进程：${e.message}` })
      return
    }

    let stdout = ''
    let stderr = ''
    let settled = false
    let timedOut = false
    let canceled = false
    let onAbort = null
    let killTimer = null

    const killTree = (sig) => {
      try { process.kill(-child.pid, sig) } catch { try { child.kill(sig) } catch { /* noop */ } }
    }
    const escalateKill = () => {
      killTree('SIGTERM')
      killTimer = setTimeout(() => killTree('SIGKILL'), 2000)
    }
    const finalize = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (killTimer) clearTimeout(killTimer)
      if (onAbort && signal) signal.removeEventListener('abort', onAbort)
      resolve(result)
    }

    const timer = setTimeout(() => {
      timedOut = true
      escalateKill()
    }, timeoutMs)

    if (signal) {
      onAbort = () => {
        canceled = true
        escalateKill()
      }
      if (signal.aborted) onAbort()
      else signal.addEventListener('abort', onAbort)
    }

    child.stdout.on('data', (d) => { if (stdout.length < STORE_LIMIT_BYTES * 2) stdout += d.toString() })
    child.stderr.on('data', (d) => { if (stderr.length < 64 * 1024) stderr += d.toString() })
    child.on('error', (e) => finalize({ ok: false, error: e.message }))
    child.on('close', (code) => {
      if (canceled) return finalize({ ok: false, error: '已取消', canceled: true })
      if (timedOut) return finalize({ ok: false, error: `执行超时（${Math.round(timeoutMs / 1000)}s）`, timeout: true })
      const { text, truncated } = truncateOutput(stdout)
      if (code === 0) return finalize({ ok: true, text, truncated })
      return finalize({ ok: false, error: stderr.trim() || `进程退出码 ${code}`, text, truncated })
    })

    try {
      child.stdin.write(prompt || '')
      child.stdin.end()
    } catch { /* stdin 可能已关闭，忽略 */ }
  })
}
