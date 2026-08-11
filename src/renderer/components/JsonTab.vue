<template>
  <div class="json-tab tool-page">
    <div class="toolbar tool-command-bar">
      <div class="mode-toggle tool-segmented" role="radiogroup" aria-label="数据格式" @keydown="handleSegmentedKeydown">
        <button
          v-for="item in MODES"
          :key="item.key"
          role="radio"
          :aria-checked="mode === item.key"
          :class="{ active: mode === item.key }"
          @click="setMode(item.key)"
        >{{ item.label }}</button>
      </div>
      <button class="primary" @click="runPrimaryAction">{{ primaryAction.label }}</button>
      <OverflowMenu :items="secondaryActions" @select="runSecondaryAction" />
    </div>
    <div v-if="mode === 'json'" class="jsonpath-bar">
      <label for="jsonpath-expression">JSONPath</label>
      <input
        id="jsonpath-expression"
        v-model="jsonPathExpression"
        type="text"
        spellcheck="false"
        placeholder="$.items[0].name 或 $..id"
      />
    </div>

    <div class="content tool-workspace tool-grid-split">
      <div class="panel tool-panel">
        <div class="panel-header tool-panel-header">
          <span class="tool-panel-title">{{ inputTitle }}</span>
          <span class="tool-panel-meta">{{ input.length.toLocaleString() }} 字符</span>
        </div>
        <EditorWithLineNumbers
          v-model="input"
          :font-size="fontSize"
          :placeholder="inputPlaceholder"
        />
      </div>
      <div class="panel tool-panel">
        <div class="panel-header tool-panel-header">
          <span class="tool-panel-title">{{ outputTitle }}</span>
          <span class="tool-panel-actions">
            <span :class="['tool-status-chip', hasError ? 'error' : hasResult ? 'success' : '']" role="status" aria-live="polite">
              {{ resultStatus }}
            </span>
            <button @click="copyResult" :disabled="!output || hasError">复制</button>
            <button @click="clearAll" :disabled="!input && !hasResult">清空</button>
          </span>
        </div>
        <div v-if="tablePreview" class="csv-preview-wrap">
          <table class="csv-preview-table">
            <thead>
              <tr>
                <th v-for="(header, headerIndex) in tablePreview.headers" :key="headerIndex">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in tablePreview.rows" :key="rowIndex">
                <td v-for="(cell, cellIndex) in row" :key="`${rowIndex}-${cellIndex}`">{{ cell }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else-if="jsonPathMatches.length" class="jsonpath-result-layout">
          <div class="jsonpath-result-list" aria-label="JSONPath 查询结果">
            <div
              v-for="(match, matchIndex) in jsonPathMatches"
              :key="`${match.path}-${matchIndex}`"
              class="jsonpath-result-item"
            >
              <span class="jsonpath-result-index">{{ matchIndex + 1 }}</span>
              <span class="jsonpath-result-path">{{ match.path }}</span>
              <span class="jsonpath-result-summary">{{ match.summary }}</span>
            </div>
          </div>
          <EditorWithLineNumbers
            v-model="output"
            :font-size="fontSize"
            readonly
            :class="{ 'error-output': hasError }"
          />
        </div>
        <EditorWithLineNumbers
          v-else
          v-model="output"
          :font-size="fontSize"
          readonly
          :class="{ 'error-output': hasError }"
        />
      </div>
    </div>

    <div v-if="copyMessage" class="tool-copy-toast">{{ copyMessage }}</div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  formatJSON,
  minifyJSON,
  validateJSON,
  unescapeJSON,
  jsonToYAML,
  yamlToJSON,
  validateYAML
} from '../utils/jsonHelper.js'
import {
  csvToJson,
  jsonToCsv,
  previewCsvTable
} from '../utils/csvHelper.js'
import {
  formatSQL,
  minifySQL,
  formatXML,
  minifyXML
} from '../utils/formatHelper.js'
import { queryJSONPath } from '../utils/jsonPathHelper.js'
import { handleSegmentedKeydown } from '../utils/segmentedControl.js'
import EditorWithLineNumbers from './EditorWithLineNumbers.vue'
import OverflowMenu from './OverflowMenu.vue'
import { useCopyToast } from '../composables/useCopyToast.js'
import { useToolResult } from '../composables/useToolResult.js'

defineProps({
  fontSize: { type: Number, default: 14 }
})

const mode = ref('json')
const input = ref('')
const jsonPathExpression = ref('$')
const jsonPathMatches = ref([])
const tablePreview = ref(null)
const { output, statusMessage, hasError, reset, setSuccess, setError } = useToolResult()
const { copyMessage, copyToClipboard } = useCopyToast()

const MODES = [
  { key: 'json', label: 'JSON' },
  { key: 'yaml', label: 'YAML' },
  { key: 'csv', label: 'CSV' },
  { key: 'sql', label: 'SQL' },
  { key: 'xml', label: 'XML' }
]

const ACTIONS = {
  json: {
    primary: { key: 'format', label: '格式化' },
    secondary: [
      { key: 'minify', label: '压缩' },
      { key: 'validate', label: '校验' },
      { key: 'unescape', label: '去除转义' },
      { key: 'to-yaml', label: '转 YAML' },
      { key: 'jsonpath', label: 'JSONPath 查询' }
    ]
  },
  yaml: { primary: { key: 'to-json', label: '转 JSON' }, secondary: [{ key: 'validate-yaml', label: '校验' }] },
  csv: { primary: { key: 'csv-to-json', label: 'CSV 转 JSON' }, secondary: [{ key: 'json-to-csv', label: 'JSON 转 CSV' }, { key: 'preview-csv', label: '表格预览' }] },
  sql: { primary: { key: 'format-sql', label: '格式化' }, secondary: [{ key: 'minify-sql', label: '压缩' }] },
  xml: { primary: { key: 'format-xml', label: '格式化' }, secondary: [{ key: 'minify-xml', label: '压缩' }] }
}

const inputTitle = computed(() => `${mode.value.toUpperCase()} 输入`)
const outputTitle = computed(() => {
  if (tablePreview.value) return 'CSV 表格预览'
  if (mode.value === 'json') return 'JSON / YAML 输出'
  if (mode.value === 'yaml') return 'YAML / JSON 输出'
  if (mode.value === 'csv') return 'CSV / JSON 输出'
  return `${mode.value.toUpperCase()} 输出`
})
const inputPlaceholder = computed(() =>
  ({
    json: '在此粘贴 JSON 内容...',
    yaml: '在此粘贴 YAML 内容...',
    csv: '在此粘贴 CSV 内容，或粘贴 JSON 对象数组后转 CSV...',
    sql: '在此粘贴 SQL 内容...',
    xml: '在此粘贴 XML 内容...'
  }[mode.value])
)
const primaryAction = computed(() => ACTIONS[mode.value].primary)
const secondaryActions = computed(() => ACTIONS[mode.value].secondary)
const hasResult = computed(() => Boolean(output.value || tablePreview.value || jsonPathMatches.value.length || statusMessage.value))
const resultStatus = computed(() => {
  if (hasError.value) return '错误'
  if (hasResult.value) return '就绪'
  return input.value ? '选择操作' : '等待输入'
})

function runPrimaryAction() {
  runAction(primaryAction.value.key)
}

function runSecondaryAction(action) {
  runAction(action)
}

function runAction(action) {
  const handlers = {
    format: doFormat,
    minify: doMinify,
    validate: doValidate,
    unescape: doUnescape,
    'to-yaml': doJsonToYaml,
    jsonpath: doJsonPathQuery,
    'to-json': doYamlToJson,
    'validate-yaml': doValidateYaml,
    'csv-to-json': doCsvToJson,
    'json-to-csv': doJsonToCsv,
    'preview-csv': doPreviewCsv,
    'format-sql': doFormatSql,
    'minify-sql': doMinifySql,
    'format-xml': doFormatXml,
    'minify-xml': doMinifyXml
  }
  handlers[action]?.()
}

function setMode(nextMode) {
  mode.value = nextMode
  reset()
  jsonPathMatches.value = []
  tablePreview.value = null
}

function doFormat() {
  const result = formatJSON(input.value)
  handleResult(result)
}

function doMinify() {
  const result = minifyJSON(input.value)
  handleResult(result)
}

function doValidate() {
  const result = validateJSON(input.value)
  handleResult(result)
}

function doUnescape() {
  const result = unescapeJSON(input.value)
  handleResult(result)
}

function doJsonToYaml() {
  const result = jsonToYAML(input.value)
  handleResult(result)
}

function doJsonPathQuery() {
  const result = queryJSONPath(input.value, jsonPathExpression.value)
  handleResult(result)
  jsonPathMatches.value = result.success ? result.matches || [] : []
}

function doYamlToJson() {
  const result = yamlToJSON(input.value)
  handleResult(result)
}

function doValidateYaml() {
  const result = validateYAML(input.value)
  handleResult(result)
}

function doCsvToJson() {
  const result = csvToJson(input.value)
  handleResult(result)
}

function doJsonToCsv() {
  const result = jsonToCsv(input.value)
  handleResult(result)
}

function doPreviewCsv() {
  const result = previewCsvTable(input.value)
  if (result.success) {
    tablePreview.value = result.table
    setSuccess('', result.message)
  } else {
    tablePreview.value = null
    setError(result.displayMessage)
  }
}

function doFormatSql() {
  handleResult(formatSQL(input.value))
}

function doMinifySql() {
  handleResult(minifySQL(input.value))
}

function doFormatXml() {
  handleResult(formatXML(input.value))
}

function doMinifyXml() {
  handleResult(minifyXML(input.value))
}

function handleResult(result, successMessage = '处理成功') {
  tablePreview.value = null
  jsonPathMatches.value = []
  if (result.success) {
    setSuccess(result.result || result.message, result.message || successMessage)
  } else {
    setError(result.displayMessage)
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
  jsonPathExpression.value = '$'
  jsonPathMatches.value = []
  tablePreview.value = null
}
</script>

<style scoped>
.json-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.jsonpath-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}
.jsonpath-bar label {
  flex: 0 0 auto;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}
.jsonpath-bar input {
  flex: 1;
  min-width: 0;
  padding: 7px 9px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  background: var(--bg-primary);
  font-family: var(--font-mono);
  font-size: 12px;
}
.jsonpath-bar input:focus {
  border-color: var(--accent);
  outline: none;
  box-shadow: var(--focus-ring);
}
.content {
  flex: 1;
  overflow: hidden;
  gap: 12px;
  padding: 12px;
}
.panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.error-output .editor-textarea {
  color: var(--error) !important;
}
.csv-preview-wrap {
  flex: 1;
  overflow: auto;
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
}
.jsonpath-result-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  background: var(--bg-primary);
}
.jsonpath-result-list {
  flex: 0 0 auto;
  max-height: 136px;
  overflow: auto;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
}
.jsonpath-result-item {
  display: grid;
  grid-template-columns: 32px minmax(160px, 1fr) minmax(120px, 1fr);
  gap: 8px;
  align-items: center;
  padding: 7px 10px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 12px;
  border-bottom: 1px solid var(--border-subtle);
}
.jsonpath-result-item:last-child {
  border-bottom: none;
}
.jsonpath-result-index {
  color: var(--text-muted);
  text-align: right;
}
.jsonpath-result-path,
.jsonpath-result-summary {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.jsonpath-result-path {
  color: var(--accent);
}
.jsonpath-result-summary {
  color: var(--text-primary);
}
.csv-preview-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 12px;
}
.csv-preview-table th,
.csv-preview-table td {
  max-width: 280px;
  padding: 7px 9px;
  border: 1px solid var(--border-subtle);
  text-align: left;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.csv-preview-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  color: var(--text-primary);
  background: var(--bg-tertiary);
}
@media (max-width: 900px) {
  .content {
    overflow: auto;
  }

  .panel {
    min-height: 280px;
  }
}
</style>
