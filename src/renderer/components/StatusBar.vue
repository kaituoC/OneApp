<template>
  <footer class="status-bar">
    <span :class="['status-item', transientStatus.tone]" role="status" aria-live="polite">
      {{ statusLabel }}
    </span>
    <span class="status-right">
      OneApp v{{ version }} | {{ buildDate }}
    </span>
  </footer>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive } from 'vue'
import { TAB_BY_KEY } from '../utils/navigation.js'
import { TOOL_STATUS_EVENT } from '../utils/toolStatus.js'

const version = __APP_VERSION__
const buildDate = __BUILD_DATE__

const props = defineProps({
  currentFile: { type: String, default: '' },
  activeTab: { type: String, required: true }
})
const transientStatus = reactive({ message: '', tone: 'default' })
let clearTimer = null

const statusLabel = computed(() => {
  if (transientStatus.message) return transientStatus.message
  if (props.activeTab === 'editor') return props.currentFile || '无文件'
  return TAB_BY_KEY[props.activeTab]?.label || '未知工具'
})

function onToolStatus(event) {
  transientStatus.message = event.detail?.message || ''
  transientStatus.tone = event.detail?.tone || 'default'
  if (clearTimer) clearTimeout(clearTimer)
  clearTimer = setTimeout(() => {
    transientStatus.message = ''
    transientStatus.tone = 'default'
    clearTimer = null
  }, 3200)
}

onMounted(() => window.addEventListener(TOOL_STATUS_EVENT, onToolStatus))
onUnmounted(() => {
  window.removeEventListener(TOOL_STATUS_EVENT, onToolStatus)
  if (clearTimer) clearTimeout(clearTimer)
})
</script>

<style scoped>
.status-bar {
  background: var(--status-bar-bg);
  color: var(--status-bar-text);
  border-top: 1px solid var(--border-subtle);
  padding: 0 12px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  height: 24px;
  align-items: center;
}
.status-item {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status-item.success { color: var(--success); }
.status-item.error { color: var(--error); }
.status-right {
  flex: none;
  opacity: 0.72;
}
</style>
