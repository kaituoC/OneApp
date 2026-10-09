import path from 'node:path'
import { pathToFileURL } from 'node:url'
export const validPath = value => typeof value === 'string' && value.length > 0 && value.length <= 32768 && !value.includes('\0') && path.isAbsolute(value)
export const validText = value => typeof value === 'string' && value.length <= 32 * 1024 * 1024
const object = value => !!value && typeof value === 'object' && !Array.isArray(value)
export function isTrustedEvent(event, window, pageURL) {
  if (!window || window.isDestroyed() || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) return false
  try {
    const actual = new URL(event.senderFrame.url), expected = new URL(pageURL)
    actual.hash = ''; expected.hash = ''
    return actual.href === expected.href
  } catch { return false }
}
export function httpsURL(value) {
  if (typeof value !== 'string' || value.length > 8192) return null
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null } catch { return null }
}
const validators = {
  workDir: v => v === '' || validPath(v),
  theme: v => ['dark','light','system'].includes(v),
  fontSize: v => Number.isInteger(v) && v >= 10 && v <= 24,
  recentFiles: v => Array.isArray(v) && v.length <= 10 && v.every(validPath),
  updateCheckOnLaunch: v => typeof v === 'boolean',
  recentTabByGroup: v => object(v) && Object.keys(v).length <= 10 && Object.entries(v).every(([k,val]) => ['workspace','transform','inspect','encoding','time','generate','ai','system'].includes(k) && ['editor','json','diff','text','regex','encode','time','generator','agent','settings'].includes(val))
}
export function validateSettingsPatch(data) { return object(data) && Object.entries(data).every(([key, value]) => validators[key]?.(value)) }
export function normalizeSettings(data = {}) {
  const defaults = { workDir:'', theme:'dark', fontSize:14, recentFiles:[], updateCheckOnLaunch:false, recentTabByGroup:{} }
  return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, validators[key](data[key]) ? data[key] : fallback]))
}
export function validDialogOptions(options = {}, message = false) {
  if (!object(options)) return false
  const allowed = message ? ['type','title','message','detail','buttons','defaultId','cancelId','noLink','checkboxLabel','checkboxChecked'] : ['title','defaultPath','buttonLabel','properties','filters']
  if (Object.keys(options).some(key => !allowed.includes(key))) return false
  if (['title','defaultPath','buttonLabel','message','detail','checkboxLabel'].some(k => options[k] !== undefined && !validText(options[k]))) return false
  if (options.properties && (!Array.isArray(options.properties) || !options.properties.every(v => ['openFile','openDirectory','multiSelections','showHiddenFiles','createDirectory'].includes(v)))) return false
  if (options.filters && (!Array.isArray(options.filters) || options.filters.length > 20 || !options.filters.every(f => object(f) && typeof f.name === 'string' && Array.isArray(f.extensions) && f.extensions.every(e => typeof e === 'string' && /^[\w*]+$/.test(e))))) return false
  if (message) {
    if (options.type && !['none','info','error','question','warning'].includes(options.type)) return false
    if (options.buttons && (!Array.isArray(options.buttons) || !options.buttons.length || options.buttons.length > 8 || !options.buttons.every(validText))) return false
    for (const key of ['defaultId','cancelId']) if (options[key] !== undefined && (!Number.isInteger(options[key]) || options[key] < 0 || options[key] >= (options.buttons?.length || 1))) return false
    for (const key of ['noLink','checkboxChecked']) if (options[key] !== undefined && typeof options[key] !== 'boolean') return false
  }
  return true
}
export function restoreBounds(saved, displays) {
  const fallback = { width:1200, height:800 }
  if (!object(saved) || !['x','y','width','height'].every(k => Number.isFinite(saved[k]))) return fallback
  const area = displays.find(d => saved.x + saved.width > d.x + 80 && saved.x < d.x + d.width - 80 && saved.y >= d.y && saved.y < d.y + d.height - 80) || displays[0]
  if (!area) return fallback
  const width = Math.max(800, Math.min(saved.width, area.width)), height = Math.max(600, Math.min(saved.height, area.height))
  return { width, height, x:Math.round(Math.max(area.x, Math.min(saved.x, area.x + area.width - width))), y:Math.round(Math.max(area.y, Math.min(saved.y, area.y + area.height - height))) }
}
export const rendererFileURL = pathname => pathToFileURL(pathname).href
