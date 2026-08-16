<template>
  <div
    ref="navRef"
    :class="['context-nav', { 'fade-left': !scrollAtStart, 'fade-right': !scrollAtEnd }]"
  >
    <div
      class="nav-segment"
      role="radiogroup"
      :aria-label="`${groupLabel}工具`"
      @keydown="handleSegmentedKeydown"
    >
      <button
        v-for="item in tools"
        :key="item.key"
        type="button"
        role="radio"
        :class="['nav-chip', { active: item.key === active }]"
        :aria-checked="item.key === active ? 'true' : 'false'"
        :title="getNavigationTooltip(item)"
        @click="emitSelect(item.key)"
      >
        <component :is="item.icon" :size="14" aria-hidden="true" />
        <span class="nav-chip-label">{{ item.label }}</span>
      </button>
    </div>
    <template v-if="subTools.length > 0">
      <div class="nav-divider" aria-hidden="true"></div>
      <div
        class="nav-segment"
        role="radiogroup"
        :aria-label="`${activeToolLabel}子工具`"
        @keydown="handleSegmentedKeydown"
      >
        <button
          v-for="sub in subTools"
          :key="sub.key"
          type="button"
          role="radio"
          :class="['nav-chip', 'nav-chip-sub', { active: sub.key === activeSub }]"
          :aria-checked="sub.key === activeSub ? 'true' : 'false'"
          :title="`${activeToolLabel} · ${sub.label}`"
          @click="emitSelect(active, sub.key)"
        >
          <span class="nav-chip-label">{{ sub.label }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { handleSegmentedKeydown } from '../utils/segmentedControl.js'
import { getNavigationTooltip } from '../utils/navigation.js'

const props = defineProps({
  tools: { type: Array, required: true },
  active: { type: String, default: '' },
  activeSub: { type: String, default: '' },
  groupLabel: { type: String, default: '' }
})

const emit = defineEmits(['select'])

const activeTool = computed(() => props.tools.find((item) => item.key === props.active))
const activeToolLabel = computed(() => activeTool.value?.label || '')
const subTools = computed(() => activeTool.value?.children || [])

// 负载统一为 { key, subKey? }，与 handleNavSelect 语义一致
function emitSelect(key, subKey) {
  emit('select', subKey ? { key, subKey } : { key })
}

// 溢出渐变指示
const navRef = ref(null)
const scrollAtStart = ref(true)
const scrollAtEnd = ref(true)

let rafId = null
let resizeObserver = null

function updateScrollState() {
  const el = navRef.value
  if (!el) return
  scrollAtStart.value = el.scrollLeft <= 0
  scrollAtEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
}

function onScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    updateScrollState()
  })
}

onMounted(() => {
  const el = navRef.value
  if (!el) return
  el.addEventListener('scroll', onScroll, { passive: true })
  resizeObserver = new ResizeObserver(updateScrollState)
  resizeObserver.observe(el)
  updateScrollState()
})

onUnmounted(() => {
  const el = navRef.value
  if (el) el.removeEventListener('scroll', onScroll)
  if (resizeObserver) resizeObserver.disconnect()
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.context-nav {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  /* context-bar 是窗口拖拽区，交互入口必须显式 no-drag */
  -webkit-app-region: no-drag;
}

.context-nav.fade-left::before,
.context-nav.fade-right::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 24px;
  pointer-events: none;
  z-index: 1;
}

.context-nav.fade-left::before {
  left: 0;
  background: linear-gradient(to right, var(--topbar-bg), transparent);
}

.context-nav.fade-right::after {
  right: 0;
  background: linear-gradient(to left, var(--topbar-bg), transparent);
}

.nav-segment {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  padding: 3px 10px;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}

.nav-chip > svg {
  flex: none;
}

.nav-chip:hover {
  color: var(--text-primary);
  background: var(--surface-hover);
}

.nav-chip.active {
  color: var(--accent);
  border-color: var(--accent-border);
  background: var(--accent-soft);
}

.nav-chip-sub {
  min-height: 24px;
  padding: 2px 9px;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-muted);
}

.nav-chip-sub.active {
  border-color: transparent;
}

.nav-chip-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-divider {
  flex: none;
  width: 1px;
  height: 16px;
  background: var(--border-subtle);
}
</style>
