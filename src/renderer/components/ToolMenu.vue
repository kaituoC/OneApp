<template>
  <nav class="tool-menu tool-menu-vertical" :aria-label="label || undefined">
    <template v-for="item in items" :key="item.key">
      <button
        type="button"
        :class="['menu-item', { active: item.key === active }]"
        :aria-current="item.key === active ? 'page' : undefined"
        :title="showDescription ? getNavigationTooltip(item) : item.label"
        @click="emitSelect(item.key)"
      >
        <component :is="item.icon" :size="15" aria-hidden="true" />
        <span class="menu-item-copy">
          <span>{{ item.label }}</span>
          <span v-if="showDescription && (item.summary || item.description)" class="menu-item-summary">
            {{ item.summary || item.description }}
          </span>
        </span>
        <span v-if="showShortcut && Number.isInteger(item.shortcut)" class="menu-item-shortcut">
          {{ formatShortcut(item) }}
        </span>
      </button>
      <button
        v-for="sub in item.children || []"
        :key="`${item.key}-${sub.key}`"
        type="button"
        :class="['menu-item', 'menu-item-sub', { active: item.key === active && sub.key === activeSub }]"
        :aria-current="item.key === active && sub.key === activeSub ? 'true' : undefined"
        :title="`${item.label} · ${sub.label}`"
        @click="emitSelect(item.key, sub.key)"
      >
        <span class="menu-item-copy">
          <span>{{ sub.label }}</span>
        </span>
      </button>
    </template>
  </nav>
</template>

<script setup>
import { formatShortcut, getNavigationTooltip } from '../utils/navigation.js'

defineProps({
  items: { type: Array, required: true },
  active: { type: [String, Number], default: '' },
  activeSub: { type: String, default: '' },
  label: { type: String, default: '' },
  showDescription: { type: Boolean, default: false },
  showShortcut: { type: Boolean, default: false }
})
const emit = defineEmits(['select'])

// 负载统一为 { key, subKey? }，子工具选择同时携带一级工具 key
function emitSelect(key, subKey) {
  emit('select', subKey ? { key, subKey } : { key })
}
</script>

<style scoped>
.tool-menu {
  display: flex;
  min-width: 0;
  gap: 4px;
}

.tool-menu-vertical {
  flex-direction: column;
  width: 168px;
  flex-shrink: 0;
  padding: 8px;
}

.menu-item {
  justify-content: flex-start;
  flex: 0 0 auto;
  gap: 8px;
  min-height: 36px;
  padding: 7px 8px;
  color: var(--text-secondary);
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
}

.menu-item-sub {
  min-height: 28px;
  margin-left: 23px;
  padding: 4px 8px;
  font-size: 12px;
}

.menu-item > svg {
  flex: none;
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

.menu-item-copy {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.menu-item-copy > span:first-child,
.menu-item-summary {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-item-summary {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 400;
}

.menu-item-shortcut {
  flex: none;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 10px;
}

@media (max-width: 900px) {
  .tool-menu { gap: 2px; }
  .menu-item { white-space: nowrap; }
}
</style>
