import { inject, ref } from 'vue'

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
  const pendingInput = ref(null) // { tabKey, subKey?, content }

  function sendTo(tabKey, content, subKey) {
    if (!content || content.length > 512 * 1024) return false
    pendingInput.value = { tabKey, subKey: subKey || null, content }
    setActiveTab(tabKey)
    if (subKey) setSubTool(tabKey, subKey)
    return true
  }

  return { sendTo, pendingInput }
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
