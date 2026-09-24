import { inject, ref, onUnmounted } from 'vue'

// 可接收文本输入的目标工具
export const SEND_TARGETS = [
  { tabKey: 'json', subKey: 'json', label: 'JSON 格式化' },
  { tabKey: 'json', subKey: 'yaml', label: 'YAML' },
  { tabKey: 'json', subKey: 'csv', label: 'CSV' },
  { tabKey: 'json', subKey: 'sql', label: 'SQL' },
  { tabKey: 'json', subKey: 'xml', label: 'XML' },
  { tabKey: 'text', subKey: 'case', label: '大小写转换' },
  { tabKey: 'text', subKey: 'sort', label: '排序' },
  { tabKey: 'text', subKey: 'dedupe', label: '去重' },
  { tabKey: 'diff', label: '文本对比' },
  { tabKey: 'regex', label: '正则测试' },
  { tabKey: 'encode', subKey: 'base64', label: 'Base64' },
  { tabKey: 'encode', subKey: 'url', label: 'URL 编码' }
]

export const SEND_TO_KEY = Symbol('sendTo')
export const PENDING_INPUT_KEY = Symbol('pendingInput')

export function provideSendTo(setActiveTab, setSubTool) {
  const pendingInput = ref(null)
  const transferRequest = ref(null)
  const inputReaders = new Map()
  function registerInput(tabKey, read) {
    inputReaders.set(tabKey, read)
    return () => { if (inputReaders.get(tabKey) === read) inputReaders.delete(tabKey) }
  }
  function deliver(target, content) {
    if (content.length > 512 * 1024) return false
    setActiveTab(target.tabKey)
    if (target.subKey) setSubTool(target.tabKey, target.subKey)
    pendingInput.value = { ...target, content }
    return true
  }
  function sendTo(tabKey, content, subKey) {
    if (!content || content.length > 512 * 1024 || !SEND_TARGETS.some(t => t.tabKey === tabKey && (t.subKey || null) === (subKey || null))) return false
    const target = { tabKey, subKey: subKey || null }
    const existing = inputReaders.get(tabKey)?.(subKey) || ''
    if (existing) {
      transferRequest.value = { ...target, content, existing, label: SEND_TARGETS.find(t => t.tabKey === tabKey && (t.subKey || null) === (subKey || null))?.label }
      return true
    }
    return deliver(target, content)
  }
  function confirmTransfer(action) {
    const request = transferRequest.value
    if (!request) return false
    if (action === 'cancel') { transferRequest.value = null; return true }
    if (!['replace', 'append'].includes(action)) return false
    const existing = inputReaders.get(request.tabKey)?.(request.subKey) || ''
    const content = action === 'append' ? existing + (existing ? '\n' : '') + request.content : request.content
    if (!deliver(request, content)) return false
    transferRequest.value = null
    return true
  }
  return { sendTo, pendingInput, registerInput, transferRequest, confirmTransfer }
}

export function useRegisterInput(tabKey, read) {
  const api = inject(SEND_TO_KEY, null)
  const unregister = api?.registerInput?.(tabKey, read)
  onUnmounted(() => unregister?.())
}

export function useSendTo() {
  return inject(SEND_TO_KEY, { sendTo: () => false })
}

export function usePendingInput() {
  return inject(PENDING_INPUT_KEY, ref(null))
}

export function getSendTargets(currentTabKey, currentSubKey) {
  return SEND_TARGETS
    .filter(t => !(t.tabKey === currentTabKey && (t.subKey || null) === (currentSubKey || null)))
    .map(t => ({ key: `${t.tabKey}/${t.subKey || ''}`, label: t.label }))
}
