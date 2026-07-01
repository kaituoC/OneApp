const VERSION_RE = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/

export function parseVersion(version) {
  const match = String(version || '').trim().match(VERSION_RE)
  if (!match) return null
  return match.slice(1, 4).map(Number)
}

export function normalizeVersion(version) {
  const parts = parseVersion(version)
  if (!parts) return ''
  return parts.join('.')
}

export function compareVersions(left, right) {
  const leftParts = parseVersion(left)
  const rightParts = parseVersion(right)
  if (!leftParts || !rightParts) {
    throw new Error('版本号格式无效')
  }

  for (let i = 0; i < 3; i += 1) {
    if (leftParts[i] > rightParts[i]) return 1
    if (leftParts[i] < rightParts[i]) return -1
  }
  return 0
}

export function summarizeReleaseNotes(notes = '', maxLength = 240) {
  const clean = String(notes || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

  if (!clean) return '暂无更新说明。'
  if (clean.length <= maxLength) return clean
  return `${clean.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

export function createUpdateCheckResult({ currentVersion, release }) {
  const normalizedCurrent = normalizeVersion(currentVersion)
  if (!normalizedCurrent) {
    return { success: false, error: '当前版本号格式无效，无法检查更新。' }
  }

  if (!release || !release.tag_name || !release.html_url) {
    return { success: false, error: 'GitHub Release 数据缺少必要字段。' }
  }

  const latestVersion = normalizeVersion(release.tag_name)
  if (!latestVersion) {
    return { success: false, error: 'GitHub Release 版本号格式无效。' }
  }

  const updateAvailable = compareVersions(latestVersion, normalizedCurrent) > 0
  return {
    success: true,
    currentVersion: normalizedCurrent,
    latestVersion,
    updateAvailable,
    releaseName: release.name || release.tag_name,
    releaseUrl: release.html_url,
    publishedAt: release.published_at || '',
    notesSummary: summarizeReleaseNotes(release.body || '')
  }
}
