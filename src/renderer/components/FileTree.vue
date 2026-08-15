<template>
  <div class="file-tree">
    <!-- 顶部：当前根 + 打开文件夹 + 显示隐藏项 + 刷新 -->
    <div class="tree-toolbar">
      <div class="root-row">
        <span class="root-name" :title="currentRoot">{{ rootDisplayName }}</span>
        <button class="tool-icon-button" title="打开文件夹" aria-label="打开文件夹" @click="openFolder">
          <FolderOpen :size="15" aria-hidden="true" />
        </button>
        <button
          :class="['tool-icon-button', { on: showHidden }]"
          :title="showHidden ? '隐藏隐藏项' : '显示隐藏项'"
          :aria-label="showHidden ? '隐藏隐藏项' : '显示隐藏项'"
          :aria-pressed="showHidden"
          @click="showHidden = !showHidden"
        >
          <component :is="showHidden ? Eye : EyeOff" :size="15" aria-hidden="true" />
        </button>
        <button class="tool-icon-button" title="刷新" aria-label="刷新" @click="refresh">
          <RefreshCw :size="15" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- 树主体 -->
    <div class="tree-body">
      <div v-if="!currentRoot" class="tree-hint tool-empty-state">
        请点击打开文件夹，或在设置中选择工作目录
      </div>
      <div v-else-if="loading" class="tree-hint tool-empty-state">加载中...</div>
      <div v-else-if="error" class="tree-hint tool-empty-state tree-error">目录读取失败</div>
      <div v-else-if="filteredRootItems.length === 0" class="tree-hint tool-empty-state">
        此目录暂无可显示的内容
      </div>
      <template v-else>
        <TreeNode
          v-for="item in filteredRootItems"
          :key="item.path + '#' + treeVersion"
          :item="item"
          :depth="0"
          :editable-extensions="editableExtensions"
          :show-hidden="showHidden"
          :active-path="activePath"
          @open-file="$emit('open-file', $event)"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Eye, EyeOff, FolderOpen, RefreshCw } from 'lucide-vue-next'
import TreeNode from './TreeNode.vue'
import { readDir, filterTreeItems, chooseDirectory } from '../utils/fileHelper.js'

const props = defineProps({
  rootPath: { type: String, default: '' },
  editableExtensions: { type: Array, default: () => [] },
  activePath: { type: String, default: '' }
})

defineEmits(['open-file'])

const currentRoot = ref(props.rootPath)
const rawRootItems = ref([])
const loading = ref(false)
const error = ref(false)
const showHidden = ref(false)
const treeVersion = ref(0)

const rootDisplayName = computed(() => {
  if (!currentRoot.value) return '未选择目录'
  const parts = currentRoot.value.split('/').filter(Boolean)
  return parts[parts.length - 1] || currentRoot.value
})

const filteredRootItems = computed(() =>
  filterTreeItems(rawRootItems.value, {
    editableExtensions: props.editableExtensions,
    showHidden: showHidden.value
  })
)

async function loadRoot() {
  if (!currentRoot.value) {
    rawRootItems.value = []
    return
  }
  loading.value = true
  error.value = false
  try {
    rawRootItems.value = await readDir(currentRoot.value)
  } catch (e) {
    error.value = true
    rawRootItems.value = []
  }
  loading.value = false
}

function refresh() {
  treeVersion.value++
  loadRoot()
}

async function openFolder() {
  const dir = await chooseDirectory()
  if (!dir) return
  currentRoot.value = dir
  await loadRoot()
}

watch(() => props.rootPath, (newRoot) => {
  if (newRoot && newRoot !== currentRoot.value) {
    currentRoot.value = newRoot
    loadRoot()
  }
})

onMounted(() => {
  if (currentRoot.value) loadRoot()
})

defineExpose({ refresh })
</script>

<style scoped>
.file-tree {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.tree-toolbar {
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
  padding: 9px 8px;
  background: linear-gradient(180deg, var(--surface-raised), var(--bg-secondary));
}

.root-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.root-name {
  flex: 1;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 7px 6px 10px;
}

.tree-hint {
  padding: 20px 12px;
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
}

.tree-error {
  color: #e06c75;
}
</style>
