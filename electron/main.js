import { app, BrowserWindow, ipcMain, dialog, nativeImage, Menu, nativeTheme, screen, shell, clipboard } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import Store from 'electron-store'
import { isTrustedEvent, validPath, validText, validDialogOptions, validateSettingsPatch, normalizeSettings, httpsURL, restoreBounds, rendererFileURL } from './workbenchPolicy.js'
import { createFileAccess } from './fileAccess.js'
import os from 'node:os'
import { createCloseGuard } from './closeGuard.js'
import { registerAgentWorkshopIpc } from './agentWorkshop/ipc.js'
import { checkForUpdates, isUpdateCheckDue, resolveMessageBoxIconPath } from './appDialogs.js'
import { createClipboardWriter } from './clipboard.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 设置应用名称（开发模式下显示 OneApp 而不是 Electron）
app.setName('OneApp')
// 本地回归可使用独立配置目录；不影响打包应用。
if (!app.isPackaged && process.env.ONEAPP_TEST_USER_DATA) app.setPath('userData', process.env.ONEAPP_TEST_USER_DATA)

const store = new Store({
  defaults: {
    workDir: '',
    theme: 'dark',
    fontSize: 14,
    recentFiles: [],
    updateCheckOnLaunch: false,
    lastUpdateCheckAt: 0
  }
})

const fileAccess = createFileAccess()
const clipboardWriter = createClipboardWriter({ clipboard, nativeImage })
for (const key of ['workDir','agentWorkshop.repoDir']) {
  try { if (store.get(key)) fileAccess.grantDirectory(store.get(key)) } catch { /* 不存在的旧目录交给用户重新选择 */ }
}

let mainWindow, workshop, closeGuard
let allowQuit = false, allowClose = false
let editorMenuItems = [], requestCounter = 0, activeDialogs = 0
async function withDialog(operation) { activeDialogs++; try { return await operation() } finally { activeDialogs-- } }
const closeReplies = new Map()
const rendererPath = path.join(__dirname, '../renderer/index.html')
const pageURL = process.env.ELECTRON_RENDERER_URL || rendererFileURL(rendererPath)

function handle(channel, callback, validate = () => true) {
  ipcMain.handle(channel, (event, ...args) => {
    if (!isTrustedEvent(event, mainWindow, pageURL) || !validate(...args)) throw new Error('请求来源或参数无效')
    return callback(event, ...args)
  })
}
function secureContents(contents) {
  contents.on('will-navigate', event => event.preventDefault())
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
  contents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
}
function sendCommand(id) { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('app:command', id) }
function createMenu() {
  const command = (label, id, accelerator) => ({ label, id, accelerator, click: () => sendCommand(id) })
  const mac = process.platform === 'darwin'
  const template = [
    ...(mac ? [{ label: 'OneApp', submenu: [{ role: 'about' }, command('设置…','settings','Command+,'), { type:'separator' }, { role:'hide' }, { role:'hideOthers' }, { role:'unhide' }, { type:'separator' }, { role:'quit' }] }] : []),
    { label:'文件', submenu:[command('新建','new','CmdOrCtrl+N'),command('打开…','open','CmdOrCtrl+O'),command('保存','save','CmdOrCtrl+S'),command('另存为…','save-as','CmdOrCtrl+Shift+S'),{type:'separator'},{role:'close'},...(!mac ? [{role:'quit'}] : [])] },
    { label:'编辑', submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}] },
    { label:'视图', submenu:[command('搜索工具…','search','CmdOrCtrl+K'),...(!mac ? [command('设置…','settings')] : []),{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'},...(!app.isPackaged ? [{type:'separator'},{role:'reload'},{role:'toggleDevTools'}] : [])] },
    { role:'windowMenu', label:'窗口', submenu:[{role:'minimize'},{role:'zoom'},...(mac ? [{type:'separator'},{role:'front'}] : [])] }
  ]
  const menu = Menu.buildFromTemplate(template); Menu.setApplicationMenu(menu)
  editorMenuItems = ['save','save-as'].map(id => menu.getMenuItemById(id))
}
function requestDraftCheck(token) {
  return new Promise((resolve, reject) => {
    const id = ++requestCounter
    let silentMs = 0
    const timer = setInterval(() => {
      if (activeDialogs) { silentMs = 0; return }
      silentMs += 1000
      if (silentMs >= 60000) { clearInterval(timer); closeReplies.delete(id); reject(new Error('工作台未响应，窗口已保留。请重试关闭；强退不能保护草稿。')) }
    }, 1000)
    closeReplies.set(id, approved => { clearInterval(timer); resolve(approved) })
    mainWindow.webContents.send('app:check-close', { id, token })
  })
}
async function stopActivity(isCanceled, getIntent) {
  if (!workshop?.isActive()) return true
  const kind = workshop.activityKind() === 'connection' ? '连接测试' : '研讨'
  const {response} = await dialog.showMessageBox(mainWindow, normalizeMessageBoxOptions({type:'warning',message:`${kind}正在进行`,detail:'停止不会撤销已发生的调用。继续运行可取消后最小化或隐藏窗口。',buttons:[getIntent() === 'quit' ? '停止并退出' : '停止并关闭','取消'],defaultId:1,cancelId:1}))
  if (response !== 0 || isCanceled()) return false
  mainWindow.webContents.send('app:close-state', 'stopping')
  workshop.cancel()
  let timer
  try {
    await Promise.race([workshop.waitForIdle(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('停止尚未完成，窗口已保留。可等待后重试；取消关闭不会恢复已停止的调用。')), 15000) })])
    return !isCanceled()
  } finally { clearTimeout(timer) }
}
function initializeCloseGuard() {
  closeGuard = createCloseGuard({
    checkDrafts:requestDraftCheck, stopActivity,
    onState:state => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('app:close-state', state) },
    reportError:error => dialog.showMessageBox(mainWindow, normalizeMessageBoxOptions({type:'error',message:'未关闭工作台',detail:error.message,buttons:['保留窗口']})),
    finish:intent => { if (intent === 'quit') { allowQuit = true; allowClose = true; app.quit() } else { allowClose = true; mainWindow.close() } }
  })
}

function checkForAppUpdates() {
  return checkForUpdates({
    currentVersion: app.getVersion(),
    platform: process.platform,
    arch: process.arch
  })
}

function scheduleLaunchUpdateCheck(window) {
  if (!store.get('updateCheckOnLaunch') || !isUpdateCheckDue(store.get('lastUpdateCheckAt'))) return

  window.webContents.once('did-finish-load', () => {
    setTimeout(async () => {
      if (window.isDestroyed()) return
      const result = await checkForAppUpdates()
      if (!result.success) return

      store.set('lastUpdateCheckAt', Date.now())
      if (result.updateAvailable && !window.isDestroyed()) {
        window.webContents.send('app-update:available', result)
      }
    }, 800)
  })
}

function getMessageBoxIcon() {
  const iconPath = resolveMessageBoxIconPath({
    dirname: __dirname,
    existsSync: fs.existsSync
  })
  return iconPath ? nativeImage.createFromPath(iconPath) : undefined
}

function normalizeMessageBoxOptions(options = {}) {
  const dialogOptions = {
    type: options.type || 'info',
    title: options.title || 'OneApp',
    message: options.message || '',
    detail: options.detail || '',
    buttons: Array.isArray(options.buttons) && options.buttons.length > 0 ? options.buttons : ['确定'],
    defaultId: Number.isInteger(options.defaultId) ? options.defaultId : 0,
    cancelId: Number.isInteger(options.cancelId) ? options.cancelId : undefined,
    noLink: options.noLink !== false
  }

  if (typeof options.checkboxLabel === 'string' && options.checkboxLabel) {
    dialogOptions.checkboxLabel = options.checkboxLabel
    dialogOptions.checkboxChecked = Boolean(options.checkboxChecked)
  }

  const icon = getMessageBoxIcon()
  if (icon && !icon.isEmpty()) {
    dialogOptions.icon = icon
  }

  return dialogOptions
}

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
    ...restoreBounds(store.get('windowBounds'), screen.getAllDisplays().map(d => d.workArea)),
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

  allowClose = false
  secureContents(mainWindow.webContents)
  if (store.get('windowMaximized') === true) mainWindow.maximize()
  const saveBounds = () => {
    if (!mainWindow.isDestroyed() && !mainWindow.isFullScreen()) {
      store.set('windowBounds', mainWindow.getNormalBounds())
      store.set('windowMaximized', mainWindow.isMaximized())
    }
  }
  mainWindow.on('resize', saveBounds); mainWindow.on('move', saveBounds)
  mainWindow.on('close', event => { if (!allowClose) { event.preventDefault(); closeGuard?.request('close') } })
  mainWindow.on('closed', () => { mainWindow = null })
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173')
    if (process.env.ONEAPP_OPEN_DEVTOOLS === '1') mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  scheduleLaunchUpdateCheck(mainWindow)
}

// 固定的只写剪贴板能力，复用工作台 sender/main frame/URL 校验。
handle('clipboard-write-text', (_event, text) => clipboardWriter.writeText(text))
handle('clipboard-write-png', (_event, dataUrl) => clipboardWriter.writePng(dataUrl))

// 文件操作 IPC
handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(fileAccess.requireAccess(filePath), 'utf-8')
    return { success: true, content }
  } catch (error) {
    return { success: false, error: error.message }
  }
}, validPath)

handle('write-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(fileAccess.requireAccess(filePath, {write:true}), content, 'utf-8')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}, (p, c) => validPath(p) && validText(c))

// 读取目录直接子项（懒加载目录树用）：返回 [{ name, path, isDirectory }]
// 排序：文件夹优先，组内按名称升序。过滤交给渲染层，主进程保持通用。
handle('read-dir', async (event, dirPath) => {
  try {
    const entries = await fs.promises.readdir(fileAccess.requireAccess(dirPath,{directory:true}), { withFileTypes: true })
    const items = entries.map(entry => ({
      name: entry.name,
      path: path.join(dirPath, entry.name),
      isDirectory: entry.isDirectory()
    }))
    items.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    return { success: true, items }
  } catch (error) {
    return { success: false, error: error.message }
  }
}, validPath)

handle('show-open-dialog', async (event, options) => {
  const result = await withDialog(() => dialog.showOpenDialog(mainWindow, options))
  if (!result.canceled) result.filePaths = result.filePaths.map(target => fs.statSync(target).isDirectory() ? fileAccess.grantDirectory(target) : fileAccess.grantFile(target))
  return result
}, validDialogOptions)

handle('show-save-dialog', async (event, options) => {
  const result = await withDialog(() => dialog.showSaveDialog(mainWindow, options))
  if (!result.canceled && result.filePath) result.filePath = fileAccess.grantFile(result.filePath,true)
  return result
}, validDialogOptions)

handle('show-directory-dialog', async () => {
  const result = await withDialog(() => dialog.showOpenDialog(mainWindow, {properties:['openDirectory']}))
  if (!result.canceled) result.filePaths = result.filePaths.map(target => fileAccess.grantDirectory(target))
  return result
})

handle('show-message-box', async (event, options) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow
  return withDialog(() => dialog.showMessageBox(win, normalizeMessageBoxOptions(options)))
}, options => validDialogOptions(options, true))

handle('check-for-updates', async () => {
  const result = await checkForAppUpdates()
  if (result.success) store.set('lastUpdateCheckAt', Date.now())
  return result
})

// 窄配置接口：未知键整次拒绝；初始化读取不写回。
handle('get-home-dir', () => os.homedir())
handle('authorize-recent', async (event, target) => {
  try {
    if (!fs.statSync(target).isFile()) return {success:false,error:'最近记录对应的路径不是文件'}
    fs.accessSync(target, fs.constants.R_OK)
  } catch (error) {
    return {success:false,error:error.code === 'ENOENT' ? '文件不存在，可能已被移动或删除；可移除此记录' : `无法读取最近文件：${error.message}`}
  }
  if (fileAccess.canAccess(target)) return {success:true,filePath:fileAccess.requireAccess(target)}
  const result = await withDialog(() => dialog.showOpenDialog(mainWindow,{title:'重新授权打开最近文件',defaultPath:target,properties:['openFile']}))
  if (result.canceled || !result.filePaths[0]) return {success:false,canceled:true}
  return {success:true,filePath:fileAccess.grantFile(result.filePaths[0])}
}, validPath)
handle('get-store', () => {
  const settings = normalizeSettings(store.store)
  if (settings.workDir && fileAccess.canAccess(settings.workDir,{directory:true})) settings.workDir = fileAccess.requireAccess(settings.workDir,{directory:true})
  return { ...settings, nativeDark: nativeTheme.shouldUseDarkColors }
})
handle('set-store', (event, data) => {
  if (data.workDir && !fileAccess.canAccess(data.workDir,{directory:true})) throw new Error('请先选择工作目录')
  Object.entries(data).forEach(([key, value]) => { if (JSON.stringify(store.get(key)) !== JSON.stringify(value)) store.set(key, value) })
  return { success:true }
}, validateSettingsPatch)
handle('open-external', async (event, url) => { await shell.openExternal(httpsURL(url)); return { success:true } }, value => !!httpsURL(value))
handle('app:close-reply', (event, data) => { const reply = closeReplies.get(data.id); closeReplies.delete(data.id); reply?.(data.approved) }, data => data && Number.isInteger(data.id) && typeof data.approved === 'boolean')
handle('app:cancel-close', () => closeGuard?.cancel())
handle('app:editor-active', (event, active) => { editorMenuItems.forEach(item => { item.enabled = active }) }, value => typeof value === 'boolean')

// PDF 导出
handle('export-pdf', async (event, htmlContent, defaultPath) => {
  let pdfWindow
  try {
    // 选择保存路径
    const result = await withDialog(() => dialog.showSaveDialog(mainWindow, {
      defaultPath,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    }))
    if (result.canceled || !result.filePath) return { success: false, canceled: true }
    fileAccess.grantFile(result.filePath,true)

    // 创建临时窗口渲染 HTML
    pdfWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        javascript: false
      }
    })

    secureContents(pdfWindow.webContents)
    const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; object-src 'none'; img-src data: https:; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none';">`
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(policy + htmlContent)}`)

    // 生成 PDF
    const pdfData = await pdfWindow.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true
    })

    // 写入文件
    fs.writeFileSync(fileAccess.requireAccess(result.filePath,{write:true}), pdfData)
    pdfWindow.destroy()

    return { success: true, filePath: result.filePath }
  } catch (error) {
    return { success: false, error: error.message }
  } finally { if (pdfWindow && !pdfWindow.isDestroyed()) pdfWindow.destroy() }
}, (html, target) => validText(html) && typeof target === 'string' && target.length < 32768 && !target.includes('\0'))

// Toggle DevTools IPC
handle('toggle-devtools', () => {
  if (app.isPackaged) return
  const win = BrowserWindow.getFocusedWindow()
  if (win) win.webContents.toggleDevTools()
})

app.whenReady().then(() => {
  workshop = registerAgentWorkshopIpc({ store, getWindow: () => mainWindow, handle, fileAccess, canStart: () => !closeGuard?.isPending() })
  initializeCloseGuard()
  createMenu()
  createWindow()
  nativeTheme.on('updated', () => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('app:theme', nativeTheme.shouldUseDarkColors) })
})

app.on('before-quit', event => {
  if (allowQuit || !mainWindow || mainWindow.isDestroyed()) return
  event.preventDefault(); closeGuard?.request('quit')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (!mainWindow || mainWindow.isDestroyed()) createWindow()
  else mainWindow.show()
})
