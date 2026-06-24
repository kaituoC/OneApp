<template>
  <footer class="status-bar">
    <span class="status-item">
      {{ statusLabel }}
    </span>
    <span class="status-right">
      OneApp v{{ version }} | {{ buildDate }}
    </span>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { TAB_BY_KEY } from '../utils/navigation.js'

const version = __APP_VERSION__
const buildDate = __BUILD_DATE__

const props = defineProps({
  currentFile: { type: String, default: '' },
  activeTab: { type: String, required: true }
})

const statusLabel = computed(() => {
  if (props.activeTab === 'editor') return props.currentFile || '无文件'
  return TAB_BY_KEY[props.activeTab]?.label || '未知工具'
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
.status-right {
  flex: none;
  opacity: 0.72;
}
</style>
