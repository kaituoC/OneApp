import path from 'path'
import { createUpdateCheckResult } from '../src/renderer/utils/updateHelper.js'

export const LATEST_RELEASE_URL = 'https://api.github.com/repos/kaituoC/OneApp/releases/latest'

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

export async function checkForUpdates({
  currentVersion,
  fetchImpl = globalThis.fetch
}) {
  if (typeof fetchImpl !== 'function') {
    return { success: false, error: '当前运行环境不支持网络请求，无法检查更新。' }
  }

  try {
    const response = await fetchImpl(LATEST_RELEASE_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'OneApp'
      }
    })

    if (!response.ok) {
      return {
        success: false,
        error: `GitHub Release 请求失败：${response.status} ${response.statusText || ''}`.trim()
      }
    }

    const release = await response.json()
    return createUpdateCheckResult({ currentVersion, release })
  } catch (error) {
    return {
      success: false,
      error: `检查更新失败：${error.message || '网络请求异常'}`
    }
  }
}
