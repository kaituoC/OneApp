<template>
  <div ref="previewEl" class="preview" v-html="renderedHTML"></div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  content: { type: String, default: '' }
})

const previewEl = ref(null)

// 暴露给父组件
defineExpose({ previewEl })

marked.setOptions({
  breaks: true,
  gfm: true
})

const renderedHTML = computed(() => {
  return marked.parse(props.content)
})
</script>

<style scoped>
.preview {
  background: var(--bg-primary);
  padding: 16px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.6;
  flex: 1;
}
.preview :deep(h1) { font-size: 1.8em; margin: 1em 0 0.5em; }
.preview :deep(h2) { font-size: 1.4em; margin: 0.8em 0 0.4em; }
.preview :deep(h3) { font-size: 1.2em; margin: 0.6em 0 0.3em; }
.preview :deep(h4) { font-size: 1.1em; margin: 0.5em 0 0.25em; }
.preview :deep(p) { margin: 0.6em 0; }
.preview :deep(code) {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 13px;
}
.preview :deep(pre) {
  background: var(--bg-secondary);
  padding: 12px 16px;
  border-radius: 4px;
  margin: 12px 0;
  font-size: 13px;
  line-height: 1.6;
  border: 1px solid var(--border-color);
}
.preview :deep(pre > code) {
  background: transparent;
  padding: 0;
  display: block;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.preview :deep(blockquote) {
  border-left: 4px solid var(--accent);
  padding-left: 16px;
  margin: 1em 0;
  color: var(--text-secondary);
}
.preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}
.preview :deep(th), .preview :deep(td) {
  border: 1px solid var(--border-color);
  padding: 10px 12px;
  text-align: left;
}
.preview :deep(th) {
  background: var(--bg-secondary);
}
.preview :deep(ul), .preview :deep(ol) {
  padding-left: 24px;
  margin: 0.5em 0;
}
.preview :deep(li) {
  margin: 4px 0;
}
.preview :deep(img) {
  max-width: 100%;
}
.preview :deep(a) {
  color: var(--accent);
}
</style>
