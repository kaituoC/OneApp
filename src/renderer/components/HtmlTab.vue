<template>
  <div class="html-tab">
    <div class="toolbar">
      <button @click="showFileList = !showFileList">{{ showFileList ? '隐藏列表' : '显示列表' }}</button>
      <button @click="showEditor = !showEditor">{{ showEditor ? '隐藏编辑' : '显示编辑' }}</button>
      <button @click="showPreview = !showPreview">{{ showPreview ? '隐藏预览' : '显示预览' }}</button>
      <button @click="openFileDialog">打开文件</button>
      <button @click="newFile">新建</button>
      <button @click="saveFile">保存</button>
    </div>

    <div class="content">
      <aside v-if="showFileList" class="file-list">
        <div class="file-list-section">
          <div class="section-header">
            <span>文件列表</span>
            <button class="refresh-btn" @click="loadFiles" title="刷新">↻</button>
          </div>
          <div v-if="!workDir" class="empty-hint">
            请先在设置中选择工作目录
          </div>
          <div v-else-if="loading" class="empty-hint">加载中...</div>
          <div v-else-if="files.length === 0" class="empty-hint">
            目录中暂无 .html 文件
          </div>
          <div v-else class="scrollable-list">
            <div
              v-for="file in files"
              :key="file"
              :class="['file-item', { active: currentFilePath === getFullPath(file) }]"
              @click="openFileItem(file)"
              @mouseenter="showTooltip($event, file)"
              @mouseleave="hideTooltip"
            >
              {{ truncateFileName(file) }}
            </div>
          </div>
        </div>

        <div class="recent-files-section">
          <div class="section-header">
            <span>最近打开</span>
            <button class="refresh-btn" @click="loadRecentFiles" title="刷新">↻</button>
          </div>
          <div v-if="recentLoading" class="empty-hint">加载中...</div>
          <div v-else-if="recentFiles.length === 0" class="empty-hint">
            暂无最近打开的文件
          </div>
          <div v-else class="scrollable-list">
            <div
              v-for="recent in recentFiles"
              :key="recent.path"
              class="file-item"
              @click="recent.path && openRecentFile(recent.path)"
              @mouseenter="recent.path && showRecentTooltip($event, recent.path)"
              @mouseleave="hideRecentTooltip"
            >
              <div class="recent-file-name">{{ truncateRecentFilePath(recent.path) }}</div>
            </div>
          </div>
        </div>
      </aside>

      <div v-if="showEditor" :class="['editor-container', { 'with-preview': showPreview }]">
        <EditorWithLineNumbers
          ref="editorRef"
          v-model="editorContent"
          :font-size="fontSize"
          class="html-editor"
          @input="onContentChange"
          @scroll="onEditorScroll"
        />
      </div>

      <HtmlPreview
        v-if="showPreview"
        ref="previewRef"
        :content="editorContent"
        :class="['preview-container', { 'full-width': !showEditor }]"
      />

      <div v-if="!showEditor && !showPreview" class="empty-area">
        <span>点击工具栏按钮显示内容</span>
      </div>
    </div>

    <!-- 文件名 Tooltip -->
    <div
      v-if="tooltipVisible"
      class="file-tooltip"
      :style="tooltipStyle"
    >
      {{ tooltipText }}
    </div>

    <!-- 最近文件 Tooltip -->
    <div
      v-if="recentTooltipVisible"
      class="file-tooltip"
      :style="recentTooltipStyle"
    >
      {{ recentTooltipText }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { listHtmlFiles, readFile, saveFile as dialogSaveFile, openFile, getHtmlRecentFiles, removeHtmlRecentFile, addHtmlRecentFile } from '../utils/fileHelper.js'
import EditorWithLineNumbers from './EditorWithLineNumbers.vue'
import HtmlPreview from './HtmlPreview.vue'

const props = defineProps({
  workDir: { type: String, default: '' },
  fontSize: { type: Number, default: 14 }
})

const emit = defineEmits(['file-open', 'save-status'])

const showFileList = ref(true)
const showEditor = ref(true)
const showPreview = ref(true)
const editorContent = ref('<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n  <meta charset="UTF-8">\n  <title>新文档</title>\n</head>\n<body>\n  <h1>新文档</h1>\n  <p>开始编写...</p>\n</body>\n</html>')
const currentFilePath = ref('')
const files = ref([])
const loading = ref(false)
const recentFiles = ref([])
const recentLoading = ref(false)

const editorRef = ref(null)
const previewRef = ref(null)
let scrollSyncing = false

function onEditorScroll() {
  if (scrollSyncing || !showPreview.value) return
  scrollSyncing = true

  const textarea = editorRef.value?.textareaRef
  const iframeDoc = previewRef.value?.iframeRef?.contentDocument || previewRef.value?.iframeRef?.contentWindow?.document

  if (textarea && iframeDoc) {
    const ratio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight || 1)
    iframeDoc.body.scrollTop = ratio * (iframeDoc.body.scrollHeight - iframeDoc.body.clientHeight || 1)
  }

  setTimeout(() => scrollSyncing = false, 50)
}

// Tooltip 状态
const tooltipVisible = ref(false)
const tooltipText = ref('')
const tooltipStyle = ref({})

function showTooltip(event, fileName) {
  if (fileName.length <= 28) return

  const rect = event.target.getBoundingClientRect()
  tooltipText.value = fileName
  tooltipStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.right + 8}px`
  }
  tooltipVisible.value = true
}

function hideTooltip() {
  tooltipVisible.value = false
}

function getFullPath(fileName) {
  return `${props.workDir}/${fileName}`
}

function truncateFileName(fileName) {
  const maxLen = 28
  if (fileName.length <= maxLen) return fileName

  const ext = fileName.endsWith('.html') ? '.html' : fileName.endsWith('.htm') ? '.htm' : ''
  const baseName = fileName.slice(0, fileName.length - ext.length)

  const prefix = baseName.slice(0, 12)
  const suffix = baseName.slice(-10)
  return `${prefix}...${suffix}${ext}`
}

function truncateRecentFilePath(filePath) {
  if (!filePath) return ''
  const maxLen = 40
  if (filePath.length <= maxLen) return filePath
  const fileName = filePath.split('/').pop()
  const dir = filePath.split('/').slice(0, -1).join('/')
  if (dir.length <= 15) return filePath
  return `.../${dir.slice(-15)}/${fileName}`
}

const recentTooltipVisible = ref(false)
const recentTooltipText = ref('')
const recentTooltipStyle = ref({})

function showRecentTooltip(event, filePath) {
  const displayText = truncateRecentFilePath(filePath)
  if (displayText === filePath) return

  const rect = event.target.getBoundingClientRect()
  recentTooltipText.value = filePath
  recentTooltipStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.right + 8}px`
  }
  recentTooltipVisible.value = true
}

function hideRecentTooltip() {
  recentTooltipVisible.value = false
}

async function openRecentFile(filePath) {
  try {
    const content = await readFile(filePath)
    editorContent.value = content
    currentFilePath.value = filePath
    emit('file-open', filePath)
    await addHtmlRecentFile(filePath)
    loadRecentFiles()
  } catch (e) {
    alert('文件不存在，已从列表中移除')
    await removeHtmlRecentFile(filePath)
    loadRecentFiles()
  }
}

async function openFileDialog() {
  const result = await window.electronAPI.showOpenDialog({
    defaultPath: props.workDir || undefined,
    properties: ['openFile'],
    filters: [{ name: 'HTML', extensions: ['html', 'htm'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return

  try {
    const content = await readFile(result.filePaths[0])
    editorContent.value = content
    currentFilePath.value = result.filePaths[0]
    emit('file-open', result.filePaths[0])
    await addHtmlRecentFile(result.filePaths[0])
    loadRecentFiles()
  } catch (e) {
    console.error('打开文件失败:', e)
  }
}

async function loadFiles() {
  if (!props.workDir) {
    files.value = []
    return
  }
  loading.value = true
  try {
    files.value = await listHtmlFiles(props.workDir)
  } catch (e) {
    console.error('加载文件列表失败:', e)
    files.value = []
  }
  loading.value = false
}

async function loadRecentFiles() {
  recentLoading.value = true
  try {
    const allFiles = await getHtmlRecentFiles()
    const validFiles = allFiles.filter(f => f && f.path)
    if (validFiles.length !== allFiles.length) {
      await window.electronAPI.setStore({ recentHtmlFiles: validFiles })
    }
    recentFiles.value = validFiles
  } catch (e) {
    console.error('加载最近文件失败:', e)
    recentFiles.value = []
  }
  recentLoading.value = false
}

watch(() => props.workDir, (newDir) => {
  if (newDir) {
    loadFiles()
  } else {
    files.value = []
  }
})

onMounted(() => {
  if (props.workDir) {
    loadFiles()
  }
  setTimeout(() => loadRecentFiles(), 100)
})

async function openFileItem(fileName) {
  const fullPath = getFullPath(fileName)
  try {
    editorContent.value = await readFile(fullPath)
    currentFilePath.value = fullPath
    emit('file-open', fullPath)
  } catch (e) {
    console.error('打开文件失败:', e)
  }
}

async function newFile() {
  editorContent.value = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n  <meta charset="UTF-8">\n  <title>新文档</title>\n</head>\n<body>\n  <h1>新文档</h1>\n  <p>开始编写...</p>\n</body>\n</html>'
  currentFilePath.value = ''
  emit('save-status', '新文件')
}

async function saveFile() {
  try {
    if (currentFilePath.value) {
      const { writeFile } = await import('../utils/fileHelper.js')
      await writeFile(currentFilePath.value, editorContent.value)
      emit('save-status', '已保存')
      loadFiles()
    } else {
      const path = await dialogSaveFile(editorContent.value, 'untitled.html', { name: 'HTML', extensions: ['html'] }, props.workDir)
      if (path) {
        currentFilePath.value = path
        emit('file-open', path)
        emit('save-status', '已保存')
        loadFiles()
      }
    }
  } catch {
    emit('save-status', '保存失败')
  }
}

function onContentChange() {
  emit('save-status', currentFilePath.value ? '未保存' : '新文件')
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    saveFile()
  }
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault()
    newFile()
  }
})
</script>

<style scoped>
.html-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.file-list {
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-list-section,
.recent-files-section {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.file-list-section {
  flex: 1;
  border-bottom: 2px solid var(--border-color);
  overflow: hidden;
}

.recent-files-section {
  flex: 1;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.scrollable-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.refresh-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px 6px;
  font-size: 14px;
}

.refresh-btn:hover {
  color: var(--accent);
}

.file-item {
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
}

.file-item:hover {
  background: var(--bg-tertiary);
}

.file-item.active {
  background: var(--accent);
  color: white;
}

.recent-file-name {
  font-size: 11px;
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.file-tooltip {
  position: fixed;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  padding: 6px 10px;
  font-size: 13px;
  font-family: var(--font-mono);
  border-radius: 4px;
  white-space: nowrap;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 1000;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.empty-hint {
  padding: 20px 12px;
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
}

.editor-container {
  flex: 1;
  display: flex;
  min-width: 0;
}

.editor-container.with-preview {
  width: 50%;
}

.preview-container {
  flex: 1;
  min-width: 300px;
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.preview-container.full-width {
  flex: 1;
  border-left: none;
}

.empty-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
