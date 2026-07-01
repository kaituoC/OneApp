<template>
  <div class="text-tab">
    <nav class="tool-menu" aria-label="文本处理工具">
      <button
        v-for="item in TOOLS"
        :key="item.key"
        :class="['menu-item', { active: tool === item.key }]"
        @click="setTool(item.key)"
      >
        <component :is="item.icon" :size="15" aria-hidden="true" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <section class="work-area tool-workspace" :style="{ fontSize: fontSize + 'px' }">
      <div class="toolbar tool-command-bar">
        <template v-if="tool === 'case'">
          <button
            v-for="option in CASE_OPTIONS"
            :key="option.key"
            :class="{ primary: option.key === 'title' }"
            @click="runCase(option.key)"
          >
            {{ option.label }}
          </button>
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
        <span class="toolbar-spacer"></span>
        <button @click="copyResult" :disabled="!output">复制结果</button>
        <button @click="clearAll">清空</button>
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
            <span :class="['tool-status-chip', hasError ? 'error' : output ? 'success' : '']">
              {{ statusChip }}
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

      <div class="status-bar" :class="{ 'status-error': hasError, empty: !statusMessage }">
        {{ statusMessage || emptyStatusText }}
      </div>
    </section>

    <div v-if="copyMessage" class="tool-copy-toast">{{ copyMessage }}</div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ArrowDownAZ, CaseSensitive, ListChecks, Pilcrow } from 'lucide-vue-next'
import EditorWithLineNumbers from './EditorWithLineNumbers.vue'
import { useCopyToast } from '../composables/useCopyToast.js'
import {
  getTextStats,
  convertTextCase,
  sortLines,
  dedupeLines
} from '../utils/textHelper.js'

defineProps({
  fontSize: { type: Number, default: 14 }
})

const TOOLS = [
  { key: 'stats', label: '统计', icon: Pilcrow },
  { key: 'case', label: '大小写', icon: CaseSensitive },
  { key: 'sort', label: '排序', icon: ArrowDownAZ },
  { key: 'dedupe', label: '去重', icon: ListChecks }
]

const CASE_OPTIONS = [
  { key: 'upper', label: '大写' },
  { key: 'lower', label: '小写' },
  { key: 'title', label: '首字母大写' },
  { key: 'camel', label: 'camelCase' },
  { key: 'pascal', label: 'PascalCase' },
  { key: 'snake', label: 'snake_case' },
  { key: 'kebab', label: 'kebab-case' }
]

const tool = ref('stats')
const input = ref('')
const output = ref('')
const statusMessage = ref('')
const hasError = ref(false)
const dedupeSummary = ref(null)
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
const emptyStatusText = computed(() => {
  if (tool.value === 'stats') return '等待输入文本'
  return '选择操作后生成结果'
})

function setTool(nextTool) {
  tool.value = nextTool
  output.value = ''
  statusMessage.value = ''
  hasError.value = false
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
    output.value = result.result
    statusMessage.value = successMessage
    hasError.value = false
  } else {
    output.value = result.error
    statusMessage.value = result.error
    hasError.value = true
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
  output.value = ''
  statusMessage.value = ''
  hasError.value = false
  dedupeSummary.value = null
}
</script>

<style scoped>
.text-tab {
  display: flex;
  height: 100%;
  background: var(--bg-primary);
}

.tool-menu {
  display: flex;
  flex-direction: column;
  width: 150px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color);
  background: var(--bg-secondary);
  padding: 12px 8px;
  gap: 4px;
}

.menu-item {
  justify-content: flex-start;
  gap: 8px;
  padding: 9px 10px;
  color: var(--text-secondary);
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
}

.menu-item:hover {
  color: var(--text-primary);
  background: var(--surface-hover);
}

.menu-item.active {
  color: var(--text-primary);
  border-color: var(--accent-border);
  background: var(--accent-soft);
}

.work-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.toolbar-spacer {
  flex: 1;
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
  min-height: 44px;
  border-bottom: 1px solid var(--border-subtle);
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

.status-bar {
  flex: none;
  padding: 6px 12px;
  color: var(--success);
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  font-size: 12px;
}

.status-bar.empty {
  color: var(--text-muted);
}

.status-error {
  color: var(--error);
}

@media (max-width: 900px) {
  .text-tab {
    flex-direction: column;
  }

  .tool-menu {
    width: auto;
    flex-direction: row;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
    padding: 8px;
  }

  .menu-item {
    flex: 0 0 auto;
    white-space: nowrap;
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
