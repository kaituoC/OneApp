import { describe, expect, it, vi } from 'vitest'
import {
  checkForUpdates,
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
})
