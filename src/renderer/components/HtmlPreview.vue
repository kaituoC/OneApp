<template>
  <div ref="previewEl" class="preview">
    <iframe
      ref="iframeRef"
      sandbox="allow-same-origin"
      :srcdoc="content"
      @load="onIframeLoad"
      class="preview-iframe"
    ></iframe>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  content: { type: String, default: '' }
})

const previewEl = ref(null)
const iframeRef = ref(null)
let scrollSyncing = false

// 暴露给父组件
defineExpose({ previewEl, iframeRef })

function onIframeLoad() {
  if (!iframeRef.value) return
  const iframeDoc = iframeRef.value.contentDocument || iframeRef.value.contentWindow.document
  if (iframeDoc) {
    iframeDoc.body.style.margin = '0'
    iframeDoc.addEventListener('scroll', onIframeScroll)
  }
}

function onIframeScroll() {
  if (scrollSyncing) return
  scrollSyncing = true
  const iframeDoc = iframeRef.value?.contentDocument || iframeRef.value?.contentWindow?.document
  if (iframeDoc) {
    const ratio = iframeDoc.body.scrollTop / (iframeDoc.body.scrollHeight - iframeDoc.body.clientHeight || 1)
    const textarea = document.querySelector('.html-editor textarea')
    if (textarea) {
      textarea.scrollTop = ratio * (textarea.scrollHeight - textarea.clientHeight || 1)
    }
  }
  setTimeout(() => scrollSyncing = false, 50)
}

watch(() => props.content, () => {
  // iframe srcdoc 自动更新，无需手动处理
})
</script>

<style scoped>
.preview {
  flex: 1;
  min-width: 300px;
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-iframe {
  flex: 1;
  border: none;
  background: #fff;
  min-height: 0;
}
</style>
