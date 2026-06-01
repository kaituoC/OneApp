export async function readFile(filePath) {
  const result = await window.electronAPI.readFile(filePath)
  if (!result.success) throw new Error(result.error)
  return result.content
}

export async function writeFile(filePath, content) {
  const result = await window.electronAPI.writeFile(filePath, content)
  if (!result.success) throw new Error(result.error)
}

// 读取目录直接子项（懒加载目录树用）：返回 [{ name, path, isDirectory }]
export async function readDir(dirPath) {
  const result = await window.electronAPI.readDir(dirPath)
  if (!result.success) throw new Error(result.error)
  return result.items
}

// 默认隐藏的重目录黑名单（与 dotfiles 一起受「显示隐藏项」开关控制）
export const HIDDEN_DIR_BLACKLIST = ['node_modules']

// 判断某条目在「未开启显示隐藏项」时是否应隐藏（纯函数，便于测试）
export function isHiddenEntry(item) {
  if (!item || !item.name) return false
  if (item.name.startsWith('.')) return true
  if (item.isDirectory && HIDDEN_DIR_BLACKLIST.includes(item.name)) return true
  return false
}

// 过滤目录树条目：文件夹始终保留，文件按可编辑扩展名过滤；隐藏项按开关控制（纯函数）
export function filterTreeItems(items, { editableExtensions = [], showHidden = false } = {}) {
  if (!Array.isArray(items)) return []
  const exts = editableExtensions.map(e => e.toLowerCase())
  return items.filter(item => {
    if (!showHidden && isHiddenEntry(item)) return false
    if (item.isDirectory) return true
    const dot = item.name.lastIndexOf('.')
    const ext = dot >= 0 ? item.name.slice(dot + 1).toLowerCase() : ''
    return exts.includes(ext)
  })
}

export async function deleteFile(filePath) {
  const result = await window.electronAPI.deleteFile(filePath)
  if (!result.success) throw new Error(result.error)
}

export async function openFile(defaultDirectory) {
  const result = await window.electronAPI.showOpenDialog({
    defaultPath: defaultDirectory || undefined,
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
}

export async function saveFile(content, defaultPath, fileType = { name: 'Markdown', extensions: ['md'] }, defaultDirectory) {
  const fullPath = defaultDirectory ? `${defaultDirectory}/${defaultPath}` : defaultPath
  const result = await window.electronAPI.showSaveDialog({
    defaultPath: fullPath,
    filters: [fileType]
  })
  if (result.canceled || !result.filePath) return null
  await window.electronAPI.writeFile(result.filePath, content)
  return result.filePath
}

export async function chooseDirectory() {
  const result = await window.electronAPI.showDirectoryDialog()
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
}

// 内部通用函数：按类型添加最近文件
async function addRecentFileByType(storeKey, filePath) {
  let recentFiles = await window.electronAPI.getStore().then(s => s[storeKey] || [])
  // 清理无效条目
  recentFiles = recentFiles.filter(f => f && f.path)
  // 移除已存在的同路径记录
  const filtered = recentFiles.filter(f => f.path !== filePath)
  // 新记录插到最前
  const updated = [{ path: filePath, timestamp: Date.now() }, ...filtered]
  // 最多保留 50 条
  if (updated.length > 50) updated.length = 50
  await window.electronAPI.setStore({ [storeKey]: updated })
}

async function getRecentFilesByType(storeKey) {
  try {
    const store = await window.electronAPI.getStore()
    if (!store || !store[storeKey]) return []
    return store[storeKey]
  } catch {
    return []
  }
}

export async function addMdRecentFile(filePath) {
  await addRecentFileByType('recentMdFiles', filePath)
}

export async function getMdRecentFiles() {
  return getRecentFilesByType('recentMdFiles')
}

export async function addHtmlRecentFile(filePath) {
  await addRecentFileByType('recentHtmlFiles', filePath)
}

export async function getHtmlRecentFiles() {
  return getRecentFilesByType('recentHtmlFiles')
}

export async function removeMdRecentFile(filePath) {
  const recentFiles = await getMdRecentFiles()
  const updated = recentFiles.filter(f => f && f.path && f.path !== filePath)
  await window.electronAPI.setStore({ recentMdFiles: updated })
}

export async function removeHtmlRecentFile(filePath) {
  const recentFiles = await getHtmlRecentFiles()
  const updated = recentFiles.filter(f => f && f.path && f.path !== filePath)
  await window.electronAPI.setStore({ recentHtmlFiles: updated })
}

// 最近打开的文件夹（Markdown / HTML 共享，存于 recentFolders）
export async function addRecentFolder(folderPath) {
  await addRecentFileByType('recentFolders', folderPath)
}

export async function getRecentFolders() {
  return getRecentFilesByType('recentFolders')
}
