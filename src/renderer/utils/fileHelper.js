export async function readFile(filePath) {
  const result = await window.electronAPI.readFile(filePath)
  if (!result.success) throw new Error(result.error)
  return result.content
}

export async function writeFile(filePath, content) {
  const result = await window.electronAPI.writeFile(filePath, content)
  if (!result.success) throw new Error(result.error)
}

export async function listFiles(directory) {
  const result = await window.electronAPI.listFiles(directory)
  if (!result.success) throw new Error(result.error)
  return result.files
}

export async function listHtmlFiles(directory) {
  const result = await window.electronAPI.listHtmlFiles(directory)
  if (!result.success) throw new Error(result.error)
  return result.files
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
