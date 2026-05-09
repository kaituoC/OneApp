export async function readFile(filePath) {
  const result = await window.electronAPI.readFile(filePath)
  if (!result.success) throw new Error(result.error)
  await addRecentFile(filePath)
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

// 最近打开文件管理
const MAX_RECENT_FILES = 50

export async function getRecentFiles() {
  try {
    const store = await window.electronAPI.getStore()
    if (!store || !store.recentFiles) return []
    return store.recentFiles
  } catch {
    return []
  }
}

export async function saveRecentFiles(recentFiles) {
  await window.electronAPI.setStore({ recentFiles })
}

export async function addRecentFile(filePath) {
  let recentFiles = await getRecentFiles()
  // 清理无效条目
  recentFiles = recentFiles.filter(f => f && f.path)
  // 移除已存在的同路径记录
  const filtered = recentFiles.filter(f => f.path !== filePath)
  // 新记录插到最前
  const updated = [{ path: filePath, timestamp: Date.now() }, ...filtered]
  // 最多保留 50 条
  if (updated.length > MAX_RECENT_FILES) {
    updated.length = MAX_RECENT_FILES
  }
  await saveRecentFiles(updated)
}

export async function removeRecentFile(filePath) {
  const recentFiles = await getRecentFiles()
  const updated = recentFiles.filter(f => f && f.path && f.path !== filePath)
  await saveRecentFiles(updated)
}
