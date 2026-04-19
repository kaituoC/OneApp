import { app, BrowserWindow, ipcMain, dialog, globalShortcut, nativeImage } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import Store from 'electron-store'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 设置应用名称（开发模式下显示 OneApp 而不是 Electron）
app.setName('OneApp')

const store = new Store({
  defaults: {
    workDir: '',
    theme: 'dark',
    fontSize: 14,
    recentFiles: []
  }
})

let mainWindow

function createWindow() {
  // 开发模式: __dirname = out/main/, assets 在 electron/assets/
  // 生产模式: __dirname = resources/app.asar/electron/, assets 在同目录
  const isDev = process.env.NODE_ENV === 'development'
  const iconPath = isDev
    ? path.join(__dirname, '../../electron/assets/icon.png')
    : path.join(__dirname, 'assets/icon.png')

  // Mac Dock 图标
  if (process.platform === 'darwin') {
    const dockIconPath = isDev
      ? path.join(__dirname, '../../electron/assets/icon.png')
      : path.join(__dirname, 'assets/icon.png')
    if (fs.existsSync(dockIconPath)) {
      app.dock.setIcon(nativeImage.createFromPath(dockIconPath))
    }
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.mjs'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// 文件操作 IPC
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return { success: true, content }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('list-files', async (event, directory) => {
  try {
    const files = fs.readdirSync(directory).filter(f => f.endsWith('.md'))
    return { success: true, files }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    fs.unlinkSync(filePath)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options)
  return result
})

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options)
  return result
})

ipcMain.handle('show-directory-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  return result
})

// Store IPC
ipcMain.handle('get-store', () => store.store)
ipcMain.handle('set-store', (event, data) => {
  Object.entries(data).forEach(([key, value]) => {
    store.set(key, value)
  })
})

// PDF 导出
ipcMain.handle('export-pdf', async (event, htmlContent, defaultPath) => {
  try {
    // 选择保存路径
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })
    if (result.canceled || !result.filePath) return { success: false, canceled: true }

    // 创建临时窗口渲染 HTML
    const pdfWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

    await new Promise(resolve => pdfWindow.webContents.once('did-finish-load', resolve))

    // 生成 PDF
    const pdfData = await pdfWindow.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true
    })

    // 写入文件
    fs.writeFileSync(result.filePath, pdfData)
    pdfWindow.close()

    return { success: true, filePath: result.filePath }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

app.whenReady().then(createWindow)

// 注册 F12 快捷键打开/关闭 DevTools
app.whenReady().then(() => {
  globalShortcut.register('F12', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools()
      } else {
        win.webContents.openDevTools()
      }
    }
  })
})

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
