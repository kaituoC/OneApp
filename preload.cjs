const { contextBridge, ipcRenderer } = require('electron')

function subscribe(channel, callback) {
  const listener = (_event, data) => callback(data)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('electronAPI', {
  commands: {
    onCommand: callback => subscribe('app:command', callback),
    onCheckClose: callback => subscribe('app:check-close', callback),
    replyClose: data => ipcRenderer.invoke('app:close-reply', data),
    onCloseState: callback => subscribe('app:close-state', callback),
    cancelClose: () => ipcRenderer.invoke('app:cancel-close'),
    setEditorActive: active => ipcRenderer.invoke('app:editor-active', active),
    onTheme: callback => subscribe('app:theme', callback)
  },
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  readDir: (dirPath) => ipcRenderer.invoke('read-dir', dirPath),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showDirectoryDialog: () => ipcRenderer.invoke('show-directory-dialog'),
  authorizeRecent: path => ipcRenderer.invoke('authorize-recent', path),
  getStore: () => ipcRenderer.invoke('get-store'),
  setStore: (data) => ipcRenderer.invoke('set-store', data),
  getHomeDir: () => ipcRenderer.invoke('get-home-dir'),
  exportPDF: (htmlContent, defaultPath) => ipcRenderer.invoke('export-pdf', htmlContent, defaultPath),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  updates: {
    check: () => ipcRenderer.invoke('check-for-updates'),
    onAvailable: (callback) => {
      const listener = (_event, result) => callback(result)
      ipcRenderer.on('app-update:available', listener)
      return () => ipcRenderer.removeListener('app-update:available', listener)
    }
  },
  toggleDevTools: () => ipcRenderer.invoke('toggle-devtools'),

  // Agent 研讨室：窄接口，不暴露通用命令执行
  agentWorkshop: {
    getConfig: () => ipcRenderer.invoke('agent-discussion:get-config'),
    setConfig: (partial) => ipcRenderer.invoke('agent-discussion:set-config', partial),
    checkAgents: () => ipcRenderer.invoke('agent-discussion:check-agents'),
    getLastRun: () => ipcRenderer.invoke('agent-discussion:get-last-run'),
    checkRepo: (dir) => ipcRenderer.invoke('agent-discussion:check-repo', dir),
    testAgentConnection: (params) => ipcRenderer.invoke('agent-discussion:test-agent-connection', params),
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
