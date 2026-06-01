<template>
  <div class="file-tree">
    <!-- 顶部：当前根 + 打开文件夹 + 最近文件夹 + 显示隐藏项 -->
    <div class="tree-toolbar">
      <div class="root-row">
        <span class="root-name" :title="currentRoot">{{ rootDisplayName }}</span>
        <button class="icon-btn" title="打开文件夹" @click="openFolder">📂</button>
        <div ref="recentWrapRef" class="recent-folders-wrap">
          <button class="icon-btn" title="最近文件夹" @click="toggleRecentMenu">▾</button>
          <div v-if="recentMenuOpen" class="recent-menu">
            <div v-if="recentFolders.length === 0" class="recent-menu-empty">暂无最近文件夹</div>
            <div
              v-for="folder in recentFolders"
              :key="folder.path"
              class="recent-menu-item"
              :title="folder.path"
              @click="selectRecentFolder(folder.path)"
            >
              {{ folderShortName(folder.path) }}
            </div>
          </div>
        </div>
        <button
          :class="['icon-btn', { on: showHidden }]"
          :title="showHidden ? '隐藏隐藏项' : '显示隐藏项'"
          @click="showHidden = !showHidden"
        >{{ showHidden ? '👁' : '🚫' }}</button>
        <button class="icon-btn" title="刷新" @click="refresh">↻</button>
      </div>
    </div>

    <!-- 树主体 -->
    <div class="tree-body">
      <div v-if="!currentRoot" class="tree-hint">
        请点击 📂 打开文件夹，或在设置中选择工作目录
      </div>
      <div v-else-if="loading" class="tree-hint">加载中...</div>
      <div v-else-if="error" class="tree-hint tree-error">目录读取失败</div>
      <div v-else-if="filteredRootItems.length === 0" class="tree-hint">
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import TreeNode from './TreeNode.vue'
import { readDir, filterTreeItems, chooseDirectory, addRecentFolder, getRecentFolders } from '../utils/fileHelper.js'

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
const recentFolders = ref([])
const recentMenuOpen = ref(false)
const recentWrapRef = ref(null)
// 递增即可强制重建所有 TreeNode（清空子层缓存与展开态），用于刷新
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

function folderShortName(p) {
  const parts = p.split('/').filter(Boolean)
  if (parts.length <= 2) return p
  return `.../${parts.slice(-2).join('/')}`
}

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

// 刷新：重读根层并重建所有子节点（清空懒加载缓存与展开态），供 ↻ 按钮和父组件保存后调用
function refresh() {
  treeVersion.value++
  loadRoot()
}

async function openFolder() {
  const dir = await chooseDirectory()
  if (!dir) return
  await switchRoot(dir)
}

async function switchRoot(dir) {
  currentRoot.value = dir
  recentMenuOpen.value = false
  await addRecentFolder(dir)
  await loadRecentFolders()
  await loadRoot()
}

async function selectRecentFolder(dir) {
  await switchRoot(dir)
}

function toggleRecentMenu() {
  recentMenuOpen.value = !recentMenuOpen.value
}

// 点击下拉菜单外部时关闭（点 ▾ 或菜单项本身在 wrap 内，不会被关闭）
function onDocClick(e) {
  if (!recentMenuOpen.value) return
  if (recentWrapRef.value && !recentWrapRef.value.contains(e.target)) {
    recentMenuOpen.value = false
  }
}

async function loadRecentFolders() {
  try {
    recentFolders.value = await getRecentFolders()
  } catch {
    recentFolders.value = []
  }
}

// workDir 变化时若用户尚未手动换根，则跟随
watch(() => props.rootPath, (newRoot) => {
  if (newRoot && newRoot !== currentRoot.value) {
    currentRoot.value = newRoot
    loadRoot()
  }
})

onMounted(() => {
  loadRecentFolders()
  if (currentRoot.value) loadRoot()
  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
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
  border-bottom: 1px solid var(--border-color);
  padding: 6px 8px;
}

.root-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.root-name {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px 5px;
  font-size: 13px;
  border-radius: 4px;
}

.icon-btn:hover {
  background: var(--bg-tertiary);
  color: var(--accent);
}

.icon-btn.on {
  color: var(--accent);
}

.recent-folders-wrap {
  position: relative;
}

.recent-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  min-width: 200px;
  max-width: 320px;
  max-height: 280px;
  overflow-y: auto;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.recent-menu-item {
  padding: 6px 10px;
  font-size: 12px;
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.recent-menu-item:hover {
  background: var(--bg-tertiary);
  color: var(--accent);
}

.recent-menu-empty {
  padding: 10px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
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
