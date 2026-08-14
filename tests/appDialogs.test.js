import { describe, expect, it, vi } from 'vitest'
import {
  checkForUpdates,
  isUpdateCheckDue,
  resolveMessageBoxIconPath
} from '../electron/appDialogs.js'

describe('appDialogs icon path', () => {
  it('开发环境优先使用 electron/assets/icon.png', () => {
    const iconPath = resolveMessageBoxIconPath({
      isDev: true,
      dirname: '/repo/out/main',
      existsSync: (candidate) => candidate.endsWith('/electron/assets/icon.png')
    })

    expect(iconPath).toBe('/repo/electron/assets/icon.png')
  })

  it('生产环境使用打包后的 assets/icon.png', () => {
    const iconPath = resolveMessageBoxIconPath({
      isDev: false,
      dirname: '/repo/out/main',
      existsSync: (candidate) => candidate.endsWith('/assets/icon.png')
    })

    expect(iconPath).toBe('/repo/out/main/assets/icon.png')
  })

  it('图标不存在时返回空值以安全降级', () => {
    const iconPath = resolveMessageBoxIconPath({
      isDev: true,
      dirname: '/repo/out/main',
      existsSync: () => false
    })

    expect(iconPath).toBe('')
  })
})

describe('appDialogs update check', () => {
  it('请求 GitHub latest Release 并返回结构化结果', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        tag_name: 'v1.15.0',
        html_url: 'https://github.com/kaituoC/OneApp/releases/tag/v1.15.0',
        body: '更新说明'
      })
    }))

    const result = await checkForUpdates({ currentVersion: '1.14.0', fetchImpl })

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.github.com/repos/kaituoC/OneApp/releases/latest',
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': 'OneApp' })
      })
    )
    expect(result.success).toBe(true)
    expect(result.updateAvailable).toBe(true)
    expect(result.latestVersion).toBe('1.15.0')
  })

  it('GitHub 请求失败时返回清晰错误', async () => {
    const result = await checkForUpdates({
      currentVersion: '1.14.0',
      fetchImpl: async () => ({ ok: false, status: 403, statusText: 'rate limit' })
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('GitHub')
    expect(result.error).toContain('403')
  })

  it('GitHub 限流时返回可行动的提示', async () => {
    const result = await checkForUpdates({
      currentVersion: '1.14.0',
      fetchImpl: async () => ({
        ok: false,
        status: 403,
        headers: { 'x-ratelimit-remaining': '0' }
      })
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('上限')
  })

  it('请求超时时返回明确错误', async () => {
    const result = await checkForUpdates({
      currentVersion: '1.14.0',
      fetchImpl: async () => {
        const error = new Error('aborted')
        error.name = 'AbortError'
        throw error
      }
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('超时')
  })
})

describe('appDialogs launch update schedule', () => {
  it('仅在从未检查或间隔至少一天时到期', () => {
    const now = 2_000_000_000
    expect(isUpdateCheckDue(0, now)).toBe(true)
    expect(isUpdateCheckDue(now - 24 * 60 * 60 * 1000, now)).toBe(true)
    expect(isUpdateCheckDue(now - 60 * 60 * 1000, now)).toBe(false)
    expect(isUpdateCheckDue(now + 1, now)).toBe(true)
  })
})
