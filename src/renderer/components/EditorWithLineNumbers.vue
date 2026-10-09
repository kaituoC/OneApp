<template>
  <div class="editor-wrapper" :style="{fontSize:fontSize + 'px'}">
    <div class="line-numbers" ref="lineNumbersRef">
      <div
        v-for="line in lineCount"
        :key="line"
        class="line-number" :style="{height:(lineHeights[line-1] || fontSize*1.6) + 'px'}"
      >{{ line }}</div>
    </div>
    <textarea
      ref="textareaRef"
      v-model="content"
      class="editor-textarea"
      :placeholder="placeholder"
      :aria-label="label || (readonly ? '输出结果' : placeholder || '文本输入')"
      :wrap="wrap ? 'soft' : 'off'"
      :readonly="readonly"
      :style="{ fontSize: fontSize + 'px' }"
      @scroll="onScroll"
      @input="emit('update:modelValue', content)"
      spellcheck="false"
    ></textarea>
    <div ref="mirrorRef" class="line-mirror" aria-hidden="true" :style="{width:mirrorWidth + 'px',whiteSpace:wrap ? 'pre-wrap' : 'pre'}"><div v-for="(line,index) in content.split('\n')" :key="index">{{ line || '\u200b' }}</div></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  label: {type:String,default:''},
  wrap: {type:Boolean,default:true},
  fontSize: { type: Number, default: 14 }
})

const emit = defineEmits(['update:modelValue', 'scroll'])

const content = ref(props.modelValue)
const textareaRef = ref(null)
const lineNumbersRef = ref(null), mirrorRef = ref(null), mirrorWidth = ref(0), lineHeights = ref([])
let resizeObserver
async function measureLines() {
  if (!textareaRef.value || !props.wrap) { lineHeights.value = []; return }
  mirrorWidth.value = Math.max(1,textareaRef.value.clientWidth - 32)
  await nextTick()
  lineHeights.value = [...(mirrorRef.value?.children || [])].map(el => el.getBoundingClientRect().height)
}
watch([content, () => props.fontSize, () => props.wrap], measureLines, {flush:'post'})
onMounted(() => { measureLines(); if (typeof ResizeObserver !== 'undefined') { resizeObserver = new ResizeObserver(measureLines); resizeObserver.observe(textareaRef.value) } })
onUnmounted(() => resizeObserver?.disconnect())

// 计算行数
const lineCount = computed(() => {
  if (!content.value) return 1
  const lines = content.value.split('\n')
  return lines.length
})

// 同步滚动
function onScroll() {
  if (lineNumbersRef.value) {
    lineNumbersRef.value.scrollTop = textareaRef.value.scrollTop
  }
  emit('scroll')
}

// 监听外部值变化
watch(() => props.modelValue, (val) => {
  content.value = val
})

// 暴露 textarea 引用给父组件
defineExpose({ textareaRef })
</script>

<style scoped>
.editor-wrapper {
  position: relative;
  min-width:0;
  min-height:0;
  display: flex;
  flex: 1;
  overflow: hidden;
  background: var(--bg-primary);
}

.line-numbers {
  width: 48px;
  min-width: 48px;
  background: var(--surface-raised);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: inherit;
  line-height: 1.6;
  padding: 16px 0;
  overflow: hidden;
  text-align: right;
  user-select: none;
  border-right: 1px solid var(--border-subtle);
}

.line-number {
  padding-right: 12px;
  opacity: 0.6;
}

.editor-textarea {
  flex: 1;
  min-width:0;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: none;
  resize: none;
  padding: 16px;
  font-family: var(--font-mono);
  line-height: 1.6;
  outline: none;
  overflow: auto;
}

.editor-textarea::placeholder {
  color: var(--text-secondary);
  opacity: 0.5;
}

.editor-textarea[readonly] {
  background: var(--bg-secondary);
}
.line-mirror{position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;font-family:var(--font-mono);font-size:inherit;line-height:1.6;overflow-wrap:break-word;tab-size:8}.line-mirror>div{min-height:1.6em}
.editor-textarea:focus-visible{box-shadow:inset 0 0 0 2px var(--accent-border)}
</style>
