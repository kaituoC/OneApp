// Git 工作区安全检查：研讨开始前拍 `git status --short` 基线，每个阶段后比对。
// 纯比较逻辑（compareGitStatus / gitSafetyResult）可单测；执行 git 的部分是薄封装。

import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

/** 比较两次 status 快照，忽略首尾空白；不同即视为工作区已变化 */
export function compareGitStatus(baseline, current) {
  return String(baseline ?? '').trim() !== String(current ?? '').trim()
}

/**
 * 综合判断某阶段后的工作区状态（咨询式二次防线，调用方据此提示而非中断）。
 * - 非 Git：无法检测，给出说明。
 * - Git 未变化：ok。
 * - Git 变化：changed:true，仅提示；实时只读由 CLI 沙箱参数强制保证。
 */
export function gitSafetyResult({ isGit, baseline, current }) {
  if (!isGit) {
    return { ok: true, changed: false, warning: '所选目录不是 Git 仓库，无法检测研讨期间的工作区改动。' }
  }
  if (compareGitStatus(baseline, current)) {
    return { ok: false, changed: true, warning: '检测到工作区在研讨期间发生变化（仅提示，未中断；只读由 CLI 沙箱保证）。' }
  }
  return { ok: true, changed: false, warning: null }
}

/** 是否为 Git 仓库（兼容 .git 目录与 worktree/submodule 的 .git 文件） */
export function isGitRepo(repoDir) {
  try {
    return fs.existsSync(path.join(repoDir, '.git'))
  } catch {
    return false
  }
}

/** 读取 `git status --short`，失败返回 null */
export function readGitStatus(repoDir) {
  try {
    return execFileSync('git', ['status', '--short'], { cwd: repoDir, encoding: 'utf-8' })
  } catch {
    return null
  }
}

/** 读取当前分支名，失败返回 null */
export function readGitBranch(repoDir) {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repoDir, encoding: 'utf-8' }).trim()
  } catch {
    return null
  }
}
