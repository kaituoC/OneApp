<template>
  <div class="tree-node">
    <button
      type="button"
      :class="['node-row', { 'is-dir': item.isDirectory, active: !item.isDirectory && activePath === item.path }]"
      :style="{ paddingLeft: `${depth * 14 + 8}px` }"
      :title="item.path"
      :aria-expanded="item.isDirectory ? expanded : undefined"
      :aria-current="!item.isDirectory && activePath === item.path ? 'page' : undefined"
      @click="onClick"
    >
      <span v-if="item.isDirectory" class="twisty">
        <component :is="expanded ? ChevronDown : ChevronRight" :size="13" aria-hidden="true" />
      </span>
      <span v-else class="twisty spacer"></span>
      <span class="node-icon">
        <component :is="item.isDirectory ? Folder : FileText" :size="14" aria-hidden="true" />
      </span>
      <span class="node-name">{{ item.name }}</span>
    </button>

    <div v-if="item.isDirectory && expanded" class="node-children">
      <div v-if="loading" class="node-hint" :style="{ paddingLeft: `${(depth + 1) * 14 + 8}px` }">加载中...</div>
      <div v-else-if="error" class="node-hint node-error" :style="{ paddingLeft: `${(depth + 1) * 14 + 8}px` }">读取失败</div>
      <div v-else-if="filteredChildren.length === 0" class="node-hint" :style="{ paddingLeft: `${(depth + 1) * 14 + 8}px` }">（空）</div>
      <TreeNode
        v-for="child in filteredChildren"
        :key="child.path"
        :item="child"
        :depth="depth + 1"
        :editable-extensions="editableExtensions"
        :show-hidden="showHidden"
        :active-path="activePath"
        @open-file="$emit('open-file', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ChevronDown, ChevronRight, FileText, Folder } from 'lucide-vue-next'
import { readDir, filterTreeItems } from '../utils/fileHelper.js'

const props = defineProps({
  item: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  editableExtensions: { type: Array, default: () => [] },
  showHidden: { type: Boolean, default: false },
  activePath: { type: String, default: '' }
})

const emit = defineEmits(['open-file'])

const expanded = ref(false)
const loading = ref(false)
const error = ref(false)
const rawChildren = ref(null) // null = 尚未加载

// 隐藏项 / 可编辑类型过滤在渲染层完成；showHidden 切换时自动重算，无需重读
const filteredChildren = computed(() =>
  filterTreeItems(rawChildren.value || [], {
    editableExtensions: props.editableExtensions,
    showHidden: props.showHidden
  })
)

async function onClick() {
  if (props.item.isDirectory) {
    if (loading.value) return // 加载中忽略重复点击，避免并发 readDir
    // 首次展开，或上次读取失败后重试
    if (!expanded.value && (rawChildren.value === null || error.value)) {
      await loadChildren()
    }
    expanded.value = !expanded.value
  } else {
    emit('open-file', props.item.path)
  }
}

async function loadChildren() {
  loading.value = true
  error.value = false
  try {
    rawChildren.value = await readDir(props.item.path)
  } catch (e) {
    error.value = true
    rawChildren.value = []
  }
  loading.value = false
}
</script>

<style scoped>
.node-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 26px;
  padding-top: 3px;
  padding-bottom: 3px;
  padding-right: 8px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  user-select: none;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  background: transparent;
  border: 1px solid transparent;
  text-align: left;
}

.node-row:hover {
  background: var(--surface-hover);
}

.node-row.active {
  background: var(--accent-soft);
  color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--accent-border);
}

.twisty {
  width: 12px;
  flex-shrink: 0;
  color: var(--text-secondary);
  display: grid;
  place-items: center;
}

.twisty.spacer {
  visibility: hidden;
}

.node-icon {
  flex-shrink: 0;
  color: var(--text-muted);
  display: grid;
  place-items: center;
}

.node-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-hint {
  padding-top: 4px;
  padding-bottom: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

.node-error {
  color: #e06c75;
}
</style>
