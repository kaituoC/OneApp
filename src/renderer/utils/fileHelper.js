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
