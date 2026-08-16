<template>
  <div class="text-tab tool-page">
    <section class="work-area tool-workspace" :style="{ fontSize: fontSize + 'px' }">
      <div class="toolbar tool-command-bar">
        <template v-if="tool === 'case'">
          <button class="primary" @click="runCase('upper')">大写</button>
          <OverflowMenu label="更多转换" :items="caseSecondaryActions" @select="runCase" />
        </template>
        <template v-else-if="tool === 'sort'">
          <button class="primary" @click="runSort('asc')">A-Z</button>
          <button @click="runSort('desc')">Z-A</button>
        </template>
        <template v-else-if="tool === 'dedupe'">
          <button class="primary" @click="runDedupe">按行去重</button>
        </template>
        <template v-else>
          <span class="toolbar-note">实时统计</span>
        </template>
      </div>

      <div class="content">
        <div class="panel tool-panel">
          <div class="panel-header tool-panel-header">
            <span class="tool-panel-title">输入文本</span>
            <span class="tool-panel-meta">{{ stats.characters.toLocaleString() }} 字符</span>
          </div>
          <EditorWithLineNumbers
            v-model="input"
            :font-size="fontSize"
            placeholder="在此粘贴待处理文本..."
          />
        </div>

        <div class="panel tool-panel">
          <div class="panel-header tool-panel-header">
            <span class="tool-panel-title">{{ outputTitle }}</span>
            <span class="tool-panel-actions">
              <span :class="['tool-status-chip', hasError ? 'error' : output || tool === 'stats' ? 'success' : '']" role="status" aria-live="polite">
                {{ statusChip }}
              </span>
              <button v-if="tool !== 'stats'" @click="copyResult" :disabled="!output || hasError">复制</button>
              <button @click="clearAll" :disabled="!input && !output">清空</button>
            </span>
          </div>

          <div v-if="tool === 'stats'" class="stats-grid">
            <div v-for="item in statItems" :key="item.key" class="stat-row">
              <span class="stat-label">{{ item.label }}</span>
              <strong class="stat-value">{{ item.value.toLocaleString() }}</strong>
            </div>
          </div>
          <template v-else>
            <EditorWithLineNumbers
              v-model="output"
              :font-size="fontSize"
              readonly
              :class="{ 'error-output': hasError }"
            />
            <div v-if="dedupeSummary && tool === 'dedupe'" class="result-summary">
              原始 {{ dedupeSummary.originalLines.toLocaleString() }} 行 ·
              保留 {{ dedupeSummary.remainingLines.toLocaleString() }} 行 ·
              移除 {{ dedupeSummary.removedLines.toLocaleString() }} 行
            </div>
          </template>
        </div>
      </div>

    </section>

    <div v-if="copyMessage" class="tool-copy-toast">{{ copyMessage }}</div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import EditorWithLineNumbers from './EditorWithLineNumbers.vue'
import OverflowMenu from './OverflowMenu.vue'
import { useCopyToast } from '../composables/useCopyToast.js'
import { useToolResult } from '../composables/useToolResult.js'
import {
  getTextStats,
  convertTextCase,
  sortLines,
  dedupeLines
} from '../utils/textHelper.js'

const props = defineProps({
  fontSize: { type: Number, default: 14 },
  // 子工具由左侧 nav 驱动（统计/大小写/排序/去重）
  subTool: { type: String, default: 'stats' }
})

const CASE_OPTIONS = [
  { key: 'upper', label: '大写' },
  { key: 'lower', label: '小写' },
  { key: 'title', label: '首字母大写' },
  { key: 'camel', label: 'camelCase' },
  { key: 'pascal', label: 'PascalCase' },
  { key: 'snake', label: 'snake_case' },
  { key: 'kebab', label: 'kebab-case' }
]
const caseSecondaryActions = CASE_OPTIONS
  .filter((option) => option.key !== 'upper')

const tool = ref(props.subTool)
watch(
  () => props.subTool,
  (next) => {
    if (next && next !== tool.value) setTool(next)
  }
)
const input = ref('')
const dedupeSummary = ref(null)
const { output, statusMessage, hasError, reset, setSuccess, setError } = useToolResult()
const { copyMessage, copyToClipboard } = useCopyToast()

const stats = computed(() => getTextStats(input.value))
const statItems = computed(() => [
  { key: 'characters', label: '字符数', value: stats.value.characters },
  { key: 'words', label: '字数', value: stats.value.words },
  { key: 'lines', label: '行数', value: stats.value.lines },
  { key: 'nonEmptyLines', label: '非空行数', value: stats.value.nonEmptyLines },
  { key: 'bytes', label: 'UTF-8 字节数', value: stats.value.bytes }
])

const outputTitle = computed(() => (tool.value === 'stats' ? '统计结果' : '输出结果'))
const statusChip = computed(() => {
  if (hasError.value) return '错误'
  if (tool.value === 'stats') return '实时'
  return output.value ? '就绪' : '待处理'
})

function setTool(nextTool) {
  tool.value = nextTool
  reset()
  dedupeSummary.value = null
}

function runCase(type) {
  const result = convertTextCase(input.value, type)
  handleResult(result, '转换完成')
}

function runSort(direction) {
  const result = sortLines(input.value, direction)
  handleResult(result, direction === 'asc' ? '已按 A-Z 排序' : '已按 Z-A 排序')
}

function runDedupe() {
  const result = dedupeLines(input.value)
  dedupeSummary.value = result.summary
  handleResult(result, `去重完成，移除 ${result.summary.removedLines.toLocaleString()} 行`)
}

function handleResult(result, successMessage) {
  if (result.success) {
    setSuccess(result.result, successMessage)
  } else {
    setError(result.error)
    dedupeSummary.value = null
  }
}

async function copyResult() {
  if (output.value && await copyToClipboard(output.value)) {
    statusMessage.value = '已复制到剪贴板'
  }
}

function clearAll() {
  input.value = ''
  reset()
  dedupeSummary.value = null
}
</script>

<style scoped>
.text-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}

.work-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.toolbar-note {
  color: var(--text-muted);
  font-size: 12px;
}

.content {
  flex: 1;
  display: flex;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
  padding: 12px;
}

.panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0;
  padding: 12px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 88px;
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--surface-subtle);
}

.stat-label {
  color: var(--text-secondary);
  font-size: 13px;
}

.stat-value {
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 18px;
}

.result-summary {
  flex: none;
  padding: 8px 10px;
  border-top: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 12px;
}

.error-output .editor-textarea {
  color: var(--error) !important;
}

@media (max-width: 900px) {
  .text-tab {
    flex-direction: column;
  }
}

@media (max-width: 760px) {
  .content {
    flex-direction: column;
    overflow: auto;
  }

  .panel {
    flex: 0 0 280px;
  }
}
</style>
