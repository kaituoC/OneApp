<template>
  <div ref="previewEl" class="preview">
    <iframe
      ref="iframeRef"
      sandbox="allow-same-origin"
      :srcdoc="safeHtmlPreview(content)"
      @load="onIframeLoad"
      title="HTML 静态预览（脚本不执行）"
      class="preview-iframe"
    ></iframe>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { safeHtmlPreview } from '../utils/safeMarkdown.js'
import { handlePreviewLink } from '../utils/previewLinks.js'

defineProps({
  content: { type: String, default: '' }
})

const previewEl = ref(null)
const iframeRef = ref(null)

// 暴露给父组件（滚动同步由 EditorTab 单向驱动：编辑器 → iframe）
defineExpose({ previewEl, iframeRef })

function onIframeLoad() {
  if (!iframeRef.value) return
  const iframeDoc = iframeRef.value.contentDocument || iframeRef.value.contentWindow.document
  if (iframeDoc) {
    if (iframeDoc.body) iframeDoc.body.style.margin = '0'
    iframeDoc.addEventListener('click', event => handlePreviewLink(event, iframeDoc))
  }
}
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
