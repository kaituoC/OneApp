<template>
  <aside :class="['workbench-nav', { collapsed: isCollapsed }]">
    <div class="nav-chrome-space"></div>

    <div class="brand">
      <component v-if="!isCollapsed" :is="WORKBENCH_ICON" class="brand-icon" :size="18" aria-hidden="true" />
      <div v-if="!isCollapsed" class="brand-copy">
        <div class="brand-name">OneApp</div>
        <div class="brand-subtitle">Developer Workbench</div>
      </div>
      <button
        type="button"
        class="nav-collapse"
        :title="isCollapsed ? '展开导航' : '收起导航'"
        :aria-label="isCollapsed ? '展开导航' : '收起导航'"
        @click="isCollapsed = !isCollapsed"
      >
        <component :is="isCollapsed ? PanelLeftOpen : PanelLeftClose" :size="15" aria-hidden="true" />
      </button>
    </div>

    <nav class="nav-groups" aria-label="主导航">
      <section v-for="group in NAV_GROUPS" :key="group.key" class="nav-group">
        <div v-if="!isCollapsed" class="nav-group-label" :title="group.label">{{ group.label }}</div>
        <button
          v-for="tab in group.items"
          :key="tab.key"
          type="button"
          :class="['nav-item', { active: activeTab === tab.key, featured: tab.featured }]"
          :title="getNavigationTooltip(tab)"
          :aria-label="getNavigationTooltip(tab)"
          @click="$emit('tab-change', tab.key)"
        >
          <span class="nav-icon-wrap">
            <component :is="tab.icon" class="nav-icon" :size="17" aria-hidden="true" />
          </span>
          <span v-if="!isCollapsed" class="nav-text">
            <span class="nav-label">{{ tab.label }}</span>
            <span class="nav-desc">{{ tab.summary || tab.description }}</span>
          </span>
          <span v-if="!isCollapsed" class="nav-shortcut">{{ tab.shortcut }}</span>
        </button>
      </section>
    </nav>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'
import { NAV_GROUPS, WORKBENCH_ICON, getNavigationTooltip } from '../utils/navigation.js'

defineProps({
  activeTab: { type: String, required: true }
})

defineEmits(['tab-change'])

const isCollapsed = ref(false)
</script>

<style scoped>
.workbench-nav {
  width: 230px;
  min-width: 230px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--chrome-bg), var(--chrome-bg-muted));
  border-right: 1px solid var(--border-color);
  -webkit-app-region: drag;
  transition: width 0.18s ease, min-width 0.18s ease;
}

.workbench-nav.collapsed {
  width: 72px;
  min-width: 72px;
}

.nav-chrome-space {
  height: 48px;
  flex: none;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.brand-icon {
  flex: none;
  color: var(--accent);
}

.brand-copy {
  min-width: 0;
}

.brand-name {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
}

.brand-subtitle {
  color: var(--text-muted);
  font-size: 11px;
  margin-top: 2px;
}

.nav-collapse {
  width: 28px;
  min-width: 28px;
  height: 28px;
  margin-left: auto;
  padding: 0;
  color: var(--text-muted);
  background: var(--surface-subtle);
  border-color: var(--border-subtle);
  -webkit-app-region: no-drag;
}

.nav-collapse:hover {
  color: var(--accent);
}

.workbench-nav.collapsed .brand {
  justify-content: center;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 12px;
}

.workbench-nav.collapsed .nav-collapse {
  margin-left: 0;
}

.nav-groups {
  flex: 1;
  overflow-y: auto;
  padding: 14px 10px;
  -webkit-app-region: no-drag;
}

.nav-group + .nav-group {
  margin-top: 18px;
}

.nav-group-label {
  padding: 0 8px 7px;
  color: var(--text-faint);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
}

.nav-item {
  width: 100%;
  min-height: 42px;
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  text-align: left;
}

.workbench-nav.collapsed .nav-item {
  grid-template-columns: 1fr;
  justify-items: center;
  gap: 4px;
  padding: 7px 4px;
}

.nav-item:hover {
  background: var(--surface-hover);
  border-color: var(--border-subtle);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-soft);
  border-color: var(--accent-border);
  color: var(--text-primary);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
}

.nav-item.featured.active {
  background: linear-gradient(135deg, var(--accent-soft), var(--ai-accent-soft));
}

.nav-icon-wrap {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  color: var(--text-muted);
  background: var(--surface-subtle);
}

.nav-item.active .nav-icon-wrap {
  color: var(--accent);
  background: var(--accent-soft-strong);
}

.nav-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-label {
  font-size: 13px;
  font-weight: 650;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-desc {
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.15;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-shortcut {
  min-width: 18px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 11px;
  text-align: right;
}

@media (max-width: 980px) {
  .workbench-nav {
    width: 204px;
    min-width: 204px;
  }
}
</style>
