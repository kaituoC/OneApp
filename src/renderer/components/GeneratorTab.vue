<template>
  <div class="generator-tab">
    <nav class="tool-menu" aria-label="生成器工具">
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
        <button class="primary" @click="runGenerate">生成</button>
        <span class="toolbar-spacer"></span>
        <button v-if="tool === 'qr'" @click="downloadQrPng" :disabled="!qrImage || hasError">下载 PNG</button>
        <button v-if="tool === 'qr'" @click="copyQrPng" :disabled="!qrImage || hasError">复制 PNG</button>
        <button v-else @click="copyResult" :disabled="!output || hasError">复制结果</button>
        <button @click="clearOutput" :disabled="!output && !statusMessage">清空</button>
      </div>

      <div class="content">
        <div class="panel tool-panel config-panel">
          <div class="panel-header tool-panel-header">
            <span class="tool-panel-title">{{ activeTool.label }} 设置</span>
            <span class="tool-panel-meta">{{ activeTool.summary }}</span>
          </div>

          <div v-if="tool === 'uuid'" class="form-grid">
            <label class="field-row">
              <span>生成数量</span>
              <input v-model.number="uuidCount" type="number" min="1" max="1000" />
            </label>
            <p class="field-hint">支持 1-1000 个 UUID v4，批量结果每行一个。</p>
          </div>

          <div v-else-if="tool === 'password'" class="form-grid">
            <label class="field-row">
              <span>密码长度</span>
              <input v-model.number="passwordOptions.length" type="number" min="1" max="128" />
            </label>
            <div class="checkbox-grid">
              <label><input v-model="passwordOptions.useLowercase" type="checkbox" /> 小写字母</label>
              <label><input v-model="passwordOptions.useUppercase" type="checkbox" /> 大写字母</label>
              <label><input v-model="passwordOptions.useDigits" type="checkbox" /> 数字</label>
              <label><input v-model="passwordOptions.useSymbols" type="checkbox" /> 符号</label>
              <label><input v-model="passwordOptions.excludeSimilar" type="checkbox" /> 排除易混字符</label>
            </div>
          </div>

          <div v-else-if="tool === 'lorem'" class="form-grid">
            <label class="field-row">
              <span>生成类型</span>
              <select v-model="loremOptions.mode">
                <option value="words">词</option>
                <option value="sentences">句</option>
                <option value="paragraphs">段</option>
              </select>
            </label>
            <label class="field-row">
              <span>生成数量</span>
              <input v-model.number="loremOptions.count" type="number" min="1" :max="loremLimit" />
            </label>
            <p class="field-hint">{{ loremHint }}</p>
          </div>

          <div v-else class="form-grid">
            <label class="field-stack">
              <span>文本或 URL</span>
              <textarea
                v-model="qrOptions.text"
                rows="5"
                placeholder="输入要编码进二维码的文本或 URL"
              ></textarea>
            </label>
            <label class="field-row">
              <span>尺寸</span>
              <input v-model.number="qrOptions.size" type="number" min="128" max="1024" step="32" />
            </label>
            <label class="field-row">
              <span>纠错级别</span>
              <select v-model="qrOptions.errorCorrectionLevel">
                <option value="L">L</option>
                <option value="M">M</option>
                <option value="Q">Q</option>
                <option value="H">H</option>
              </select>
            </label>
            <p class="field-hint">尺寸范围 128-1024，纠错级别越高越耐遮挡但图案更密。</p>
          </div>
        </div>

        <div class="panel tool-panel output-panel">
          <div class="panel-header tool-panel-header">
            <span class="tool-panel-title">生成结果</span>
            <span :class="['tool-status-chip', hasError ? 'error' : output ? 'success' : '']">
              {{ statusChip }}
            </span>
          </div>
          <div v-if="qrImage && !hasError" class="qr-preview">
            <img :src="qrImage" alt="二维码预览" />
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
    </section>

    <div v-if="copyMessage" class="tool-copy-toast">{{ copyMessage }}</div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { FileText, KeyRound, QrCode, Shuffle } from 'lucide-vue-next'
import EditorWithLineNumbers from './EditorWithLineNumbers.vue'
import { useCopyToast } from '../composables/useCopyToast.js'
import {
  generateUuidV4,
  generatePassword,
  generateLorem,
  generateQrCode
} from '../utils/generatorHelper.js'

defineProps({
  fontSize: { type: Number, default: 14 }
})

const TOOLS = [
  { key: 'uuid', label: 'UUID', summary: 'v4 / 批量', icon: Shuffle },
  { key: 'password', label: '随机密码', summary: '长度 / 字符集', icon: KeyRound },
  { key: 'lorem', label: 'Lorem', summary: '词 / 句 / 段', icon: FileText },
  { key: 'qr', label: '二维码', summary: '文本 / PNG', icon: QrCode }
]

const LOREM_LIMITS = {
  words: 1000,
  sentences: 200,
  paragraphs: 50
}

const tool = ref('uuid')
const uuidCount = ref(1)
const passwordOptions = reactive({
  length: 16,
  useLowercase: true,
  useUppercase: true,
  useDigits: true,
  useSymbols: true,
  excludeSimilar: true
})
const loremOptions = reactive({
  mode: 'paragraphs',
  count: 1
})
const qrOptions = reactive({
  text: '',
  size: 256,
  errorCorrectionLevel: 'M'
})
const output = ref('')
const qrImage = ref('')
const statusMessage = ref('')
const hasError = ref(false)
const { copyMessage, copyToClipboard } = useCopyToast()

const activeTool = computed(() => TOOLS.find((item) => item.key === tool.value) || TOOLS[0])
const loremLimit = computed(() => LOREM_LIMITS[loremOptions.mode] || 1)
const loremHint = computed(() => {
  if (loremOptions.mode === 'words') return '词数范围 1-1000。'
  if (loremOptions.mode === 'sentences') return '句数范围 1-200。'
  return '段数范围 1-50，每段包含 3 句。'
})
const statusChip = computed(() => {
  if (hasError.value) return '错误'
  return output.value ? '就绪' : '待生成'
})
const emptyStatusText = computed(() => `${activeTool.value.label} 等待生成`)

function setTool(nextTool) {
  tool.value = nextTool
  clearOutput()
}

async function runGenerate() {
  if (tool.value === 'uuid') {
    handleResult(generateUuidV4({ count: uuidCount.value }))
    return
  }
  if (tool.value === 'password') {
    handleResult(generatePassword(passwordOptions))
    return
  }
  if (tool.value === 'qr') {
    handleResult(await generateQrCode(qrOptions))
    return
  }
  handleResult(generateLorem(loremOptions))
}

function handleResult(result) {
  qrImage.value = ''
  if (result.success) {
    output.value = result.result
    if (tool.value === 'qr') qrImage.value = result.dataUrl
    statusMessage.value = result.message
    hasError.value = false
    return
  }
  output.value = result.error
  statusMessage.value = result.error
  hasError.value = true
}

async function copyResult() {
  if (!output.value || hasError.value) return
  if (await copyToClipboard(output.value)) {
    statusMessage.value = '已复制到剪贴板'
  }
}

function downloadQrPng() {
  if (!qrImage.value || hasError.value) return
  const link = document.createElement('a')
  link.href = qrImage.value
  link.download = 'oneapp-qrcode.png'
  link.click()
  statusMessage.value = '已下载 PNG'
}

async function copyQrPng() {
  if (!qrImage.value || hasError.value) return
  try {
    const response = await fetch(qrImage.value)
    const blob = await response.blob()
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob })
    ])
    statusMessage.value = '已复制 PNG 到剪贴板'
  } catch {
    statusMessage.value = '复制 PNG 失败'
  }
}

function clearOutput() {
  output.value = ''
  qrImage.value = ''
  statusMessage.value = ''
  hasError.value = false
}
</script>

<style scoped>
.generator-tab {
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

.content {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
  gap: 12px;
  min-height: 0;
  overflow: hidden;
  padding: 12px;
}

.panel {
  min-width: 0;
}

.config-panel {
  display: flex;
  flex-direction: column;
}

.output-panel {
  display: flex;
  flex-direction: column;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
}

.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 13px;
}

.field-row input,
.field-row select,
.field-stack textarea {
  min-width: 120px;
  padding: 7px 9px;
  color: var(--text-primary);
  background: var(--surface-raised);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font: inherit;
}

.field-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.field-stack textarea {
  min-width: 0;
  resize: vertical;
  min-height: 112px;
  font: inherit;
  line-height: 1.5;
}

.checkbox-grid {
  display: grid;
  gap: 10px;
}

.checkbox-grid label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.field-hint {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.qr-preview {
  display: grid;
  flex: 1;
  min-height: 0;
  place-items: center;
  padding: 24px;
  background: var(--bg-primary);
}

.qr-preview img {
  width: min(100%, 420px);
  max-height: 100%;
  object-fit: contain;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: #fff;
  padding: 12px;
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
  .generator-tab {
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
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .config-panel,
  .output-panel {
    min-height: 260px;
  }
}
</style>
