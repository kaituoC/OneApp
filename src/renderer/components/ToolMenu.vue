<template>
  <nav class="tool-menu" :aria-label="label || undefined">
    <button
      v-for="item in items"
      :key="item.key"
      :class="['menu-item', { active: item.key === active }]"
      @click="$emit('select', item.key)"
    >
      <component :is="item.icon" :size="15" aria-hidden="true" />
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup>
// 各工具 Tab 共用的左侧子工具菜单：数据驱动，点击行为由父组件通过 @select 决定
defineProps({
  items: { type: Array, required: true },
  active: { type: [String, Number], default: '' },
  label: { type: String, default: '' }
})
defineEmits(['select'])
</script>

<style scoped>
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

@media (max-width: 900px) {
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
</style>
