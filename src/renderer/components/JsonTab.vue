<template>
  <div class="json-tab">
    <div class="toolbar">
      <button @click="doFormat">格式化</button>
      <button @click="doMinify">压缩</button>
      <button @click="doValidate">校验</button>
      <button @click="doUnescape">去除转义</button>
      <button @click="copyResult">复制结果</button>
      <button @click="clearAll">清空</button>
    </div>

    <div class="content">
      <div class="panel">
        <div class="panel-header">输入</div>
        <EditorWithLineNumbers
          v-model="input"
          :font-size="fontSize"
          placeholder="在此粘贴 JSON 内容..."
        />
      </div>
      <div class="panel">
        <div class="panel-header">输出</div>
        <EditorWithLineNumbers
          v-model="output"
          :font-size="fontSize"
          readonly
          :class="{ 'error-output': hasError }"
        />
      </div>
    </div>

    <div class="status-bar" :class="{ 'status-error': hasError }">
      {{ statusMessage }}
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
  gap: 4px;
  padding: 6px 8px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}
.content {
  flex: 1;
  display: flex;
  overflow: hidden;
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
  text-transform: uppercase;
}
.error-output .editor-textarea {
  color: var(--error) !important;
}
.status-bar {
  padding: 4px 12px;
  font-size: 12px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}
.status-error {
  color: var(--error);
}
</style>
