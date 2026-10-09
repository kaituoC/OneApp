<template>
  <div class="editor-tab tool-page">
    <div class="toolbar tool-command-bar">
      <div class="view-controls panel-toggles" role="group" aria-label="显示面板">
        <span class="panel-toggles-label">显示面板</span>
        <button :class="{ active: showFileList }" :aria-pressed="showFileList" title="显示或隐藏文件列表" @click="showFileList = !showFileList">列表</button>
        <button :class="{ active: showEditor }" :aria-pressed="showEditor" title="显示或隐藏编辑区" @click="showEditor = !showEditor">编辑</button>
        <button
          v-if="mode !== 'plaintext'"
          :class="{ active: showPreview }"
          :aria-pressed="showPreview"
          title="显示或隐藏预览区"
          @click="showPreview = !showPreview"
        >预览</button>
      </div>
      <button @click="openFileDialog">
        <FolderOpen :size="15" aria-hidden="true" />
        打开文件
      </button>
      <OverflowMenu label="新建" :items="NEW_FILE_ITEMS" @select="handleNewFile" />
      <button class="primary" @click="saveFile()" :disabled="saving">
        <Save :size="15" aria-hidden="true" />
        保存
      </button>
      <button @click="saveFile({as:true})" :disabled="saving">另存为…</button>
      <OverflowMenu v-if="dirtyFiles.length" :label="`未保存文件（${dirtyFiles.length}）`" :items="dirtyFileItems" @select="openDirtyFile" />
      <button :aria-pressed="wrapLines" @click="wrapLines = !wrapLines">{{ wrapLines ? '自动换行' : '不换行' }}</button>
      <button @click="resetLayout">重置布局</button>
      <button v-if="dataToolTarget" @click="openInDataTool" title="在数据工具中打开当前文件内容">
        在数据工具中打开
      </button>
      <OverflowMenu
        v-if="mode === 'markdown'"
        label="更多"
        :items="MARKDOWN_ACTIONS"
        @select="handleMarkdownAction"
      />
    </div>

    <div ref="workspaceRef"
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
      <aside v-if="showFileList" class="file-list tool-panel" :style="{flexBasis:fileWidth + 'px'}">
        <FileTree
          ref="fileTreeRef"
          :root-path="workDir"
          :editable-extensions="editableExtensions"
          :active-path="currentFilePath"
          @open-file="handleOpenFromTree"
        />
      </aside>

      <div v-if="showFileList && (showEditor || visiblePreview)" class="editor-divider" tabindex="0" role="separator" aria-orientation="vertical" aria-label="目录宽度" :aria-valuenow="Math.round(fileWidth)" :aria-valuemin="160" :aria-valuemax="Math.round(maxFileWidth)" @pointerdown="startResize($event, 'files')" @keydown="resizeKey($event, 'files')"></div>
      <div v-if="showEditor" :class="['editor-container', { 'with-preview': visiblePreview }]" :style="visiblePreview ? {flex: `${editorRatio} 1 0`} : {}">
        <div class="editor-pane-heading"><strong>编辑</strong><span :title="currentFilePath">{{ currentFilePath.split(/[\\/]/).pop() || '未命名文档' }}</span></div>
        <EditorWithLineNumbers
          ref="editorRef"
          v-model="editorContent"
          :font-size="fontSize"
          label="文档编辑内容"
          :wrap="wrapLines"
          @update:model-value="onContentChange"
          @scroll="onEditorScroll"
        />
      </div>

      <div v-if="showEditor && visiblePreview" class="editor-divider" tabindex="0" role="separator" aria-orientation="vertical" aria-label="编辑与预览宽度" :aria-valuenow="Math.round(editorRatio * 100)" aria-valuemin="20" aria-valuemax="80" @pointerdown="startResize($event, 'editor')" @keydown="resizeKey($event, 'editor')"></div>
      <section :style="showEditor ? {flex: `${1-editorRatio} 1 0`} : {}" v-if="showPreview && mode !== 'plaintext'" :class="['preview-container', { 'full-width': !showEditor }]">
        <div class="editor-pane-heading"><strong>预览</strong><span>{{ mode === 'html' ? 'HTML' : 'Markdown' }} · 实时更新</span></div>
        <component :is="mode === 'html' ? HtmlPreview : MarkdownPreview" ref="previewRef" :content="editorContent" class="preview-content" />
      </section>

      <div v-if="!showEditor && (!showPreview || mode === 'plaintext')" class="empty-area">
        <span>点击工具栏按钮显示内容</span>
      </div>
    </div>

    <SyntaxHelpModal v-if="showSyntaxHelp" @close="showSyntaxHelp = false" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted, onMounted } from 'vue'
import { FolderOpen, Save } from 'lucide-vue-next'
import { useEditorFile } from '../composables/useEditorFile.js'
import { useSendTo } from '../composables/useSendTo.js'
import { saveFile as dialogSaveFile } from '../utils/fileHelper.js'

import { safeMarkdown } from '../utils/safeMarkdown.js'
import EditorWithLineNumbers from './EditorWithLineNumbers.vue'
import MarkdownPreview from './MarkdownPreview.vue'
import HtmlPreview from './HtmlPreview.vue'
import FileTree from './FileTree.vue'
import SyntaxHelpModal from './SyntaxHelpModal.vue'
import OverflowMenu from './OverflowMenu.vue'

const NEW_FILE_ITEMS = [
  { key: 'markdown', label: '新建 Markdown' },
  { key: 'html', label: '新建 HTML' },
  { key: 'plaintext', label: '新建纯文本' }
]

const MARKDOWN_ACTIONS = [
  { key: 'html', label: '导出 HTML' },
  { key: 'pdf', label: '导出 PDF' },
  { key: 'help', label: 'Markdown 语法介绍' }
]

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
const exporting = ref(false)

const { editorContent, currentFilePath, mode, dirtyFiles, saving, prepareClose, openFileDialog: baseOpenFileDialog, openFromTree, newFile, saveFile, onContentChange } =
  useEditorFile({
    workDir: computed(() => props.workDir),
    onFileOpen: (p) => emit('file-open', p),
    onSaveStatus: (s) => emit('save-status', s),
    refreshTree: () => fileTreeRef.value?.refresh(),
    isActive: computed(() => props.isActive)
  })

const { sendTo } = useSendTo()

const DATA_TOOL_MAP = {
  json: 'json', xml: 'xml', sql: 'sql',
  yaml: 'yaml', yml: 'yaml', csv: 'csv'
}

const dataToolTarget = computed(() => {
  if (!currentFilePath.value) return null
  const ext = currentFilePath.value.split('.').pop()?.toLowerCase()
  return DATA_TOOL_MAP[ext] || null
})

function openInDataTool() {
  if (!dataToolTarget.value) return
  sendTo('json', editorContent.value, dataToolTarget.value)
}

const editableExtensions = []

async function handleNewFile(type) {
  if (await newFile(type)) showPreview.value = type !== 'plaintext'
}

function handleMarkdownAction(action) {
  if (action === 'html') exportHTML()
  else if (action === 'pdf') exportPDF()
  else if (action === 'help') showSyntaxHelp.value = true
}

// 成功打开非纯文本文件时自动展开预览（取消/失败不动），规则单一来源
function showPreviewIfOpened(opened) {
  if (opened && mode.value !== 'plaintext') showPreview.value = true
}

async function openFileDialog() {
  const opened = await baseOpenFileDialog()
  showPreviewIfOpened(opened)
  return opened
}

async function handleOpenFromTree(filePath) {
  const opened = await openFromTree(filePath)
  showPreviewIfOpened(opened)
  return opened
}

const workspaceRef = ref(null), workspaceWidth = ref(1000), fileWidth = ref(200), editorRatio = ref(0.5), wrapLines = ref(true)
const visiblePreview = computed(() => showPreview.value && mode.value !== 'plaintext')
const maxFileWidth = computed(() => Math.max(160, workspaceWidth.value - (showEditor.value ? 220 : 0) - (visiblePreview.value ? 220 : 0) - 12))
const dirtyFileItems = computed(() => dirtyFiles.value.map((d, index) => ({key:String(index),label:d.path || d.name})))
function openDirtyFile(index) { const file = dirtyFiles.value[Number(index)]; if (file?.path) handleOpenFromTree(file.path) }
watch(mode, value => { wrapLines.value = value !== 'html' })
function resetLayout() { fileWidth.value = 200; editorRatio.value = 0.5; showFileList.value = true; showEditor.value = true; showPreview.value = true }
function adjustLayout(kind, delta) {
  if (kind === 'files') fileWidth.value = Math.max(160, Math.min(maxFileWidth.value, fileWidth.value + delta))
  else { const available = workspaceWidth.value - (showFileList.value ? fileWidth.value : 0) - 12; const min = Math.min(0.5, 220 / available); editorRatio.value = Math.max(min, Math.min(1-min, editorRatio.value + delta / available)) }
}
function resizeKey(event, kind) {
  if (event.key === 'Home') { event.preventDefault(); if (kind === 'files') fileWidth.value = 200; else editorRatio.value = 0.5 }
  else if (['ArrowLeft','ArrowRight'].includes(event.key)) { event.preventDefault(); adjustLayout(kind, event.key === 'ArrowLeft' ? -20 : 20) }
}
let stopResize = null, observer
function startResize(event, kind) {
  if (event.button !== 0) return
  event.preventDefault(); stopResize?.()
  const target = event.currentTarget; target.focus(); let x = event.clientX
  target.setPointerCapture(event.pointerId)
  const move = e => { adjustLayout(kind,e.clientX-x); x=e.clientX }
  const stop = () => { target.removeEventListener('pointermove',move); target.removeEventListener('pointerup',stop); target.removeEventListener('pointercancel',stop); stopResize = null }
  target.addEventListener('pointermove',move); target.addEventListener('pointerup',stop); target.addEventListener('pointercancel',stop); stopResize=stop
}
onMounted(() => { if (typeof ResizeObserver === 'undefined') return; observer = new ResizeObserver(entries => { if (entries[0].contentRect.width <= 0) return; workspaceWidth.value = entries[0].contentRect.width; fileWidth.value = Math.min(fileWidth.value,maxFileWidth.value) }); observer.observe(workspaceRef.value) })
onUnmounted(() => { observer?.disconnect(); stopResize?.() })
async function executeEditorCommand(id) {
  if (id === 'open') return openFileDialog()
  if (id === 'new') { const opened = await newFile('markdown'); if (opened) {showEditor.value = true; showPreview.value = true} return opened }
  if (id === 'save-as') return saveFile({as:true})
  if (id === 'save') return saveFile()
  return false
}
defineExpose({prepareClose,hasDirtyDraft:path => dirtyFiles.value.some(file => file.path === path),openFromPath:handleOpenFromTree,executeCommand:executeEditorCommand,focusEditor:() => {showEditor.value = true; nextTick(() => editorRef.value?.textareaRef?.focus())}})

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

onUnmounted(() => previewScrollEl?.removeEventListener('scroll', onPreviewScroll))

// ── Markdown 专属导出 ─────────────────────────────────────

function getExportBaseName() {
  if (currentFilePath.value) {
    const name = currentFilePath.value.split('/').pop()
    return name.replace(/\.(md|html|htm)$/i, '')
  }
  return 'untitled'
}

async function exportHTML() {
  if (exporting.value) return
  exporting.value = true
  const html = safeMarkdown(editorContent.value)
  const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none'; base-uri 'none';"><title>Export · 静态内容</title></head><body>${html}</body></html>`
  try {
  const path = await dialogSaveFile(full, `${getExportBaseName()}.html`, { name: 'HTML', extensions: ['html'] }, props.workDir)
  if (path) emit('save-status', 'HTML 已导出（静态内容）')
  } catch (e) { await window.electronAPI.showMessageBox({type:'error',message:'HTML 导出失败',detail:e.message}) }
  finally { exporting.value = false }
}

async function exportPDF() {
  if (exporting.value) return
  exporting.value = true
  try {
  const html = safeMarkdown(editorContent.value)
  const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none'; base-uri 'none';"><title>Export · 静态内容</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;padding:40px;max-width:800px;margin:0 auto;}h1,h2,h3{margin-top:1em;}pre{background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;}code{background:#f5f5f5;padding:2px 6px;border-radius:3px;}blockquote{border-left:4px solid #007acc;padding-left:16px;color:#666;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;}</style></head><body>${html}</body></html>`
  const result = await window.electronAPI.exportPDF(full, `${getExportBaseName()}.pdf`)
  if (result.success) emit('save-status', 'PDF 已导出')
  else if (!result.canceled) await window.electronAPI.showMessageBox({type:'error',message:'PDF 导出失败',detail:result.error})
  } catch (error) { await window.electronAPI.showMessageBox({type:'error',message:'PDF 导出失败',detail:error.message}) }
  finally { exporting.value = false }
}
</script>

<style scoped>
.editor-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-toggles {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--surface-subtle);
}

.panel-toggles-label {
  padding: 0 5px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
}

.panel-toggles button {
  min-height: 26px;
  padding: 3px 8px;
  background: transparent;
  border-color: transparent;
}

.panel-toggles button.active {
  color: var(--accent);
  background: var(--accent-soft);
  border-color: var(--accent-border);
}

.content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}

.file-list {
  flex: 0 0 clamp(224px, 18vw, 256px);
  min-width: 160px;
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
  flex-direction: column;
  flex: 1;
  display: flex;
  min-width: 0;
  min-height: 0;
}

.editor-container.with-preview {
  flex: 1 1 50%;
  min-width: 200px;
}

.preview-container {
  flex: 1 1 50%;
  min-width: 200px;
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

.editor-pane-heading{display:flex;gap:12px;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border-color);font-size:12px;background:var(--surface);min-height:44px;flex:none}
.editor-pane-heading span{color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.content {border:1px solid var(--border-color);border-radius:10px;overflow-x:auto;}
@media(max-width:900px){.file-list{flex-basis:210px;min-width:160px}.panel-toggles-label{display:none}.toolbar{gap:5px}.toolbar button{padding-left:8px;padding-right:8px}}
.preview-content{flex:1;min-height:0;min-width:0;border-left:0;background:var(--surface);overflow:auto;}
.editor-divider{flex:0 0 6px;background:var(--border-color);cursor:col-resize;touch-action:none}.editor-divider:hover,.editor-divider:focus-visible{background:var(--accent)}
</style>
