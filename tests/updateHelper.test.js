import { describe, expect, it } from 'vitest'
import {
  compareVersions,
  createUpdateCheckResult,
  findReleaseAsset,
  isSafeGitHubUrl,
  summarizeReleaseNotes
} from '../src/renderer/utils/updateHelper.js'

describe('updateHelper version comparison', () => {
  it('按语义化版本数字顺序比较版本', () => {
    expect(compareVersions('1.10.0', '1.9.9')).toBe(1)
    expect(compareVersions('v1.14.0', '1.14.0')).toBe(0)
    expect(compareVersions('1.14.0', '1.15.0')).toBe(-1)
  })

  it('版本号无效时返回结构化错误', () => {
    const result = createUpdateCheckResult({
      currentVersion: 'dev-build',
      release: { tag_name: 'v1.15.0', html_url: 'https://example.com/release' }
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('当前版本号')
  })
})

describe('updateHelper release normalization', () => {
  it('识别存在新版本的 Release', () => {
    const result = createUpdateCheckResult({
      currentVersion: '1.14.0',
      release: {
        tag_name: 'v1.15.0',
        name: 'v1.15.0',
        html_url: 'https://github.com/kaituoC/OneApp/releases/tag/v1.15.0',
        published_at: '2026-07-01T12:00:00Z',
        body: '新增检查更新功能\n\n修复若干问题',
        assets: [{
          name: 'OneApp-1.15.0-mac-arm64.dmg',
          browser_download_url: 'https://github.com/kaituoC/OneApp/releases/download/v1.15.0/OneApp-1.15.0-mac-arm64.dmg'
        }]
      },
      platform: 'darwin',
      arch: 'arm64'
    })

    expect(result.success).toBe(true)
    expect(result.updateAvailable).toBe(true)
    expect(result.latestVersion).toBe('1.15.0')
    expect(result.releaseUrl).toContain('/v1.15.0')
    expect(result.notesSummary).toContain('新增检查更新功能')
    expect(result.assetName).toBe('OneApp-1.15.0-mac-arm64.dmg')
    expect(result.downloadUrl).toContain('.dmg')
  })

  it('识别当前已是最新版本', () => {
    const result = createUpdateCheckResult({
      currentVersion: '1.14.0',
      release: {
        tag_name: 'v1.14.0',
        html_url: 'https://github.com/kaituoC/OneApp/releases/tag/v1.14.0'
      }
    })

    expect(result.success).toBe(true)
    expect(result.updateAvailable).toBe(false)
    expect(result.latestVersion).toBe('1.14.0')
  })

  it('Release 缺少必要字段时返回错误', () => {
    const result = createUpdateCheckResult({
      currentVersion: '1.14.0',
      release: { name: 'v1.15.0' }
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Release')
  })

  it('拒绝 draft 和 prerelease', () => {
    const result = createUpdateCheckResult({
      currentVersion: '1.14.0',
      release: {
        tag_name: 'v1.15.0',
        html_url: 'https://github.com/kaituoC/OneApp/releases/tag/v1.15.0',
        prerelease: true
      }
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('正式版本')
  })
})

describe('updateHelper release asset selection', () => {
  const assets = [
    {
      name: 'OneApp-1.24.0-mac-arm64.dmg',
      browser_download_url: 'https://github.com/kaituoC/OneApp/releases/download/v1.24.0/OneApp-1.24.0-mac-arm64.dmg'
    },
    {
      name: 'OneApp-1.24.0-win-x64.exe',
      browser_download_url: 'https://github.com/kaituoC/OneApp/releases/download/v1.24.0/OneApp-1.24.0-win-x64.exe'
    },
    {
      name: 'OneApp-1.24.0-linux-x86_64.AppImage',
      browser_download_url: 'https://github.com/kaituoC/OneApp/releases/download/v1.24.0/OneApp-1.24.0-linux-x86_64.AppImage'
    }
  ]

  it('按平台和架构选择可安装附件', () => {
    expect(findReleaseAsset(assets, { platform: 'darwin', arch: 'arm64' })?.name).toContain('mac-arm64')
    expect(findReleaseAsset(assets, { platform: 'win32', arch: 'x64' })?.name).toContain('win-x64')
    expect(findReleaseAsset(assets, { platform: 'linux', arch: 'x64' })?.name).toContain('linux-x86_64')
  })

  it('不接受错误平台或非 GitHub HTTPS 下载地址', () => {
    expect(findReleaseAsset(assets, { platform: 'darwin', arch: 'x64' })).toBeNull()
    expect(findReleaseAsset([{
      name: 'OneApp-1.24.0-mac-arm64.dmg',
      browser_download_url: 'http://example.com/OneApp-1.24.0-mac-arm64.dmg'
    }], { platform: 'darwin', arch: 'arm64' })).toBeNull()
    expect(isSafeGitHubUrl('https://github.com/kaituoC/OneApp/releases')).toBe(true)
    expect(isSafeGitHubUrl('https://example.com/release')).toBe(false)
  })
})

describe('updateHelper release notes summary', () => {
  it('清理 Markdown 并截断过长说明', () => {
    const summary = summarizeReleaseNotes(
      '# v1.15.0\n\n- 新增真实检查更新\n- 统一系统弹窗\n\n'.repeat(20),
      80
    )

    expect(summary.length).toBeLessThanOrEqual(81)
    expect(summary).not.toContain('#')
    expect(summary).toMatch(/…$/)
  })
})
