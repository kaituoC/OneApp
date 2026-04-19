<template>
  <footer class="status-bar">
    <span class="status-item">
      {{ activeTab === 'markdown' ? (currentFile || '无文件') : tabNames[activeTab] }}
    </span>
    <span class="status-right">
      OneApp v{{ version }} | {{ buildDate }}
    </span>
  </footer>
</template>

<script setup>
const version = __APP_VERSION__
const buildDate = __BUILD_DATE__

defineProps({
  currentFile: { type: String, default: '' },
  activeTab: { type: String, required: true }
})

const tabNames = {
  markdown: 'Markdown编辑',
  json: 'JSON工具',
  diff: '文本对比',
  time: '时间工具',
  settings: '设置'
}
</script>

<style scoped>
.status-bar {
  background: var(--accent);
  color: white;
  padding: 2px 12px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  height: 24px;
  align-items: center;
}
.status-right {
  opacity: 0.85;
}
</style>
