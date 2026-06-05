import { ref, onMounted, onUnmounted } from 'vue'
import { readFile, writeFile, saveFile as dialogSaveFile, openFile } from '../utils/fileHelper.js'

// Markdown / HTML 新建模板
const MARKDOWN_TEMPLATE = '# 新文档\n\n开始编写...'
const HTML_TEMPLATE = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n  <meta charset="UTF-8">\n  <title>新文档</title>\n</head>\n<body>\n  <h1>新文档</h1>\n  <p>开始编写...</p>\n</body>\n</html>'

function modeFromPath(filePath) {
  if (!filePath) return 'markdown'
  const dot = filePath.lastIndexOf('.')
  const ext = dot >= 0 ? filePath.slice(dot + 1).toLowerCase() : ''
  if (ext === 'md') return 'markdown'
  if (ext === 'html' || ext === 'htm') return 'html'
  return 'plaintext'
}

/**
 * 统一编辑器的文件逻辑（打开 / 新建 / 保存 / 内容变更 / 快捷键）。
 * @param {object} opts
 * @param {import('vue').Ref<string>} opts.workDir 工作目录
 * @param {() => void} [opts.onFileOpen] 文件打开/路径变化回调（参数为路径）
 * @param {(status: string) => void} [opts.onSaveStatus] 保存状态回调
 * @param {() => void} [opts.refreshTree] 保存后刷新目录树
 */
const EDITOR_FILTERS = [
  { name: '所有文件', extensions: ['*'] },
  { name: 'Markdown / HTML', extensions: ['md', 'html', 'htm'] },
  { name: 'Markdown', extensions: ['md'] },
  { name: 'HTML', extensions: ['html', 'htm'] }
]

export function useEditorFile({ workDir, onFileOpen, onSaveStatus, refreshTree, isActive } = {}) {
  const editorContent = ref(MARKDOWN_TEMPLATE)
  const currentFilePath = ref('') // 仅存真实路径；新建未保存时为 ''
  // mode 为独立状态：打开文件按后缀设定，新建按类型设定
  const mode = ref('markdown')

  async function openFileDialog() {
    const filePath = await openFile(workDir?.value, EDITOR_FILTERS)
    if (filePath) await loadFile(filePath)
  }

  // 从目录树点击打开
  async function openFromTree(filePath) {
    await loadFile(filePath)
  }

  async function loadFile(filePath) {
    try {
      editorContent.value = await readFile(filePath)
      currentFilePath.value = filePath
      mode.value = modeFromPath(filePath)
      onFileOpen?.(filePath)
    } catch (e) {
      console.error('打开文件失败:', e)
    }
  }

  function newFile(type = 'markdown') {
    if (type === 'html') {
      editorContent.value = HTML_TEMPLATE
      mode.value = 'html'
    } else if (type === 'plaintext') {
      editorContent.value = ''
      mode.value = 'plaintext'
    } else {
      editorContent.value = MARKDOWN_TEMPLATE
      mode.value = 'markdown'
    }
    currentFilePath.value = ''
    onSaveStatus?.('新文件')
  }

  async function saveFile() {
    try {
      if (currentFilePath.value) {
        await writeFile(currentFilePath.value, editorContent.value)
        onSaveStatus?.('已保存')
        refreshTree?.()
      } else {
        const defaultName = mode.value === 'html' ? 'untitled.html'
          : mode.value === 'plaintext' ? 'untitled.txt' : 'untitled.md'
        const fileType = mode.value === 'html' ? { name: 'HTML', extensions: ['html'] }
          : mode.value === 'plaintext' ? { name: '文本文件', extensions: ['txt'] }
          : { name: 'Markdown', extensions: ['md'] }
        const savedPath = await dialogSaveFile(editorContent.value, defaultName, fileType, workDir?.value)
        if (savedPath) {
          currentFilePath.value = savedPath
          mode.value = modeFromPath(savedPath)
          onFileOpen?.(savedPath)
          onSaveStatus?.('已保存')
          refreshTree?.()
        }
      }
    } catch {
      onSaveStatus?.('保存失败')
    }
  }

  function onContentChange() {
    onSaveStatus?.(currentFilePath.value ? '未保存' : '新文件')
  }

  // 快捷键：onMounted 绑定、onUnmounted 解绑，避免泄漏与重复触发
  // isActive 为 false（非编辑器标签激活时）跳过，防止在其他标签误触发保存
  function handleKeydown(e) {
    if (isActive && !isActive.value) return
    const mod = e.ctrlKey || e.metaKey
    if (mod && e.key === 's') {
      e.preventDefault()
      saveFile()
    }
    if (mod && e.key === 'n') {
      e.preventDefault()
      newFile('markdown')
    }
  }
  onMounted(() => document.addEventListener('keydown', handleKeydown))
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown))

  return {
    editorContent,
    currentFilePath,
    mode,
    openFileDialog,
    openFromTree,
    newFile,
    saveFile,
    onContentChange
  }
}
