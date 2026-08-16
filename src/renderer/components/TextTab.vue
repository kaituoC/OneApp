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
      </div>

      <div class="content">
        <div class="panel tool-panel">
          <div class="panel-header tool-panel-header">
            <span class="tool-panel-title">输入文本</span>
            <span class="tool-panel-meta">{{ stats.characters.toLocaleString() }} 字符 · {{ stats.words.toLocaleString() }} 词 · {{ stats.lines.toLocaleString() }} 行</span>
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
              <span :class="['tool-status-chip', hasError ? 'error' : output ? 'success' : '']" role="status" aria-live="polite">
                {{ statusChip }}
              </span>
              <button @click="copyResult" :disabled="!output || hasError">复制</button>
              <OverflowMenu v-if="output && !hasError" label="发送到" :items="sendTargets" @select="handleSendTo" />
              <button @click="clearAll" :disabled="!input && !output">清空</button>
            </span>
          </div>

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
        </div>
      </div>

    </section>

    <div v-if="copyMessage" class="tool-copy-toast">{{ copyMessage }}</div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import EditorWithLineNumbers from './EditorWithLineNumbers.vue'
import OverflowMenu from './OverflowMenu.vue'
import { useCopyToast } from '../composables/useCopyToast.js'
import { useToolResult } from '../composables/useToolResult.js'
import { useSendTo, getSendTargets, usePendingInput } from '../composables/useSendTo.js'
import {
  getTextStats,
  convertTextCase,
  sortLines,
  dedupeLines
} from '../utils/textHelper.js'

const VALID_TOOLS = ['case', 'sort', 'dedupe']

const props = defineProps({
  fontSize: { type: Number, default: 14 },
  subTool: { type: String, default: 'case' }
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

const tool = ref(VALID_TOOLS.includes(props.subTool) ? props.subTool : 'case')
watch(
  () => props.subTool,
  (next) => {
    const value = VALID_TOOLS.includes(next) ? next : 'case'
    if (value !== tool.value) setTool(value)
  }
)
const input = ref('')
const dedupeSummary = ref(null)
const { output, statusMessage, hasError, reset, setSuccess, setError } = useToolResult()
const { copyMessage, copyToClipboard } = useCopyToast()

const { sendTo } = useSendTo()
const sendTargets = computed(() => getSendTargets('text', tool.value))

function handleSendTo(key) {
  const [tabKey, subKey] = key.split('/')
  sendTo(tabKey, output.value, subKey || undefined)
}

const pendingInput = usePendingInput()
watch(pendingInput, (val) => {
  if (val && val.tabKey === 'text') {
    nextTick(() => {
      input.value = val.content
      pendingInput.value = null
    })
  }
})

const stats = ref({ characters: 0, words: 0, lines: 0, nonEmptyLines: 0, bytes: 0 })
let debounceTimer = null
watch(input, (val) => {
  if (!debounceTimer) stats.value = getTextStats(val)
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    stats.value = getTextStats(val)
    debounceTimer = null
  }, 150)
}, { immediate: true })

const outputTitle = '输出结果'
const statusChip = ref('待处理')
watch([hasError, output], () => {
  if (hasError.value) {
    statusChip.value = '错误'
  } else {
    statusChip.value = output.value ? '就绪' : '待处理'
  }
}, { immediate: true })

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
