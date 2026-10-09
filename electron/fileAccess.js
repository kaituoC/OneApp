import fs from 'node:fs'
import path from 'node:path'
import { validPath } from './workbenchPolicy.js'
// 授权来自系统选择的文件/目录/保存目标；不以字符串前缀判断目录归属。
// root 仅在本次进程内复用（已保存的工作目录在启动时恢复），最近文件本身不授予权限。
export function createFileAccess() {
  const roots = new Set(), files = new Set()
  function canonical(target, forWrite = false) {
    if (!validPath(target)) throw new Error('文件路径无效')
    try { return fs.realpathSync(target) }
    catch (error) {
      if (!forWrite || error.code !== 'ENOENT') throw error
      // 保存新文件必须有真实父目录；拒绝悬空符号链接。
      if (fs.existsSync(target) || (() => { try { fs.lstatSync(target); return true } catch { return false } })()) throw error
      return path.join(fs.realpathSync(path.dirname(target)), path.basename(target))
    }
  }
  function inside(root, target) {
    const relative = path.relative(root, target)
    return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith('..' + path.sep))
  }
  function grantFile(target, forWrite = false) { const real = canonical(target, forWrite); files.add(real); return real }
  function grantDirectory(target) {
    const real = canonical(target)
    if (!fs.statSync(real).isDirectory()) throw new Error('所选路径不是目录')
    roots.add(real)
    return real
  }
  function requireAccess(target, { write = false, directory = false } = {}) {
    const real = canonical(target, write)
    if ((directory || !files.has(real)) && ![...roots].some(root => inside(root, real))) throw new Error('未授权访问此路径，请通过打开文件或选择工作目录重新授权')
    if (directory && !fs.statSync(real).isDirectory()) throw new Error('所选路径不是目录')
    return real
  }
  function canAccess(target, options) { try { requireAccess(target,options); return true } catch { return false } }
  return { grantFile, grantDirectory, requireAccess, canAccess }
}
