import { ref, computed, reactive, watch } from 'vue'
import { readFile, writeFile, saveFile as dialogSaveFile, openFile } from '../utils/fileHelper.js'

const MARKDOWN_TEMPLATE = '# 新文档\n\n开始编写...'
const HTML_TEMPLATE = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n  <meta charset="UTF-8">\n  <title>新文档</title>\n</head>\n<body>\n  <h1>新文档</h1>\n  <p>开始编写...</p>\n</body>\n</html>'
function modeFromPath(path) {
  const ext = path.split('.').pop()?.toLowerCase()
  return ['md', 'markdown'].includes(ext) ? 'markdown' : ['html', 'htm'].includes(ext) ? 'html' : 'plaintext'
}
const EDITOR_FILTERS = [{ name: '所有文件', extensions: ['*'] }, { name: 'Markdown / HTML', extensions: ['md', 'markdown', 'html', 'htm'] }]

export function useEditorFile({ workDir, onFileOpen, onSaveStatus, refreshTree, confirm } = {}) {
  const editorContent = ref(MARKDOWN_TEMPLATE), currentFilePath = ref(''), mode = ref('markdown')
  const savedContent = ref(MARKDOWN_TEMPLATE), saving = ref(false)
  const drafts = reactive(new Map())
  const dirty = computed(() => editorContent.value !== savedContent.value)
  const dirtyFiles = computed(() => {
    const entries = new Map([...drafts].filter(([, d]) => d.content !== d.savedContent))
    entries.delete(currentFilePath.value)
    if (dirty.value) entries.set(currentFilePath.value, { content: editorContent.value, savedContent: savedContent.value })
    return [...entries].map(([path, d]) => ({ path, ...d, name: path.split(/[\\/]/).pop() || '未命名文档' }))
  })
  const ask = confirm || (options => globalThis.window?.electronAPI?.showMessageBox(options) || Promise.resolve({response:2}))
  let loadSequence = 0, documentRevision = 0, pendingSave = null, replacing = false
  watch(dirty, value => onSaveStatus?.(value ? '未保存' : '已保存'), { flush: 'sync' })
  function rememberDraft() {
    const path = currentFilePath.value
    if (path && dirty.value) drafts.set(path, { content: editorContent.value, savedContent: savedContent.value })
    else if (path) drafts.delete(path)
  }
  function saveFile({ as = false, path: cachedPath } = {}) {
    if (pendingSave) return pendingSave
    saving.value = true
    pendingSave = performSave(as, cachedPath).finally(() => { pendingSave = null; saving.value = false })
    return pendingSave
  }
  async function performSave(as, cachedPath) {
    const sourcePath = cachedPath ?? currentFilePath.value
    const draft = cachedPath && cachedPath !== currentFilePath.value ? drafts.get(cachedPath) : null
    if (cachedPath && cachedPath !== currentFilePath.value && !draft) return false
    const content = draft ? draft.content : editorContent.value, revision = documentRevision
    try {
      let target = sourcePath
      if (as || !target) {
        const ext = mode.value === 'html' ? 'html' : mode.value === 'plaintext' ? 'txt' : 'md'
        target = await dialogSaveFile(content, sourcePath || `untitled.${ext}`, { name: '文本文件', extensions: [ext] }, sourcePath ? undefined : workDir?.value, async targetPath => {
          rememberDraft()
          if (targetPath !== sourcePath && drafts.has(targetPath)) {
            await ask({ type: 'warning', message: '目标文件有未保存草稿', detail: '请先从未保存列表打开并保存该稿，或选择其他路径。', buttons: ['返回'], cancelId: 0 })
            return false
          }
          return true
        })
        if (!target) return false
      } else await writeFile(target, content)
      // 只有写回原路径才更新它的缓存快照；另存为不能把旧磁盘文件误标 clean。
      if (target === sourcePath) {
        const cached = drafts.get(sourcePath)
        if (cached && cached.content !== content) cached.savedContent = content
        else drafts.delete(sourcePath)
      }
      const sameDocument = sourcePath ? currentFilePath.value === sourcePath : revision === documentRevision && !currentFilePath.value
      if (sameDocument && (target === sourcePath || revision === documentRevision)) {
        currentFilePath.value = target
        savedContent.value = content
        mode.value = modeFromPath(target)
        if (target !== sourcePath) drafts.delete(sourcePath)
        onSaveStatus?.(dirty.value ? '未保存' : '已保存')
        onFileOpen?.(target)
      }
      refreshTree?.()
      return true
    } catch (e) {
      onSaveStatus?.(`保存失败：${e.message}`)
      await ask({ type: 'error', message: '保存失败，内容仍保留', detail: e.message, buttons: ['确定'] })
      return false
    }
  }
  async function guardAnonymous() {
    while (!currentFilePath.value && dirty.value) {
      const snapshot = editorContent.value
      const { response } = await ask({ type: 'warning', message: '未命名文档尚未保存', detail: '是否保存后继续？', buttons: ['保存', '不保存', '取消'], defaultId: 2, cancelId: 2 })
      if (response === 2 || response === undefined) return false
      if (response === 0) { if (!await saveFile()) return false }
      else if (snapshot === editorContent.value) return true
    }
    return true
  }
  async function loadFile(path) {
    if (path === currentFilePath.value && dirty.value) return true
    const sequence = ++loadSequence
    try {
      const content = drafts.has(path) ? drafts.get(path).content : await readFile(path)
      if (sequence !== loadSequence || replacing) return false
      replacing = true
      try {
        if (!await guardAnonymous() || sequence !== loadSequence) return false
        // guard 可能刚把匿名稿保存到目标；不得覆盖为旧读取快照。
        if (currentFilePath.value === path) return true
        rememberDraft()
        const cached = drafts.get(path)
        documentRevision++
        editorContent.value = cached ? cached.content : content
        savedContent.value = cached ? cached.savedContent : content
        currentFilePath.value = path
        mode.value = modeFromPath(path)
        onFileOpen?.(path)
        onSaveStatus?.(dirty.value ? '未保存' : '已保存')
        return true
      } finally { replacing = false }
    } catch (e) {
      onSaveStatus?.(`打开失败：${e.message}`)
      await ask({ type: 'error', message: '打开失败，当前稿仍保留', detail: e.message, buttons: ['确定'] })
      return false
    }
  }
  async function openFileDialog() {
    const path = await openFile(workDir?.value, EDITOR_FILTERS)
    return path ? loadFile(path) : false
  }
  async function newFile(type = 'markdown') {
    if (replacing) return false
    replacing = true
    try {
      if (!await guardAnonymous()) return false
      loadSequence++
      documentRevision++
      rememberDraft()
      currentFilePath.value = ''
      editorContent.value = type === 'html' ? HTML_TEMPLATE : type === 'plaintext' ? '' : MARKDOWN_TEMPLATE
      savedContent.value = editorContent.value
      mode.value = type
      onSaveStatus?.('新文件')
      return true
    } finally { replacing = false }
  }
  let closeToken = null, discarded = new Map()
  async function prepareClose(token) {
    if (closeToken !== token) { closeToken = token; discarded = new Map() }
    if (pendingSave) await pendingSave
    while (true) {
      const files = dirtyFiles.value.filter(d => discarded.get(d.path) !== d.content)
      if (!files.length) return true
      const { response } = await ask({ type: 'warning', message: `有 ${files.length} 个未保存文件`, detail: files.map(d => d.path || d.name).join('\n'), buttons: ['全部保存', '不保存', '取消'], defaultId: 2, cancelId: 2 })
      if (response === 2 || response === undefined) return false
      if (response === 1) files.forEach(d => discarded.set(d.path, d.content))
      else for (const d of files) if (!await saveFile({ path: d.path })) return false
    }
  }
  return { editorContent, currentFilePath, mode, dirty, dirtyFiles, saving, openFileDialog, openFromTree: loadFile, newFile, saveFile, prepareClose, onContentChange: () => onSaveStatus?.(dirty.value ? '未保存' : '已保存') }
}
