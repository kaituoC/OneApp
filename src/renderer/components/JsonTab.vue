<template>
  <div class="json-tab">
    <div class="toolbar tool-command-bar">
      <div class="mode-toggle tool-segmented" aria-label="数据格式">
        <button :class="{ active: mode === 'json' }" @click="setMode('json')">JSON</button>
        <button :class="{ active: mode === 'yaml' }" @click="setMode('yaml')">YAML</button>
      </div>
      <div class="toolbar-separator"></div>
      <template v-if="mode === 'json'">
        <button class="primary" @click="doFormat">格式化</button>
        <button @click="doMinify">压缩</button>
        <button @click="doValidate">校验</button>
        <button @click="doUnescape">去除转义</button>
        <button @click="doJsonToYaml">转 YAML</button>
      </template>
      <template v-else>
        <button class="primary" @click="doYamlToJson">转 JSON</button>
        <button @click="doValidateYaml">校验</button>
      </template>
      <span class="toolbar-spacer"></span>
      <button @click="copyResult">复制结果</button>
      <button @click="clearAll">清空</button>
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
        <EditorWithLineNumbers
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
import EditorWithLineNumbers from './EditorWithLineNumbers.vue'
import { useCopyToast } from '../composables/useCopyToast.js'

const props = defineProps({
  fontSize: { type: Number, default: 14 }
})

const mode = ref('json')
const input = ref('')
const output = ref('')
const statusMessage = ref('')
const hasError = ref(false)
const { copyMessage, copyToClipboard } = useCopyToast()

const inputTitle = computed(() => `${mode.value.toUpperCase()} 输入`)
const outputTitle = computed(() => `${mode.value === 'json' ? 'JSON / YAML' : 'YAML / JSON'} 输出`)
const inputPlaceholder = computed(() =>
  mode.value === 'json' ? '在此粘贴 JSON 内容...' : '在此粘贴 YAML 内容...'
)
const emptyStatusText = computed(() =>
  mode.value === 'json' ? '等待输入 JSON 内容' : '等待输入 YAML 内容'
)

function setMode(nextMode) {
  mode.value = nextMode
  output.value = ''
  statusMessage.value = ''
  hasError.value = false
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

function doYamlToJson() {
  const result = yamlToJSON(input.value)
  handleResult(result)
}

function doValidateYaml() {
  const result = validateYAML(input.value)
  handleResult(result)
}

function handleResult(result, successMessage = '处理成功') {
  if (result.success) {
    output.value = result.result || result.message
    statusMessage.value = result.message || successMessage
    hasError.value = false
  } else {
    output.value = result.displayMessage
    statusMessage.value = result.displayMessage
    hasError.value = true
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
