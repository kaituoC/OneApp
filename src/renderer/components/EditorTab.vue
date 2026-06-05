<template>
  <div class="editor-tab">
    <div class="toolbar">
      <button @click="showFileList = !showFileList">{{ showFileList ? '隐藏列表' : '显示列表' }}</button>
      <button @click="showEditor = !showEditor">{{ showEditor ? '隐藏编辑' : '显示编辑' }}</button>
      <button @click="showPreview = !showPreview">{{ showPreview ? '隐藏预览' : '显示预览' }}</button>
      <button @click="openFileDialog">打开文件</button>
      <div class="new-btn-wrap">
        <button @click="showNewMenu = !showNewMenu">新建 ▾</button>
        <div v-if="showNewMenu" class="new-menu" @mouseleave="showNewMenu = false">
          <div class="new-menu-item" @click="handleNewFile('markdown')">新建 Markdown</div>
          <div class="new-menu-item" @click="handleNewFile('html')">新建 HTML</div>
        </div>
      </div>
      <button @click="saveFile">保存</button>
      <template v-if="mode === 'markdown'">
        <button @click="exportHTML">导出 HTML</button>
        <button @click="exportPDF">导出 PDF</button>
        <button @click="showSyntaxHelp = true">语法介绍</button>
      </template>
    </div>

    <div class="content">
      <aside v-if="showFileList" class="file-list">
        <FileTree
          ref="fileTreeRef"
          :root-path="workDir"
          :editable-extensions="editableExtensions"
          :active-path="currentFilePath"
          @open-file="openFromTree"
        />
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

      <component
        :is="mode === 'html' ? HtmlPreview : MarkdownPreview"
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
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
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
const showPreview = ref(true)
const showSyntaxHelp = ref(false)
const showNewMenu = ref(false)

const { editorContent, currentFilePath, mode, openFileDialog, openFromTree, newFile, saveFile, onContentChange } =
  useEditorFile({
    workDir: computed(() => props.workDir),
    onFileOpen: (p) => emit('file-open', p),
    onSaveStatus: (s) => emit('save-status', s),
    refreshTree: () => fileTreeRef.value?.refresh(),
    isActive: computed(() => props.isActive)
  })

const editableExtensions = ['md', 'html', 'htm']

function handleNewFile(type) {
  newFile(type)
  showNewMenu.value = false
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

.toolbar {
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
  align-items: center;
}

.new-btn-wrap {
  position: relative;
}

.new-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  min-width: 130px;
  box-shadow: 0 4px 12px rgba(0,0,0,.2);
  margin-top: 2px;
}

.new-menu-item {
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.new-menu-item:hover {
  background: var(--bg-tertiary);
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

.editor-container {
  flex: 1;
  display: flex;
  min-width: 0;
}

.editor-container.with-preview {
  width: 50%;
  flex: none;
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
