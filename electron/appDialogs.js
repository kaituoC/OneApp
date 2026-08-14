import path from 'path'
import { createUpdateCheckResult } from '../src/renderer/utils/updateHelper.js'

export const LATEST_RELEASE_URL = 'https://api.github.com/repos/kaituoC/OneApp/releases/latest'
export const UPDATE_CHECK_TIMEOUT_MS = 10_000
export const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000

export function resolveMessageBoxIconPath({
  isDev = process.env.NODE_ENV === 'development',
  dirname,
  existsSync
}) {
  const candidates = isDev
    ? [path.join(dirname, '../../electron/assets/icon.png')]
    : [path.join(dirname, 'assets/icon.png')]

  return candidates.find(candidate => existsSync(candidate)) || ''
}

function getHeader(response, name) {
  if (typeof response?.headers?.get === 'function') return response.headers.get(name)
  return response?.headers?.[name] || response?.headers?.[name.toLowerCase()] || ''
}

function isRateLimited(response) {
  return response?.status === 403 && getHeader(response, 'x-ratelimit-remaining') === '0'
}

export function isUpdateCheckDue(lastCheckedAt, now = Date.now()) {
  const lastChecked = Number(lastCheckedAt)
  return !Number.isFinite(lastChecked)
    || lastChecked <= 0
    || lastChecked > now
    || now - lastChecked >= UPDATE_CHECK_INTERVAL_MS
}

export async function checkForUpdates({
  currentVersion,
  platform,
  arch,
  fetchImpl = globalThis.fetch,
  timeoutMs = UPDATE_CHECK_TIMEOUT_MS
}) {
  if (typeof fetchImpl !== 'function') {
    return { success: false, error: '当前运行环境不支持网络请求，无法检查更新。' }
  }

  const controller = typeof AbortController === 'function' ? new AbortController() : null
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null

  try {
    const response = await fetchImpl(LATEST_RELEASE_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'OneApp'
      },
      signal: controller?.signal
    })

    if (!response.ok) {
      return {
        success: false,
        error: isRateLimited(response)
          ? 'GitHub API 请求次数已达上限，请稍后再试。'
          : `GitHub Release 请求失败：${response.status} ${response.statusText || ''}`.trim()
      }
    }

    const release = await response.json()
    return createUpdateCheckResult({ currentVersion, platform, arch, release })
  } catch (error) {
    if (error?.name === 'AbortError') {
      return { success: false, error: '检查更新请求超时，请检查网络后重试。' }
    }
    return {
      success: false,
      error: `检查更新失败：${error.message || '网络请求异常'}`
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}
