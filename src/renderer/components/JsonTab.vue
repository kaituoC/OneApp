<template>
  <div class="json-tab">
    <div class="toolbar tool-command-bar">
      <button @click="doFormat">格式化</button>
      <button @click="doMinify">压缩</button>
      <button @click="doValidate">校验</button>
      <button @click="doUnescape">去除转义</button>
      <span class="toolbar-spacer"></span>
      <button @click="copyResult">复制结果</button>
      <button @click="clearAll">清空</button>
    </div>

    <div class="content">
      <div class="panel">
        <div class="panel-header">
          <span>输入</span>
          <span class="panel-meta">{{ input.length.toLocaleString() }} 字符</span>
        </div>
        <EditorWithLineNumbers
          v-model="input"
          :font-size="fontSize"
          placeholder="在此粘贴 JSON 内容..."
        />
      </div>
      <div class="panel">
        <div class="panel-header">
          <span>输出</span>
          <span :class="['status-chip', hasError ? 'error' : 'success']">
            {{ hasError ? '错误' : (output ? '就绪' : '待处理') }}
          </span>
        </div>
        <EditorWithLineNumbers
          v-model="output"
          :font-size="fontSize"
          readonly
          :class="{ 'error-output': hasError }"
        />
      </div>
    </div>

    <div class="status-bar" :class="{ 'status-error': hasError, empty: !statusMessage }">
      {{ statusMessage || '等待输入 JSON 内容' }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { formatJSON, minifyJSON, validateJSON, unescapeJSON } from '../utils/jsonHelper.js'
import EditorWithLineNumbers from './EditorWithLineNumbers.vue'

const props = defineProps({
  fontSize: { type: Number, default: 14 }
})

const input = ref('')
const output = ref('')
const statusMessage = ref('')
const hasError = ref(false)

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

function handleResult(result) {
  if (result.success) {
    output.value = result.result || result.message
    statusMessage.value = '✓ 处理成功'
    hasError.value = false
  } else {
    output.value = result.displayMessage
    statusMessage.value = result.displayMessage
    hasError.value = true
  }
}

async function copyResult() {
  if (output.value) {
    await navigator.clipboard.writeText(output.value)
    statusMessage.value = '✓ 已复制到剪贴板'
  }
}

function clearAll() {
  input.value = ''
  output.value = ''
  statusMessage.value = ''
  hasError.value = false
}
</script>

<style scoped>
.json-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.toolbar-spacer {
  flex: 1;
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
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.panel + .panel {
  border-left: 1px solid var(--border-color);
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--surface-raised);
  border-bottom: 1px solid var(--border-subtle);
  font-weight: 700;
}
.panel-meta {
  color: var(--text-faint);
  font-family: var(--font-mono);
}
.status-chip {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  background: var(--surface-subtle);
  color: var(--text-muted);
}
.status-chip.success {
  background: var(--success-soft);
  color: var(--success);
}
.status-chip.error {
  background: var(--error-soft);
  color: var(--error);
}
.error-output .editor-textarea {
  color: var(--error) !important;
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

  .panel + .panel {
    border-left: 1px solid var(--border-color);
  }
}
</style>
