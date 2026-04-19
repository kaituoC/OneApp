const { contextBridge, ipcRenderer, shell } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  listFiles: (directory) => ipcRenderer.invoke('list-files', directory),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showDirectoryDialog: () => ipcRenderer.invoke('show-directory-dialog'),
  getStore: () => ipcRenderer.invoke('get-store'),
  setStore: (data) => ipcRenderer.invoke('set-store', data),
  getHomeDir: () => process.env.HOME || process.env.USERPROFILE,
  exportPDF: (htmlContent, defaultPath) => ipcRenderer.invoke('export-pdf', htmlContent, defaultPath),
  openExternal: (url) => shell.openExternal(url)
})
