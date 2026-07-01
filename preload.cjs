const { contextBridge, ipcRenderer, shell } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  readDir: (dirPath) => ipcRenderer.invoke('read-dir', dirPath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showDirectoryDialog: () => ipcRenderer.invoke('show-directory-dialog'),
  getStore: () => ipcRenderer.invoke('get-store'),
  setStore: (data) => ipcRenderer.invoke('set-store', data),
  getHomeDir: () => process.env.HOME || process.env.USERPROFILE,
  exportPDF: (htmlContent, defaultPath) => ipcRenderer.invoke('export-pdf', htmlContent, defaultPath),
  openExternal: (url) => shell.openExternal(url),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  checkForUpdates: (currentVersion) => ipcRenderer.invoke('check-for-updates', currentVersion),
  toggleDevTools: () => ipcRenderer.invoke('toggle-devtools'),

  // Agent 研讨室：窄接口，不暴露通用命令执行
  agentWorkshop: {
    getConfig: () => ipcRenderer.invoke('agent-discussion:get-config'),
    setConfig: (partial) => ipcRenderer.invoke('agent-discussion:set-config', partial),
    checkAgents: () => ipcRenderer.invoke('agent-discussion:check-agents'),
    getLastRun: () => ipcRenderer.invoke('agent-discussion:get-last-run'),
    checkRepo: (dir) => ipcRenderer.invoke('agent-discussion:check-repo', dir),
    start: (params) => ipcRenderer.invoke('agent-discussion:start', params),
    stop: () => ipcRenderer.invoke('agent-discussion:stop'),
    exportMarkdown: (record) => ipcRenderer.invoke('agent-discussion:export-markdown', record),
    // 仅订阅单一事件 channel，返回取消订阅函数；不暴露通用 on(channel, ...)
    onEvent: (callback) => {
      const listener = (_e, payload) => callback(payload)
      ipcRenderer.on('agent-discussion:event', listener)
      return () => ipcRenderer.removeListener('agent-discussion:event', listener)
    }
  }
})
