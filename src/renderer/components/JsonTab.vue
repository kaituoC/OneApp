<template>
  <div class="json-tab">
    <div class="toolbar tool-command-bar">
      <div class="mode-toggle tool-segmented" aria-label="数据格式">
        <button :class="{ active: mode === 'json' }" @click="setMode('json')">JSON</button>
        <button :class="{ active: mode === 'yaml' }" @click="setMode('yaml')">YAML</button>
        <button :class="{ active: mode === 'csv' }" @click="setMode('csv')">CSV</button>
        <button :class="{ active: mode === 'sql' }" @click="setMode('sql')">SQL</button>
        <button :class="{ active: mode === 'xml' }" @click="setMode('xml')">XML</button>
      </div>
      <div class="toolbar-separator"></div>
      <template v-if="mode === 'json'">
        <button class="primary" @click="doFormat">格式化</button>
        <button @click="doMinify">压缩</button>
        <button @click="doValidate">校验</button>
        <button @click="doUnescape">去除转义</button>
        <button @click="doJsonToYaml">转 YAML</button>
        <button @click="doJsonPathQuery">JSONPath 查询</button>
      </template>
      <template v-else-if="mode === 'yaml'">
        <button class="primary" @click="doYamlToJson">转 JSON</button>
        <button @click="doValidateYaml">校验</button>
      </template>
      <template v-else-if="mode === 'csv'">
        <button class="primary" @click="doCsvToJson">CSV 转 JSON</button>
        <button @click="doJsonToCsv">JSON 转 CSV</button>
        <button @click="doPreviewCsv">表格预览</button>
      </template>
      <template v-else-if="mode === 'sql'">
        <button class="primary" @click="doFormatSql">格式化</button>
        <button @click="doMinifySql">压缩</button>
      </template>
      <template v-else>
        <button class="primary" @click="doFormatXml">格式化</button>
        <button @click="doMinifyXml">压缩</button>
      </template>
      <span class="toolbar-spacer"></span>
      <button @click="copyResult">复制结果</button>
      <button @click="clearAll">清空</button>
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

    <div class="content tool-workspace">
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
          <span :class="['tool-status-chip', hasError ? 'error' : 'success']">
            {{ hasError ? '错误' : (output ? '就绪' : '待处理') }}
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

    <div class="status-bar" :class="{ 'status-error': hasError, empty: !statusMessage }">
      {{ statusMessage || emptyStatusText }}
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
import EditorWithLineNumbers from './EditorWithLineNumbers.vue'
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
const emptyStatusText = computed(() =>
  ({
    json: '等待输入 JSON 内容',
    yaml: '等待输入 YAML 内容',
    csv: '等待输入 CSV 或 JSON 对象数组',
    sql: '等待输入 SQL 内容',
    xml: '等待输入 XML 内容'
  }[mode.value])
)

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
.toolbar-spacer {
  flex: 1;
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
  display: flex;
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
.status-bar {
  padding: 6px 12px;
  font-size: 12px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  color: var(--success);
}
.status-bar.empty {
  color: var(--text-muted);
}
.status-error {
  color: var(--error);
}

@media (max-width: 860px) {
  .toolbar-spacer {
    display: none;
  }

  .content {
    flex-direction: column;
    overflow: auto;
  }

  .panel {
    min-height: 280px;
  }
}
</style>
