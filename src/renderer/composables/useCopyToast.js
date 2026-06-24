import { ref } from 'vue'

// 复制到剪贴板并弹出短暂提示，多个工具页共用；返回是否复制成功
export function useCopyToast(duration = 1500) {
  const copyMessage = ref('')
  let timer = null

  function flash(message) {
    copyMessage.value = message
    clearTimeout(timer)
    timer = setTimeout(() => { copyMessage.value = '' }, duration)
  }

  async function copyToClipboard(text) {
    if (text == null) return false
    try {
      await navigator.clipboard.writeText(String(text))
      flash('已复制')
      return true
    } catch {
      flash('复制失败')
      return false
    }
  }

  return { copyMessage, copyToClipboard }
}
