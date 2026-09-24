<template>
  <AppDialog :open="Boolean(request)" :title="`${request?.label || '目标工具'} 已有输入`" width="580px" @close="emit('choose', 'cancel')">
    <p>选择如何接收这次发送的内容。源工具中的输入和结果会保留。</p>
    <div class="transfer-preview"><span>目标当前内容 · {{ request?.existing.length.toLocaleString() }} 字符（完整内容）</span><pre>{{ request?.existing }}</pre></div>
    <template #footer>
      <button data-dialog-focus @click="emit('choose','cancel')">取消</button>
      <button :disabled="appendTooLarge" :title="appendTooLarge ? '追加后超过 512 KB 限制' : ''" @click="emit('choose','append')">追加到末尾</button>
      <button class="primary" @click="emit('choose','replace')">替换输入</button>
    </template>
  </AppDialog>
</template>
<script setup>
import { computed } from 'vue'
import AppDialog from './AppDialog.vue'
const props = defineProps({ request: { type: Object, default: null } })
const emit = defineEmits(['choose'])
const appendTooLarge = computed(() => props.request && props.request.existing.length + props.request.content.length + 1 > 512 * 1024)
</script>
<style scoped>
p{margin-bottom:18px;font-size:13px;line-height:1.7;color:var(--text-secondary)}
.transfer-preview{padding:14px;background:var(--surface-subtle);border-radius:8px;font-size:11px;color:var(--text-muted)}
pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.8 var(--font-mono);margin-top:8px;color:var(--text-primary)}
</style>
