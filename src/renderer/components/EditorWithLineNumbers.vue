<template>
  <div class="editor-wrapper">
    <div class="line-numbers" ref="lineNumbersRef">
      <div
        v-for="line in lineCount"
        :key="line"
        class="line-number"
      >{{ line }}</div>
    </div>
    <textarea
      ref="textareaRef"
      v-model="content"
      class="editor-textarea"
      :placeholder="placeholder"
      :readonly="readonly"
      :style="{ fontSize: fontSize + 'px' }"
      @scroll="onScroll"
      @input="emit('update:modelValue', content)"
      spellcheck="false"
    ></textarea>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  fontSize: { type: Number, default: 14 }
})

const emit = defineEmits(['update:modelValue', 'scroll'])

const content = ref(props.modelValue)
const textareaRef = ref(null)
const lineNumbersRef = ref(null)

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
  display: flex;
  flex: 1;
  overflow: hidden;
  background: var(--bg-primary);
}

.line-numbers {
  width: 48px;
  min-width: 48px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  padding: 16px 0;
  overflow: hidden;
  text-align: right;
  user-select: none;
  border-right: 1px solid var(--border-color);
}

.line-number {
  padding-right: 12px;
  opacity: 0.6;
}

.editor-textarea {
  flex: 1;
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
</style>