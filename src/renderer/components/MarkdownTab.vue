<template>
  <div class="markdown-tab">
    <div class="toolbar">
      <button @click="showFileList = !showFileList">{{ showFileList ? '隐藏列表' : '显示列表' }}</button>
      <button @click="showEditor = !showEditor">{{ showEditor ? '隐藏编辑' : '显示编辑' }}</button>
      <button @click="showPreview = !showPreview">{{ showPreview ? '隐藏预览' : '显示预览' }}</button>
      <button @click="openFileDialog">打开文件</button>
      <button @click="newFile">新建</button>
      <button @click="saveFile">保存</button>
      <button @click="exportHTML">导出HTML</button>
      <button @click="exportPDF">导出PDF</button>
      <button @click="showSyntaxHelp = true">语法介绍</button>
    </div>

    <div class="content">
      <aside v-if="showFileList" class="file-list">
        <!-- 主体：懒加载目录树 -->
        <div class="tree-section">
          <FileTree
            ref="fileTreeRef"
            :root-path="workDir"
            :editable-extensions="['md']"
            :active-path="currentFilePath"
            @open-file="openFromTree"
          />
        </div>

        <!-- 底部：最近打开文件（可折叠，默认收起） -->
        <div :class="['recent-files-section', { collapsed: recentCollapsed }]">
          <div class="section-header clickable" @click="recentCollapsed = !recentCollapsed">
            <span>{{ recentCollapsed ? '▸' : '▾' }} 最近打开</span>
            <button class="refresh-btn" @click.stop="loadRecentFiles" title="刷新">↻</button>
          </div>
          <template v-if="!recentCollapsed">
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
          </template>
        </div>
      </aside>

      <div v-if="showEditor" :class="['editor-container', { 'with-preview': showPreview }]">
        <EditorWithLineNumbers
          ref="editorRef"
          v-model="editorContent"
          :font-size="fontSize"
          @input="onContentChange"
          @scroll="onEditorScroll"
        />
      </div>

      <MarkdownPreview
        v-if="showPreview"
        ref="previewRef"
        :content="editorContent"
        :class="['preview-container', { 'full-width': !showEditor }]"
      />

      <div v-if="!showEditor && !showPreview" class="empty-area">
        <span>点击工具栏按钮显示内容</span>
      </div>
    </div>

    <SyntaxHelpModal v-if="showSyntaxHelp" @close="showSyntaxHelp = false" />

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
import { readFile, saveFile as dialogSaveFile, openFile, getMdRecentFiles, removeMdRecentFile, addMdRecentFile } from '../utils/fileHelper.js'
import EditorWithLineNumbers from './EditorWithLineNumbers.vue'
import MarkdownPreview from './MarkdownPreview.vue'
import SyntaxHelpModal from './SyntaxHelpModal.vue'
import FileTree from './FileTree.vue'

const props = defineProps({
  workDir: { type: String, default: '' },
  fontSize: { type: Number, default: 14 }
})

const emit = defineEmits(['file-open', 'save-status'])

const showFileList = ref(true)
const showEditor = ref(true)
const showPreview = ref(true)
const showSyntaxHelp = ref(false)
const editorContent = ref('')
const currentFilePath = ref('')
const recentFiles = ref([])
const recentLoading = ref(false)
const recentCollapsed = ref(true)
const fileTreeRef = ref(null)

// 滚动同步
const editorRef = ref(null)
const previewRef = ref(null)
let scrollSyncing = false

// 编辑器滚动 -> 预览同步
function onEditorScroll() {
  if (scrollSyncing || !showPreview.value) return
  scrollSyncing = true

  const textarea = editorRef.value?.textareaRef
  const previewEl = previewRef.value?.previewEl

  if (textarea && previewEl) {
    const ratio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight || 1)
    previewEl.scrollTop = ratio * (previewEl.scrollHeight - previewEl.clientHeight || 1)
  }

  setTimeout(() => scrollSyncing = false, 50)
}

// 预览滚动 -> 编辑器同步
function onPreviewScroll(e) {
  if (scrollSyncing || !showEditor.value) return
  scrollSyncing = true

  const textarea = editorRef.value?.textareaRef
  const previewEl = previewRef.value?.previewEl

  if (textarea && previewEl) {
    const ratio = previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight || 1)
    textarea.scrollTop = ratio * (textarea.scrollHeight - textarea.clientHeight || 1)
  }

  setTimeout(() => scrollSyncing = false, 50)
}

// 监听预览区滚动
watch(showPreview, (val) => {
  if (val) {
    nextTick(() => {
      const previewEl = previewRef.value?.previewEl
      if (previewEl) {
        previewEl.addEventListener('scroll', onPreviewScroll)
      }
    })
  }
})

onMounted(() => {
  if (showPreview.value) {
    nextTick(() => {
      const previewEl = previewRef.value?.previewEl
      if (previewEl) {
        previewEl.addEventListener('scroll', onPreviewScroll)
      }
    })
  }
  setTimeout(() => loadRecentFiles(), 100)
})

// 最近文件路径截断显示
function truncateRecentFilePath(filePath) {
  if (!filePath) return ''
  const maxLen = 40
  if (filePath.length <= maxLen) return filePath
  const fileName = filePath.split('/').pop()
  const dir = filePath.split('/').slice(0, -1).join('/')
  if (dir.length <= 15) return filePath
  return `.../${dir.slice(-15)}/${fileName}`
}

// 最近文件 tooltip
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

// 点击最近文件
async function openRecentFile(filePath) {
  try {
    const content = await readFile(filePath)
    editorContent.value = content
    currentFilePath.value = filePath
    emit('file-open', filePath)
    await addMdRecentFile(filePath)
    loadRecentFiles()
  } catch (e) {
    alert('文件不存在，已从列表中移除')
    await removeMdRecentFile(filePath)
    loadRecentFiles()
  }
}

// 打开文件对话框
async function openFileDialog() {
  const path = await openFile(props.workDir)
  if (!path) return

  try {
    const content = await readFile(path)
    editorContent.value = content
    currentFilePath.value = path
    emit('file-open', path)
    await addMdRecentFile(path)
    loadRecentFiles()
  } catch (e) {
    console.error('打开文件失败:', e)
  }
}

// 从目录树点击打开文件
async function openFromTree(filePath) {
  try {
    editorContent.value = await readFile(filePath)
    currentFilePath.value = filePath
    emit('file-open', filePath)
    await addMdRecentFile(filePath)
    loadRecentFiles()
  } catch (e) {
    console.error('打开文件失败:', e)
  }
}

async function loadRecentFiles() {
  recentLoading.value = true
  try {
    const allFiles = await getMdRecentFiles()
    const validFiles = allFiles.filter(f => f && f.path)
    if (validFiles.length !== allFiles.length) {
      await window.electronAPI.setStore({ recentMdFiles: validFiles })
    }
    recentFiles.value = validFiles
  } catch (e) {
    console.error('加载最近文件失败:', e)
    recentFiles.value = []
  }
  recentLoading.value = false
}

async function newFile() {
  editorContent.value = '# 新文档\n\n开始编写...'
  currentFilePath.value = ''
  emit('save-status', '新文件')
}

async function saveFile() {
  try {
    if (currentFilePath.value) {
      const { writeFile } = await import('../utils/fileHelper.js')
      await writeFile(currentFilePath.value, editorContent.value)
      emit('save-status', '已保存')
      fileTreeRef.value?.refresh() // 刷新目录树，让新增/改动文件出现
    } else {
      const path = await dialogSaveFile(editorContent.value, 'untitled.md', undefined, props.workDir)
      if (path) {
        currentFilePath.value = path
        emit('file-open', path)
        emit('save-status', '已保存')
        fileTreeRef.value?.refresh()
      }
    }
  } catch {
    emit('save-status', '保存失败')
  }
}

function onContentChange() {
  emit('save-status', currentFilePath.value ? '未保存' : '新文件')
}

// 获取导出文件名基础
function getExportBaseName() {
  if (currentFilePath.value) {
    const fileName = currentFilePath.value.split('/').pop()
    return fileName.replace(/\.md$/i, '')
  }
  return 'untitled'
}

async function exportHTML() {
  const { marked } = await import('marked')
  const html = marked.parse(editorContent.value)
  const fullHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Export</title></head><body>${html}</body></html>`
  const exportName = `${getExportBaseName()}.html`
  await dialogSaveFile(fullHTML, exportName, { name: 'HTML', extensions: ['html'] }, props.workDir)
}

async function exportPDF() {
  const { marked } = await import('marked')
  const html = marked.parse(editorContent.value)
  const fullHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Export</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;padding:40px;max-width:800px;margin:0 auto;}h1,h2,h3{margin-top:1em;}pre{background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;}code{background:#f5f5f5;padding:2px 6px;border-radius:3px;}blockquote{border-left:4px solid #007acc;padding-left:16px;color:#666;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;}</style></head><body>${html}</body></html>`
  const exportName = `${getExportBaseName()}.pdf`
  const result = await window.electronAPI.exportPDF(fullHTML, exportName)
  if (result.success) {
    emit('save-status', 'PDF 已导出')
  }
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
.markdown-tab {
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

.tree-section {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
}

.recent-files-section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-top: 2px solid var(--border-color);
}

.recent-files-section:not(.collapsed) {
  min-height: 160px;
  max-height: 40%;
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

.section-header.clickable {
  cursor: pointer;
  user-select: none;
}

.section-header.clickable:hover {
  color: var(--text-primary);
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