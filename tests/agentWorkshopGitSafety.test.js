import { describe, it, expect } from 'vitest'
import { compareGitStatus, gitSafetyResult } from '../electron/agentWorkshop/gitSafety.js'

describe('compareGitStatus', () => {
  it('内容一致视为未变', () => {
    expect(compareGitStatus(' M a.js\n', ' M a.js\n')).toBe(false)
  })

  it('忽略首尾空白差异', () => {
    expect(compareGitStatus(' M a.js', ' M a.js\n')).toBe(false)
  })

  it('内容不同视为已变', () => {
    expect(compareGitStatus('', ' M a.js')).toBe(true)
  })
})

describe('gitSafetyResult', () => {
  it('非 Git：不检测，仅给出警告', () => {
    const r = gitSafetyResult({ isGit: false })
    expect(r.ok).toBe(true)
    expect(r.changed).toBe(false)
    expect(r.warning).toMatch(/Git/)
  })

  it('Git 未变化：通过', () => {
    const r = gitSafetyResult({ isGit: true, baseline: ' M a', current: ' M a' })
    expect(r.ok).toBe(true)
    expect(r.changed).toBe(false)
  })

  it('Git 发生变化：标记 changed 并附咨询式提示', () => {
    const r = gitSafetyResult({ isGit: true, baseline: '', current: ' M a' })
    expect(r.ok).toBe(false)
    expect(r.changed).toBe(true)
    expect(r.warning).toBeTruthy()
  })
})
