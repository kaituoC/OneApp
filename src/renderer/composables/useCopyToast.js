import { ref, getCurrentScope, onScopeDispose } from 'vue'

// 复制到剪贴板并弹出短暂提示，多个工具页共用；返回是否复制成功
export function useCopyToast(duration = 1500) {
  const copyMessage = ref('')
  let timer = null
  if (getCurrentScope()) onScopeDispose(() => clearTimeout(timer))

  function flash(message) {
    copyMessage.value = message
    clearTimeout(timer)
    timer = setTimeout(() => { copyMessage.value = '' }, duration)
  }

  async function write(value, method, successMessage, failureMessage) {
    copyMessage.value = ''
    clearTimeout(timer)
    try {
      const api = window.electronAPI?.clipboard
      if (!api || typeof api[method] !== 'function') throw new Error('复制接口不可用')
      const result = await api[method](value)
      if (result?.success !== true) throw new Error('剪贴板写入失败')
      flash(successMessage)
      return true
    } catch {
      flash(failureMessage)
      return false
    }
  }

  const copyToClipboard = text => write(text == null ? text : String(text), 'writeText', '已复制', '复制失败')
  const copyPngToClipboard = dataUrl => write(dataUrl, 'writePng', '已复制 PNG', '复制 PNG 失败')

  return { copyMessage, copyToClipboard, copyPngToClipboard }
}
