<template>
  <Teleport to="body">
    <dialog ref="dialog" class="app-dialog" :style="{ '--dialog-width': width }" :aria-label="title"
      @cancel.prevent="emit('close')" @close="onClose" @keydown.stop="onKeydown" @click="onBackdrop">
      <header class="dialog-header">
        <h2>{{ title }}</h2>
        <button class="dialog-dismiss" aria-label="关闭弹窗" title="关闭 (Esc)" @click="emit('close')"><X :size="18" /></button>
      </header>
      <div v-if="$slots.lead" class="dialog-lead"><slot name="lead" /></div>
      <div class="dialog-body"><slot /></div>
      <footer v-if="$slots.footer" class="dialog-footer"><slot name="footer" /></footer>
    </dialog>
  </Teleport>
</template>
<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { X } from 'lucide-vue-next'
const props = defineProps({
  open: Boolean,
  title: { type: String, required: true },
  width: { type: String, default: '680px' },
  initialFocus: { type: String, default: '[data-dialog-focus]' },
  dismissOnBackdrop: Boolean
})
const emit = defineEmits(['close'])
const dialog = ref(null)
let previousFocus = null
async function syncOpen() {
  await nextTick()
  const el = dialog.value
  if (!el) return
  if (!props.open) { if (el.open) el.close(); return }
  if (el.open || document.querySelector('dialog[open]')) return
  previousFocus = document.activeElement
  el.showModal()
  ;(el.querySelector(props.initialFocus) || el.querySelector('.dialog-dismiss'))?.focus()
}
function onClose() {
  if (dialog.value?.open) return // 忽略重新打开后迟到的原生 close 事件
  if (previousFocus?.isConnected) previousFocus.focus()
  previousFocus = null
  document.dispatchEvent(new Event('oneapp-dialog-closed'))
}
function onKeydown(event) {
  if (event.key !== 'Tab') return
  const controls = [...dialog.value.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]')]
    .filter(el => el.tabIndex >= 0 && el.getClientRects().length)
  const first = controls[0], last = controls[controls.length - 1]
  if (!first) { event.preventDefault(); return }
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
function onBackdrop(event) {
  if (!props.dismissOnBackdrop || event.target !== dialog.value) return
  const r = dialog.value.getBoundingClientRect()
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) emit('close')
}
watch(() => props.open, syncOpen)
onMounted(() => {
  document.addEventListener('close', syncOpen, true)
  document.addEventListener('oneapp-dialog-closed', syncOpen)
  syncOpen()
})
onBeforeUnmount(() => {
  document.removeEventListener('close', syncOpen, true)
  document.removeEventListener('oneapp-dialog-closed', syncOpen)
  if (dialog.value?.open) { dialog.value.close(); onClose() }
})
</script>
<style scoped>
.app-dialog{margin:auto;width:min(var(--dialog-width),calc(100vw - 32px));max-width:calc(100vw - 32px);max-height:calc(100dvh - 48px);padding:0;border:1px solid var(--border-color);border-radius:14px;background:var(--surface);color:var(--text-primary);box-shadow:var(--shadow-soft);overflow:hidden;}
.app-dialog[open]{display:flex;flex-direction:column;}
.app-dialog::backdrop{background:rgba(0,0,0,.42);backdrop-filter:blur(3px);}
.dialog-header{display:flex;align-items:center;gap:16px;padding:20px 24px;border-bottom:1px solid var(--border-color);flex:none;}
h2{font-size:19px;line-height:1.4;overflow-wrap:anywhere;}
.dialog-dismiss{margin-left:auto;flex:none;padding:6px;min-height:30px;background:transparent;}
.dialog-lead{flex:none;padding:0 24px;}
.dialog-body{padding:20px 24px;overflow:auto;min-height:0;overflow-wrap:anywhere;overscroll-behavior:contain;}
.dialog-footer{display:flex;justify-content:flex-end;align-items:center;gap:10px;flex-wrap:wrap;padding:16px 24px;border-top:1px solid var(--border-color);flex:none;}
@media(max-height:650px){.dialog-header{padding:14px 20px}.dialog-lead{flex:none;padding:0 24px;}
.dialog-body{padding:16px 20px}.dialog-footer{padding:12px 20px}}
</style>
