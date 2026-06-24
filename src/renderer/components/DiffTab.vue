<template>
  <div class="diff-tab">
    <div class="toolbar tool-command-bar">
      <button class="primary" @click="compare" :disabled="!textA && !textB">对比</button>
      <button @click="loadFileA">加载文件A</button>
      <button @click="loadFileB">加载文件B</button>
      <button @click="swapTexts">交换</button>
      <button @click="clearAll">清空</button>
      <div class="toolbar-separator"></div>
      <div class="mode-toggle tool-segmented">
        <button
          :class="{ active: viewMode === 'split' }"
          @click="viewMode = 'split'"
          title="并排对比"
        >并排</button>
        <button
          :class="{ active: viewMode === 'unified' }"
          @click="viewMode = 'unified'"
          title="统一差异"
        >统一</button>
      </div>
    </div>

    <div v-if="showDiff" class="diff-summary">
      <span class="tool-status-chip success">新增 +{{ stats.added }}</span>
      <span class="tool-status-chip error">删除 -{{ stats.removed }}</span>
      <span class="tool-status-chip warning">修改 ~{{ stats.modified }}</span>
      <span class="summary-mode">{{ viewMode === 'split' ? '并排视图' : '统一视图' }}</span>
    </div>

    <div class="main-area tool-workspace">
      <!-- 输入区域 -->
      <div v-if="!showDiff" class="input-area">
        <div class="panel tool-panel">
          <div class="panel-header tool-panel-header">文本 A (原文)</div>
          <EditorWithLineNumbers
            v-model="textA"
            :font-size="fontSize"
            placeholder="输入或加载文本 A..."
          />
        </div>
        <div class="panel tool-panel">
          <div class="panel-header tool-panel-header">文本 B (新文)</div>
          <EditorWithLineNumbers
            v-model="textB"
            :font-size="fontSize"
            placeholder="输入或加载文本 B..."
          />
        </div>
      </div>

      <!-- 并排对比模式 -->
      <div v-else-if="viewMode === 'split'" class="split-view">
        <div class="diff-panel tool-panel left" ref="leftPanel">
          <div class="diff-panel-header tool-panel-header">
            <span>原文</span>
            <span class="line-count">{{ textA.split('\n').filter(l=>l).length }} 行</span>
          </div>
          <div class="diff-panel-content" ref="leftContent" @scroll="onScrollLeft">
            <div
              v-for="(item, index) in diffSplitResult"
              :key="index"
              :class="['diff-line', item.left.type]"
            >
              <span class="line-num">{{ item.left.lineNum || '' }}</span>
              <span class="line-prefix">{{ leftPrefix(item.left.type) }}</span>
              <span class="line-text">{{ item.left.text || ' ' }}</span>
            </div>
          </div>
        </div>
        <div class="diff-panel tool-panel right" ref="rightPanel">
          <div class="diff-panel-header tool-panel-header">
            <span>新文</span>
            <span class="line-count">{{ textB.split('\n').filter(l=>l).length }} 行</span>
          </div>
          <div class="diff-panel-content" ref="rightContent" @scroll="onScrollRight">
            <div
              v-for="(item, index) in diffSplitResult"
              :key="index"
              :class="['diff-line', item.right.type]"
            >
              <span class="line-num">{{ item.right.lineNum || '' }}</span>
              <span class="line-prefix">{{ rightPrefix(item.right.type) }}</span>
              <span class="line-text">{{ item.right.text || ' ' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 统一差异模式 -->
      <div v-else class="unified-view tool-panel">
        <div class="diff-header tool-panel-header">
          <span>差异结果</span>
          <span class="stats">
            +{{ stats.added }} -{{ stats.removed }} ~{{ stats.modified }}
          </span>
        </div>
        <div class="unified-content">
          <div
            v-for="(item, index) in diffUnifiedResult"
            :key="index"
            :class="['diff-line', item.type]"
          >
            <span class="line-num">{{ index + 1 }}</span>
            <span class="line-prefix">{{ linePrefix(item.type) }}</span>
            <span class="line-text">{{ item.text || ' ' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { diffTextUnified, diffTextSplit, diffStats } from '../utils/diffHelper.js'
import { readFile, openFile } from '../utils/fileHelper.js'
import EditorWithLineNumbers from './EditorWithLineNumbers.vue'

const props = defineProps({
  fontSize: { type: Number, default: 14 },
  workDir: { type: String, default: '' }
})

const textA = ref('')
const textB = ref('')
const viewMode = ref('split') // 'split' | 'unified'
const showDiff = ref(false)

const diffSplitResult = ref([])
const diffUnifiedResult = ref([])
const stats = ref({ added: 0, removed: 0, modified: 0 })

const leftPanel = ref(null)
const rightPanel = ref(null)
const leftContent = ref(null)
const rightContent = ref(null)
let syncing = false

function compare() {
  diffSplitResult.value = diffTextSplit(textA.value, textB.value)
  diffUnifiedResult.value = diffTextUnified(textA.value, textB.value)
  stats.value = diffStats(diffSplitResult.value, 'split')
  showDiff.value = true
}

async function loadFileA() {
  const filePath = await openFile(props.workDir)
  if (filePath) {
    textA.value = await readFile(filePath)
  }
}

async function loadFileB() {
  const filePath = await openFile(props.workDir)
  if (filePath) {
    textB.value = await readFile(filePath)
  }
}

function swapTexts() {
  const temp = textA.value
  textA.value = textB.value
  textB.value = temp
  if (showDiff.value) compare()
}

function clearAll() {
  textA.value = ''
  textB.value = ''
  showDiff.value = false
  diffSplitResult.value = []
  diffUnifiedResult.value = []
  stats.value = { added: 0, removed: 0, modified: 0 }
}

function leftPrefix(type) {
  if (type === 'remove') return '-'
  return ' '
}

function rightPrefix(type) {
  if (type === 'add') return '+'
  return ' '
}

function linePrefix(type) {
  if (type === 'add') return '+'
  if (type === 'remove') return '-'
  return ' '
}

// 同步滚动（纵向和横向）
function onScrollLeft() {
  if (syncing) return
  syncing = true
  rightContent.value.scrollTop = leftContent.value.scrollTop
  rightContent.value.scrollLeft = leftContent.value.scrollLeft
  setTimeout(() => syncing = false, 50)
}

function onScrollRight() {
  if (syncing) return
  syncing = true
  leftContent.value.scrollTop = rightContent.value.scrollTop
  leftContent.value.scrollLeft = rightContent.value.scrollLeft
  setTimeout(() => syncing = false, 50)
}

// 文本变化时自动重新对比
watch([textA, textB], () => {
  if (showDiff.value && (textA.value || textB.value)) {
    compare()
  }
})
</script>

<style scoped>
.diff-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 8px;
}

.diff-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 12px;
  color: var(--text-muted);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.summary-mode {
  color: var(--text-muted);
  font-size: 12px;
}

.main-area {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 12px;
  min-height: 0;
}

.input-area {
  flex: 1;
  display: flex;
  gap: 12px;
  min-width: 0;
}

.panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 并排对比模式 */
.split-view {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: 12px;
}

.diff-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  flex-grow: 0;
}

.diff-panel + .diff-panel {
  border-left: 1px solid var(--border-color);
}

.line-count {
  font-size: 11px;
  opacity: 0.7;
}

.diff-panel-content {
  flex: 1;
  overflow: auto;
  font-family: var(--font-mono);
  font-size: 13px;
  background: var(--bg-primary);
}

/* 统一差异模式 */
.unified-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.unified-content {
  flex: 1;
  overflow: auto;
  font-family: var(--font-mono);
  font-size: 13px;
  background: var(--bg-primary);
}

.stats {
  color: var(--text-secondary);
}

/* 差异行样式 */
.diff-line {
  display: flex;
  padding: 1px 4px;
  white-space: pre;
  line-height: 1.5;
  min-height: 20px;
  min-width: max-content;
}

.line-num {
  width: 40px;
  min-width: 40px;
  text-align: right;
  color: var(--text-secondary);
  opacity: 0.6;
  font-size: 12px;
  padding: 0 12px;
  user-select: none;
}

.line-prefix {
  width: 16px;
  text-align: center;
  font-weight: bold;
  user-select: none;
}

.line-text {
  white-space: pre;
  min-width: max-content;
}

.diff-line.equal {
  background: transparent;
  color: var(--text-primary);
}

.diff-line.add {
  background: var(--diff-add);
  color: var(--success);
}

.diff-line.remove {
  background: var(--diff-remove);
  color: var(--error);
}

.diff-line.empty {
  background: var(--bg-tertiary);
}

.diff-line.modify {
  background: var(--diff-modify);
  color: var(--warning);
}

@media (max-width: 900px) {
  .main-area {
    overflow: auto;
  }

  .input-area,
  .split-view {
    flex-direction: column;
    min-height: max-content;
  }

  .panel,
  .diff-panel {
    width: 100%;
    min-height: 260px;
  }

  .diff-panel {
    flex: 0 0 300px;
  }

  .toolbar-separator {
    display: none;
  }
}
</style>
