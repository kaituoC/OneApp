<template>
  <AppDialog :open="isOpen" title="搜索工具" width="600px" initial-focus="input" dismiss-on-backdrop @close="isOpen = false">
    <template #lead><div class="search-field"><Search :size="20" /><input ref="input" v-model="query" placeholder="搜索工具或操作，例如 JSONPath、解码…" aria-label="工具关键词" @keydown="onKeydown" /></div></template>
    <div ref="resultsRef" class="search-results">
      <p class="search-caption">{{ query ? '匹配的工具' : '全部工具' }}</p>
      <button v-for="(item, i) in results" :key="item.id" :class="['search-result', { selected: i === index }]" @click="select(item)" @focus="index = i">
        <component :is="item.icon" :size="18" /><span>{{ item.label }}</span><small>{{ item.groupLabel }}</small><ArrowUpRight :size="15" />
      </button>
      <p v-if="!results.length" class="search-empty">没有匹配的工具，试试“JSON”“时间”或“编码”。</p>
    </div>
    <template #footer><span class="search-footer">↑ ↓ 选择 · Enter 打开 · Esc 关闭</span></template>
  </AppDialog>
</template>
<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Search, ArrowUpRight } from 'lucide-vue-next'
import AppDialog from './AppDialog.vue'
import { searchTools } from '../utils/navigation.js'
const emit = defineEmits(['select'])
const isOpen = ref(false), resultsRef = ref(null), input = ref(null), query = ref(''), index = ref(0)
const results = computed(() => searchTools(query.value))
watch(query, () => { index.value = 0 })
function open() {
  if (isOpen.value || document.querySelector('dialog[open]')) return
  query.value = ''; index.value = 0
  isOpen.value = true
}
function select(item) { emit('select', { key: item.key, subKey: item.subKey }); isOpen.value = false }
function onKeydown(e) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    index.value = Math.max(0, Math.min(results.value.length - 1, index.value + (e.key === 'ArrowDown' ? 1 : -1)))
    nextTick(() => resultsRef.value.querySelector('.selected')?.scrollIntoView({ block: 'nearest' }))
  } else if (e.key === 'Enter' && results.value[index.value]) {
    e.preventDefault(); select(results.value[index.value])
  }
}
defineExpose({ open })
</script>
<style scoped>
.search-field{display:flex;align-items:center;gap:12px;padding:17px;border-bottom:1px solid var(--border-color)}
.search-field input{flex:1;min-width:0;border:0;background:transparent;outline:0;padding:7px}
.search-results{padding:10px}
.search-caption,.search-footer{font-size:11px;color:var(--text-muted);padding:8px 12px}
.search-result{width:100%;display:flex;gap:12px;border:0;background:transparent;padding:12px;text-align:left;justify-content:flex-start}
.search-result small{margin-left:auto;color:var(--text-muted)}
.search-result.selected{background:var(--accent-soft);color:var(--accent)}
.search-empty{padding:26px 12px;color:var(--text-muted);font-size:13px}
.search-footer{padding:0;}
</style>
