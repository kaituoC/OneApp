<template>
  <div class="diff-tab">
    <div class="toolbar">
      <button @click="compare" :disabled="!textA && !textB">对比</button>
      <button @click="loadFileA">加载文件A</button>
      <button @click="loadFileB">加载文件B</button>
      <button @click="swapTexts">交换</button>
      <button @click="clearAll">清空</button>
      <div class="toolbar-separator"></div>
      <div class="mode-toggle">
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

    <div class="main-area">
      <!-- 输入区域 -->
      <div v-if="!showDiff" class="input-area">
        <div class="panel">
          <div class="panel-header">文本 A (原文)</div>
          <EditorWithLineNumbers
            v-model="textA"
            :font-size="fontSize"
            placeholder="输入或加载文本 A..."
          />
        </div>
        <div class="panel">
          <div class="panel-header">文本 B (新文)</div>
          <EditorWithLineNumbers
            v-model="textB"
            :font-size="fontSize"
            placeholder="输入或加载文本 B..."
          />
        </div>
      </div>

      <!-- 并排对比模式 -->
      <div v-else-if="viewMode === 'split'" class="split-view">
        <div class="diff-panel left" ref="leftPanel">
          <div class="diff-panel-header">
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
        <div class="diff-panel right" ref="rightPanel">
          <div class="diff-panel-header">
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
      <div v-else class="unified-view">
        <div class="diff-header">
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

.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 8px;
}

.mode-toggle {
  display: flex;
  gap: 0;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.mode-toggle button {
  border: none;
  border-radius: 0;
  padding: 4px 12px;
  background: transparent;
}

.mode-toggle button:first-child {
  border-radius: 3px 0 0 3px;
}

.mode-toggle button:last-child {
  border-radius: 0 3px 3px 0;
  border-left: 1px solid var(--border-color);
}

.mode-toggle button.active {
  background: var(--accent);
  color: white;
}

.main-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.input-area {
  flex: 1;
  display: flex;
}

.panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.panel + .panel {
  border-left: 1px solid var(--border-color);
}

.panel-header {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

/* 并排对比模式 */
.split-view {
  flex: 1;
  display: flex;
  overflow: hidden;
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

.diff-panel-header {
  display: flex;
  justify-content: space-between;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
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

.diff-header {
  display: flex;
  justify-content: space-between;
  padding: 6px 12px;
  font-size: 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
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
</style>