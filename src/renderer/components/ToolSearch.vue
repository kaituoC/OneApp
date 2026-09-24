<template>
  <dialog ref="dialog" class="tool-search" aria-label="搜索工具" @close="restoreFocus" @click="onBackdrop">
    <div class="search-field"><Search :size="20" /><input ref="input" v-model="query" placeholder="搜索工具或操作，例如 JSONPath、解码…" aria-label="工具关键词" @keydown="onKeydown" /><button aria-label="关闭搜索" @click="dialog.close()">Esc</button></div>
    <div class="search-results">
      <p class="search-caption">{{ query ? '匹配的工具' : '全部工具' }}</p>
      <button v-for="(item, i) in results" :key="item.id" :class="['search-result', { selected: i === index }]" @click="select(item)" @focus="index = i">
        <component :is="item.icon" :size="18" /><span>{{ item.label }}</span><small>{{ item.groupLabel }}</small><ArrowUpRight :size="15" />
      </button>
      <p v-if="!results.length" class="search-empty">没有匹配的工具，试试“JSON”“时间”或“编码”。</p>
    </div>
    <div class="search-footer">↑ ↓ 选择 · Enter 打开 · Esc 关闭</div>
  </dialog>
</template>
<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Search, ArrowUpRight } from 'lucide-vue-next'
import { searchTools } from '../utils/navigation.js'
const emit = defineEmits(['select'])
const dialog = ref(null), input = ref(null), query = ref(''), index = ref(0)
const results = computed(() => searchTools(query.value))
let previousFocus
watch(query, () => { index.value = 0 })
function open() {
  if (dialog.value.open) return
  previousFocus = document.activeElement
  query.value = ''; index.value = 0
  dialog.value.showModal()
  nextTick(() => input.value.focus())
}
function restoreFocus() { previousFocus?.focus?.() }
function select(item) { emit('select', { key: item.key, subKey: item.subKey }); dialog.value.close() }
function onKeydown(e) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    index.value = Math.max(0, Math.min(results.value.length - 1, index.value + (e.key === 'ArrowDown' ? 1 : -1)))
    nextTick(() => dialog.value.querySelector('.selected')?.scrollIntoView({ block: 'nearest' }))
  } else if (e.key === 'Enter' && results.value[index.value]) {
    e.preventDefault(); select(results.value[index.value])
  }
}
function onBackdrop(e) {
  if (e.target !== dialog.value) return
  const r = dialog.value.getBoundingClientRect()
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.value.close()
}
defineExpose({ open })
</script>
<style scoped>
.tool-search{margin:12vh auto auto;width:min(570px,90vw);max-height:76vh;padding:0;border:1px solid var(--border-color);border-radius:14px;background:var(--surface);color:var(--text-primary);box-shadow:var(--shadow-soft)}
.tool-search::backdrop{background:rgba(0,0,0,.35);backdrop-filter:blur(3px)}
.search-field{display:flex;align-items:center;gap:12px;padding:17px;border-bottom:1px solid var(--border-color)}
.search-field input{flex:1;min-width:0;border:0;background:transparent;outline:0;padding:7px}
.search-field button{font-size:11px;min-height:26px;padding:3px 7px}
.search-results{max-height:48vh;overflow:auto;padding:10px}
.search-caption,.search-footer{font-size:11px;color:var(--text-muted);padding:8px 12px}
.search-result{width:100%;display:flex;gap:12px;border:0;background:transparent;padding:12px;text-align:left;justify-content:flex-start}
.search-result small{margin-left:auto;color:var(--text-muted)}
.search-result.selected{background:var(--accent-soft);color:var(--accent)}
.search-empty{padding:26px 12px;color:var(--text-muted);font-size:13px}
.search-footer{border-top:1px solid var(--border-color);padding:12px 20px}
</style>
