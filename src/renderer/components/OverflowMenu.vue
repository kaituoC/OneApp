<template>
  <div ref="rootRef" class="tool-overflow-menu">
    <button
      ref="triggerRef"
      type="button"
      class="tool-overflow-trigger"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="toggleMenu"
      @keydown.down.prevent="openMenu"
    >
      <MoreHorizontal :size="15" aria-hidden="true" />
      {{ label }}
    </button>
    <div
      v-if="open"
      ref="menuRef"
      class="tool-overflow-popover"
      role="menu"
      :aria-label="label"
      @keydown="onMenuKeydown"
    >
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        role="menuitem"
        :disabled="item.disabled"
        @click="selectItem(item)"
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { MoreHorizontal } from 'lucide-vue-next'

defineProps({
  label: { type: String, default: '更多' },
  items: { type: Array, default: () => [] }
})

const emit = defineEmits(['select'])
const rootRef = ref(null)
const triggerRef = ref(null)
const menuRef = ref(null)
const open = ref(false)

function enabledItems() {
  return Array.from(menuRef.value?.querySelectorAll('[role="menuitem"]:not(:disabled)') || [])
}

async function openMenu() {
  if (open.value) return
  open.value = true
  await nextTick()
  enabledItems()[0]?.focus()
}

function closeMenu({ restoreFocus = true } = {}) {
  if (!open.value) return
  open.value = false
  if (restoreFocus) nextTick(() => triggerRef.value?.focus())
}

function toggleMenu() {
  if (open.value) closeMenu()
  else openMenu()
}

function selectItem(item) {
  if (item.disabled) return
  emit('select', item.key)
  closeMenu()
}

function onMenuKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeMenu()
    return
  }

  const options = enabledItems()
  if (!options.length) return
  const current = options.indexOf(document.activeElement)

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    options[(current + 1) % options.length]?.focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    options[(current - 1 + options.length) % options.length]?.focus()
  } else if (event.key === 'Home') {
    event.preventDefault()
    options[0]?.focus()
  } else if (event.key === 'End') {
    event.preventDefault()
    options.at(-1)?.focus()
  }
}

function onDocumentPointerDown(event) {
  if (open.value && !rootRef.value?.contains(event.target)) closeMenu({ restoreFocus: false })
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onUnmounted(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>
