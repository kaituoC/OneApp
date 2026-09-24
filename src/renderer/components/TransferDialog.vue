<template>
  <dialog ref="dialog" class="transfer-dialog" aria-labelledby="transfer-title" @cancel.prevent="emit('choose','cancel')">
    <h2 id="transfer-title">{{ request?.label }} 已有输入</h2>
    <p>选择如何接收这次发送的内容。源工具中的输入和结果会保留。</p>
    <div class="transfer-preview"><span>目标当前内容 · {{ request?.existing.length }} 字符</span><pre>{{ request?.existing.slice(0, 400) }}</pre></div>
    <div class="transfer-actions"><button @click="emit('choose','cancel')">取消</button><button :disabled="appendTooLarge" :title="appendTooLarge ? '追加后超过 512 KB 限制' : ''" @click="emit('choose','append')">追加到末尾</button><button class="primary" @click="emit('choose','replace')">替换输入</button></div>
  </dialog>
</template>
<script setup>
import { ref, watch, nextTick, computed } from 'vue'
const props = defineProps({ request: { type: Object, default: null } })
const emit = defineEmits(['choose'])
const dialog = ref(null)
let previousFocus
const appendTooLarge = computed(() => props.request && props.request.existing.length + props.request.content.length + 1 > 512 * 1024)
watch(() => props.request, async request => {
  await nextTick()
  if (request) { previousFocus = document.activeElement; dialog.value.showModal() }
  else { dialog.value.close(); previousFocus?.focus?.() }
})
</script>
<style scoped>
.transfer-dialog{margin:auto;width:min(540px,90vw);padding:26px;border:1px solid var(--border-color);border-radius:12px;background:var(--surface);color:var(--text-primary);box-shadow:var(--shadow-soft)}
.transfer-dialog::backdrop{background:rgba(0,0,0,.35)}
h2{font-size:19px}p{margin:12px 0 18px;font-size:13px;line-height:1.7;color:var(--text-secondary)}
.transfer-preview{padding:14px;background:var(--surface-subtle);border-radius:8px;font-size:11px;color:var(--text-muted)}
pre{max-height:140px;overflow:auto;white-space:pre-wrap;font:12px/1.8 var(--font-mono);margin-top:8px;color:var(--text-primary)}
.transfer-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}
</style>
