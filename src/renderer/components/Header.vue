<template>
  <header class="workbench-header">
    <div v-if="isMac" class="window-controls-space" aria-hidden="true"></div>

    <div class="brand" aria-label="OneApp Developer Workbench">
      <component :is="WORKBENCH_ICON" class="brand-icon" :size="18" aria-hidden="true" />
      <div class="brand-copy">
        <div class="brand-name">OneApp</div>
        <div class="brand-subtitle">Developer Workbench</div>
      </div>
    </div>

    <nav class="global-nav" aria-label="主导航">
      <button
        v-for="group in NAV_GROUPS"
        :key="group.key"
        type="button"
        :class="['global-nav-item', { active: activeGroup === group.key, featured: hasFeaturedItem(group) }]"
        :title="group.label"
        :aria-label="group.label"
        :aria-current="activeGroup === group.key ? 'page' : undefined"
        @click="$emit('group-change', group.key)"
      >
        <component :is="group.items[0]?.icon || WORKBENCH_ICON" :size="16" aria-hidden="true" />
        <span>{{ group.label }}</span>
      </button>
    </nav>
  </header>
</template>

<script setup>
import { IS_MAC, NAV_GROUPS, WORKBENCH_ICON } from '../utils/navigation.js'

defineProps({
  activeGroup: { type: String, required: true }
})

defineEmits(['group-change'])

const isMac = IS_MAC

function hasFeaturedItem(group) {
  return group.items.some((item) => item.featured)
}
</script>

<style scoped>
.workbench-header {
  height: 56px;
  min-height: 56px;
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding-right: 14px;
  color: var(--text-primary);
  background: linear-gradient(180deg, var(--chrome-bg), var(--chrome-bg-muted));
  border-bottom: 1px solid var(--border-color);
  -webkit-app-region: drag;
}

.window-controls-space { flex: 0 0 78px; }

.brand {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 126px;
}

.brand-icon { flex: none; color: var(--accent); }

.brand-name {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.1;
}

.brand-subtitle {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 10px;
  line-height: 1.1;
}

.global-nav {
  min-width: 0;
  display: flex;
  align-items: stretch;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-app-region: no-drag;
}

.global-nav::-webkit-scrollbar { display: none; }

.global-nav-item {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 0;
  padding: 0 10px;
  color: var(--text-muted);
  background: transparent;
  border: 0;
  border-radius: 0;
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;
}

.global-nav-item::after {
  position: absolute;
  right: 10px;
  bottom: 0;
  left: 10px;
  height: 2px;
  content: '';
  border-radius: 999px 999px 0 0;
  background: transparent;
}

.global-nav-item:hover {
  color: var(--text-primary);
  background: var(--surface-hover);
  border-color: transparent;
}

.global-nav-item.active {
  color: var(--text-primary);
  background: var(--accent-soft);
}

.global-nav-item.active::after { background: var(--accent); }
.global-nav-item.featured.active { background: linear-gradient(135deg, var(--accent-soft), var(--ai-accent-soft)); }

@media (max-width: 920px) {
  .brand { min-width: auto; }
  .brand-subtitle { display: none; }
}

@media (max-width: 700px) {
  .window-controls-space { flex-basis: 72px; }
  .brand-copy { display: none; }
  .global-nav-item { padding: 0 8px; }
}
</style>
