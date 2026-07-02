import { ref } from 'vue'

// 各工具 Tab 共用的「结果状态」内核：output / statusMessage / hasError 三字段，
// 配 reset / setSuccess / setError 三个原语。各组件保留自己的字段映射
// （error 来源、成功文案）与工具专属状态（qrImage / tablePreview 等），仅共享这一层机制。
export function useToolResult() {
  const output = ref('')
  const statusMessage = ref('')
  const hasError = ref(false)

  function reset() {
    output.value = ''
    statusMessage.value = ''
    hasError.value = false
  }

  function setSuccess(result, message) {
    output.value = result
    statusMessage.value = message
    hasError.value = false
  }

  function setError(message) {
    output.value = message
    statusMessage.value = message
    hasError.value = true
  }

  return { output, statusMessage, hasError, reset, setSuccess, setError }
}
