// Codex / ClaudeCode 检测：先用登录 shell 解析可执行路径（Dock 启动可能不继承 PATH），
// 再用解析到的路径直接执行版本与登录态命令（避免 shell 输出污染 JSON）。
import { execFile } from 'child_process'
import { promisify } from 'util'

const pexec = promisify(execFile)
const LOGIN_SHELL = process.env.SHELL || '/bin/zsh'

// 用登录 + 交互式 shell 执行命令：-i 才会 source ~/.zshrc（nvm 等常把 PATH 写在这里），
// 否则 Dock 启动的 Electron 解析不到 nvm/.local 下的 CLI。
async function loginShell(cmd) {
  const { stdout } = await pexec(LOGIN_SHELL, ['-lic', cmd], { timeout: 15000 })
  return stdout
}

async function resolvePath(bin) {
  try {
    const out = await loginShell(`command -v ${bin}`)
    // 交互式 rc 可能向 stdout 混入噪声，取最后一个形如绝对路径的行
    const line = out.split('\n').map((s) => s.trim()).reverse().find((s) => s.startsWith('/'))
    return line || ''
  } catch {
    return ''
  }
}

function baseEntry() {
  return { installed: false, loggedIn: false, resolvedPath: '', version: '', checkedAt: new Date().toISOString(), error: null }
}

export async function detectCodex() {
  const entry = baseEntry()
  const p = await resolvePath('codex')
  if (!p) { entry.error = '未找到 codex 可执行文件'; return entry }
  entry.installed = true
  entry.resolvedPath = p
  try { entry.version = (await pexec(p, ['--version'], { timeout: 15000 })).stdout.trim() } catch { /* 版本可选 */ }
  // codex login status：退出码 0 视为已登录
  try { await pexec(p, ['login', 'status'], { timeout: 15000 }); entry.loggedIn = true } catch { entry.loggedIn = false }
  return entry
}

export async function detectClaude() {
  const entry = baseEntry()
  const p = await resolvePath('claude')
  if (!p) { entry.error = '未找到 claude 可执行文件'; return entry }
  entry.installed = true
  entry.resolvedPath = p
  try { entry.version = (await pexec(p, ['--version'], { timeout: 15000 })).stdout.trim() } catch { /* 版本可选 */ }
  // claude auth status：解析 JSON 的 loggedIn 字段
  try {
    const { stdout } = await pexec(p, ['auth', 'status'], { timeout: 15000 })
    entry.loggedIn = !!JSON.parse(stdout).loggedIn
  } catch { entry.loggedIn = false }
  return entry
}

export async function detectAll() {
  const [codex, claude] = await Promise.all([detectCodex(), detectClaude()])
  return { codex, claude }
}
