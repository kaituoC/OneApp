<template>
  <header class="header">
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab', { active: activeTab === tab.key }]"
        @click="$emit('tab-change', tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  activeTab: { type: String, required: true }
})

defineEmits(['tab-change'])

const tabs = [
  { key: 'markdown', label: 'Markdown编辑' },
  { key: 'json', label: 'JSON工具' },
  { key: 'diff', label: '文本对比' },
  { key: 'time', label: '时间工具' },
  { key: 'settings', label: '设置' }
]
</script>

<style scoped>
.header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 0 8px 0 78px;
  display: flex;
  align-items: center;
  height: 40px;
  -webkit-app-region: drag;
}
.tabs {
  display: flex;
  gap: 2px;
}
.tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  border-radius: 0;
  -webkit-app-region: no-drag;
}
.tab:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}
.tab.active {
  color: var(--text-primary);
  border-bottom-color: var(--accent);
  background: var(--bg-primary);
}
</style>
