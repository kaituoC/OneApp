<template>
  <div class="editor-tab">
    <div class="toolbar tool-command-bar">
      <div class="view-controls tool-segmented" aria-label="视图控制">
        <button :class="{ active: showFileList }" title="显示或隐藏文件列表" @click="showFileList = !showFileList">列表</button>
        <button :class="{ active: showEditor }" title="显示或隐藏编辑区" @click="showEditor = !showEditor">编辑</button>
        <button
          v-if="mode !== 'plaintext'"
          :class="{ active: showPreview }"
          title="显示或隐藏预览区"
          @click="showPreview = !showPreview"
        >预览</button>
      </div>
      <button @click="openFileDialog">
        <FolderOpen :size="15" aria-hidden="true" />
        打开文件
      </button>
      <div class="new-btn-wrap">
        <button @click="showNewMenu = !showNewMenu" aria-haspopup="menu" :aria-expanded="showNewMenu">
          <FilePlus2 :size="15" aria-hidden="true" />
          新建
          <ChevronDown :size="14" aria-hidden="true" />
        </button>
        <div v-if="showNewMenu" class="new-menu" @mouseleave="showNewMenu = false">
          <div class="new-menu-item" @click="handleNewFile('markdown')">新建 Markdown</div>
          <div class="new-menu-item" @click="handleNewFile('html')">新建 HTML</div>
          <div class="new-menu-item" @click="handleNewFile('plaintext')">新建纯文本</div>
        </div>
      </div>
      <button class="primary" @click="saveFile">
        <Save :size="15" aria-hidden="true" />
        保存
      </button>
      <template v-if="mode === 'markdown'">
        <button @click="exportHTML">
          <Download :size="15" aria-hidden="true" />
          导出 HTML
        </button>
        <button @click="exportPDF">
          <FileDown :size="15" aria-hidden="true" />
          导出 PDF
        </button>
        <button @click="showSyntaxHelp = true">
          <BookOpen :size="15" aria-hidden="true" />
          语法介绍
        </button>
      </template>
    </div>

    <div
      :class="[
        'content',
        'tool-workspace',
        {
          'has-preview': showPreview && mode !== 'plaintext',
          'has-file-list': showFileList,
          'has-editor': showEditor
        }
      ]"
    >
      <aside v-if="showFileList" class="file-list tool-panel">
        <FileTree
          ref="fileTreeRef"
          :root-path="workDir"
          :editable-extensions="editableExtensions"
          :active-path="currentFilePath"
          @open-file="handleOpenFromTree"
        />
      </aside>

      <div v-if="showEditor" :class="['editor-container', { 'with-preview': showPreview && mode !== 'plaintext' }]">
        <EditorWithLineNumbers
          ref="editorRef"
          v-model="editorContent"
          :font-size="fontSize"
          @input="onContentChange"
          @scroll="onEditorScroll"
        />
      </div>

      <component
        :is="mode === 'html' ? HtmlPreview : MarkdownPreview"
        v-if="showPreview && mode !== 'plaintext'"
        ref="previewRef"
        :content="editorContent"
        :class="['preview-container', { 'full-width': !showEditor }]"
      />

      <div v-if="!showEditor && !showPreview" class="empty-area">
        <span>点击工具栏按钮显示内容</span>
      </div>
    </div>

    <SyntaxHelpModal v-if="showSyntaxHelp" @close="showSyntaxHelp = false" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { BookOpen, ChevronDown, Download, FileDown, FilePlus2, FolderOpen, Save } from 'lucide-vue-next'
import { useEditorFile } from '../composables/useEditorFile.js'
import { saveFile as dialogSaveFile } from '../utils/fileHelper.js'

let _marked = null
async function getMarked() {
  if (!_marked) _marked = (await import('marked')).marked
  return _marked
}
import EditorWithLineNumbers from './EditorWithLineNumbers.vue'
import MarkdownPreview from './MarkdownPreview.vue'
import HtmlPreview from './HtmlPreview.vue'
import FileTree from './FileTree.vue'
import SyntaxHelpModal from './SyntaxHelpModal.vue'

const props = defineProps({
  workDir: { type: String, default: '' },
  fontSize: { type: Number, default: 14 },
  isActive: { type: Boolean, default: true }
})

const emit = defineEmits(['file-open', 'save-status'])

const fileTreeRef = ref(null)
const editorRef = ref(null)
const previewRef = ref(null)
const showFileList = ref(true)
const showEditor = ref(true)
const showPreview = ref(false)
const showSyntaxHelp = ref(false)
const showNewMenu = ref(false)

const { editorContent, currentFilePath, mode, openFileDialog: baseOpenFileDialog, openFromTree, newFile, saveFile, onContentChange } =
  useEditorFile({
    workDir: computed(() => props.workDir),
    onFileOpen: (p) => emit('file-open', p),
    onSaveStatus: (s) => emit('save-status', s),
    refreshTree: () => fileTreeRef.value?.refresh(),
    isActive: computed(() => props.isActive)
  })

const editableExtensions = []

function handleNewFile(type) {
  newFile(type)
  showNewMenu.value = false
  showPreview.value = false
}

// 成功打开非纯文本文件时自动展开预览（取消/失败不动），规则单一来源
function showPreviewIfOpened(opened) {
  if (opened && mode.value !== 'plaintext') showPreview.value = true
}

async function openFileDialog() {
  showPreviewIfOpened(await baseOpenFileDialog())
}

async function handleOpenFromTree(filePath) {
  showPreviewIfOpened(await openFromTree(filePath))
}

// ── 滚动同步 ─────────────────────────────────────────────
let scrollSyncing = false

function onEditorScroll() {
  if (scrollSyncing || !showPreview.value) return
  scrollSyncing = true

  const textarea = editorRef.value?.textareaRef
  if (!textarea) { scrollSyncing = false; return }

  if (mode.value === 'markdown') {
    // 双向：编辑 → 预览 DOM
    const previewEl = previewRef.value?.previewEl
    if (previewEl) {
      const ratio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight || 1)
      previewEl.scrollTop = ratio * (previewEl.scrollHeight - previewEl.clientHeight || 1)
    }
  } else {
    // 单向：编辑 → iframe body
    const iframeDoc = previewRef.value?.iframeRef?.contentDocument ||
      previewRef.value?.iframeRef?.contentWindow?.document
    if (iframeDoc?.body) {
      const ratio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight || 1)
      iframeDoc.body.scrollTop = ratio * (iframeDoc.body.scrollHeight - iframeDoc.body.clientHeight || 1)
    }
  }

  requestAnimationFrame(() => { scrollSyncing = false })
}

function onPreviewScroll() {
  // 仅 markdown 模式做预览→编辑反向同步
  if (mode.value !== 'markdown') return
  if (scrollSyncing || !showEditor.value) return
  scrollSyncing = true

  const textarea = editorRef.value?.textareaRef
  const previewEl = previewRef.value?.previewEl
  if (textarea && previewEl) {
    const ratio = previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight || 1)
    textarea.scrollTop = ratio * (textarea.scrollHeight - textarea.clientHeight || 1)
  }

  requestAnimationFrame(() => { scrollSyncing = false })
}

// 追踪当前已绑定的预览元素，便于切换前移除旧监听
let previewScrollEl = null

// immediate 保证首次挂载即绑定；showPreview 关闭或 mode 切换时先移除再重绑
watch([showPreview, mode], ([preview]) => {
  if (previewScrollEl) {
    previewScrollEl.removeEventListener('scroll', onPreviewScroll)
    previewScrollEl = null
  }
  if (preview) {
    nextTick(() => {
      const el = previewRef.value?.previewEl
      if (el) {
        el.addEventListener('scroll', onPreviewScroll)
        previewScrollEl = el
      }
    })
  }
}, { immediate: true })

// ── Markdown 专属导出 ─────────────────────────────────────

function getExportBaseName() {
  if (currentFilePath.value) {
    const name = currentFilePath.value.split('/').pop()
    return name.replace(/\.(md|html|htm)$/i, '')
  }
  return 'untitled'
}

async function exportHTML() {
  const marked = await getMarked()
  const html = marked.parse(editorContent.value)
  const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Export</title></head><body>${html}</body></html>`
  await dialogSaveFile(full, `${getExportBaseName()}.html`, { name: 'HTML', extensions: ['html'] }, props.workDir)
}

async function exportPDF() {
  const marked = await getMarked()
  const html = marked.parse(editorContent.value)
  const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Export</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;padding:40px;max-width:800px;margin:0 auto;}h1,h2,h3{margin-top:1em;}pre{background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;}code{background:#f5f5f5;padding:2px 6px;border-radius:3px;}blockquote{border-left:4px solid #007acc;padding-left:16px;color:#666;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;}</style></head><body>${html}</body></html>`
  const result = await window.electronAPI.exportPDF(full, `${getExportBaseName()}.pdf`)
  if (result.success) emit('save-status', 'PDF 已导出')
}
</script>

<style scoped>
.editor-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.new-btn-wrap {
  position: relative;
}

.new-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  background: var(--surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  min-width: 130px;
  box-shadow: var(--shadow-soft);
  margin-top: 6px;
  overflow: hidden;
}

.new-menu-item {
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.new-menu-item:hover {
  background: var(--surface-hover);
}

.content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}

.file-list {
  flex: 0 0 clamp(220px, 24vw, 280px);
  min-width: 220px;
  border-right: 1px solid var(--border-color);
  border-top: none;
  border-bottom: none;
  border-left: none;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-container {
  flex: 1;
  display: flex;
  min-width: 0;
  min-height: 0;
}

.editor-container.with-preview {
  flex: 1 1 50%;
  min-width: 320px;
}

.preview-container {
  flex: 1 1 50%;
  min-width: 320px;
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  min-height: 0;
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

@media (max-width: 1040px) {
  .content.has-preview.has-file-list.has-editor {
    display: grid;
    grid-template-columns: minmax(220px, 260px) minmax(360px, 1fr);
    grid-template-rows: minmax(0, 1fr) minmax(220px, 38%);
    overflow: hidden;
  }

  .content.has-preview.has-file-list.has-editor .file-list {
    grid-row: 1 / 3;
    height: 100%;
  }

  .content.has-preview.has-file-list.has-editor .editor-container.with-preview {
    grid-column: 2;
    grid-row: 1;
    min-width: 0;
  }

  .content.has-preview.has-file-list.has-editor .preview-container {
    grid-column: 2;
    grid-row: 2;
    min-width: 0;
    border-left: none;
    border-top: 1px solid var(--border-color);
  }
}

@media (max-width: 860px) {
  .toolbar {
    gap: 6px;
  }

  .toolbar button {
    padding-left: 9px;
    padding-right: 9px;
  }
}

@media (max-width: 760px) {
  .content,
  .content.has-preview.has-file-list.has-editor {
    display: flex;
    flex-direction: column;
    overflow: auto;
  }

  .file-list {
    flex: 0 0 220px;
    min-width: 0;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }

  .editor-container.with-preview,
  .preview-container {
    min-width: 0;
    flex: 0 0 320px;
  }

  .preview-container {
    border-left: none;
    border-top: 1px solid var(--border-color);
  }
}
</style>
