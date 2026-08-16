<template>
  <div class="app-container">
    <Header :active-group="activeGroup" @group-change="handleGroupChange" />
    <section class="workbench-shell">
      <section class="workbench-main">
      <div class="context-bar">
        <ContextNav
          :tools="activeNavTools"
          :active="activeTab"
          :active-sub="activeSubTool"
          :group-label="activeGroupLabel"
          @select="handleNavSelect"
        />
      </div>
      <main class="content-area">
        <EditorTab
          v-show="activeTab === 'editor'"
          :work-dir="workDir"
          :is-active="activeTab === 'editor'"
          @file-open="onFileOpen"
          @save-status="currentFile = $event"
          :font-size="editorFontSize"
        />
        <JsonTab
          v-show="activeTab === 'json'"
          :font-size="editorFontSize"
          :sub-tool="activeSubToolByTab.json"
        />
        <DiffTab
          v-show="activeTab === 'diff'"
          :work-dir="workDir"
          :font-size="editorFontSize"
        />
        <TextTab
          v-show="activeTab === 'text'"
          :font-size="editorFontSize"
          :sub-tool="activeSubToolByTab.text"
        />
        <TimeTab
          v-show="activeTab === 'time'"
          :font-size="editorFontSize"
          :sub-tool="activeSubToolByTab.time"
        />
        <RegexTab
          v-show="activeTab === 'regex'"
          :font-size="editorFontSize"
        />
        <EncodeTab
          v-show="activeTab === 'encode'"
          :font-size="editorFontSize"
          :sub-tool="activeSubToolByTab.encode"
        />
        <GeneratorTab
          v-show="activeTab === 'generator'"
          :font-size="editorFontSize"
          :sub-tool="activeSubToolByTab.generator"
        />
        <AgentWorkshopTab
          v-show="activeTab === 'agent'"
          :is-active="activeTab === 'agent'"
          :font-size="editorFontSize"
        />
        <SettingsTab
          v-show="activeTab === 'settings'"
          v-model:work-dir="workDir"
          v-model:theme="currentTheme"
          v-model:font-size="editorFontSize"
          v-model:update-check-on-launch="updateCheckOnLaunch"
          :recent-files="recentFiles"
          @clear-recent="recentFiles = []"
        />
      </main>

      <StatusBar :current-file="currentFile" :active-tab="activeTab" />
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import Header from './components/Header.vue'
import EditorTab from './components/EditorTab.vue'
import JsonTab from './components/JsonTab.vue'
import DiffTab from './components/DiffTab.vue'
import TextTab from './components/TextTab.vue'
import TimeTab from './components/TimeTab.vue'
import RegexTab from './components/RegexTab.vue'
import EncodeTab from './components/EncodeTab.vue'
import GeneratorTab from './components/GeneratorTab.vue'
import AgentWorkshopTab from './components/AgentWorkshopTab.vue'
import SettingsTab from './components/SettingsTab.vue'
import StatusBar from './components/StatusBar.vue'
import ContextNav from './components/ContextNav.vue'
import {
  IS_MAC,
  TAB_BY_KEY,
  TAB_KEYS,
  TAB_TO_GROUP_KEY,
  GROUP_BY_KEY,
  NAV_GROUPS,
  SUB_TOOLS,
  DEFAULT_SUB_TOOL,
  getFirstTabInGroup,
  isCycleNavigationEvent,
  isNumericNavigationEvent
} from './utils/navigation.js'

const activeTab = ref('editor')
const currentFile = ref('')
const workDir = ref('')
const currentTheme = ref('dark')
const editorFontSize = ref(14)
const recentFiles = ref([])
const updateCheckOnLaunch = ref(false)
const recentTabByGroup = ref({})
// 会话级子工具选择，不持久化（与 recentTabByGroup 的持久化范围区分）
const activeSubToolByTab = ref({ ...DEFAULT_SUB_TOOL })

const activeGroup = computed(() => TAB_TO_GROUP_KEY[activeTab.value] || 'workspace')
const activeGroupTools = computed(() => GROUP_BY_KEY[activeGroup.value] || [])
// context-bar 导航条两级条目：子工具并入对应工具条目，页面内不再重复第三层导航
const activeNavTools = computed(() =>
  activeGroupTools.value.map((item) =>
    SUB_TOOLS[item.key] ? { ...item, children: SUB_TOOLS[item.key] } : item
  )
)
const activeSubTool = computed(() => activeSubToolByTab.value[activeTab.value] || '')
const activeGroupLabel = computed(() =>
  NAV_GROUPS.find((item) => item.key === activeGroup.value)?.label || ''
)
function setActiveTab(tabKey) {
  const item = TAB_BY_KEY[tabKey]
  if (!item) return
  activeTab.value = tabKey
  const groupKey = TAB_TO_GROUP_KEY[tabKey]
  if (groupKey) {
    recentTabByGroup.value = {
      ...recentTabByGroup.value,
      [groupKey]: tabKey
    }
  }
}

// context-bar 导航条选择负载：{ key, subKey? }；子工具选择同时激活对应一级工具
function handleNavSelect({ key, subKey }) {
  setActiveTab(key)
  if (subKey) {
    activeSubToolByTab.value = { ...activeSubToolByTab.value, [key]: subKey }
  }
}

function handleGroupChange(groupKey) {
  const next = recentTabByGroup.value[groupKey] || getFirstTabInGroup(groupKey)
  setActiveTab(next)
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

onMounted(async () => {
  const store = await window.electronAPI.getStore()
  workDir.value = store.workDir || getDefaultDir()
  currentTheme.value = store.theme || 'dark'
  editorFontSize.value = store.fontSize || 14
  recentFiles.value = store.recentFiles || []
  updateCheckOnLaunch.value = Boolean(store.updateCheckOnLaunch)
  recentTabByGroup.value = typeof store.recentTabByGroup === 'object' && store.recentTabByGroup
    ? store.recentTabByGroup
    : {
        workspace: 'editor',
        system: 'settings'
      }
  applyTheme(currentTheme.value)
})

watch([workDir, currentTheme, editorFontSize, recentFiles, updateCheckOnLaunch, recentTabByGroup], () => {
  const data = {
    workDir: workDir.value,
    theme: currentTheme.value,
    fontSize: editorFontSize.value,
    recentFiles: JSON.parse(JSON.stringify(recentFiles.value)),
    updateCheckOnLaunch: updateCheckOnLaunch.value,
    recentTabByGroup: JSON.parse(JSON.stringify(recentTabByGroup.value))
  }
  window.electronAPI.setStore(data)
}, { deep: true })

watch(currentTheme, (newTheme) => {
  applyTheme(newTheme)
})

function getDefaultDir() {
  const home = window.electronAPI.getHomeDir()
  return `${home}/Documents/OneApp`
}

function onFileOpen(filePath) {
  currentFile.value = filePath
  if (!recentFiles.value.includes(filePath)) {
    recentFiles.value.unshift(filePath)
    if (recentFiles.value.length > 10) recentFiles.value.pop()
  }
}

function onKeydown(e) {
  const num = Number(e.key)
  if (isNumericNavigationEvent(e, IS_MAC)) {
    const index = e.key === '0' ? 9 : num - 1
    if (!TAB_KEYS[index]) return
    e.preventDefault()
    setActiveTab(TAB_KEYS[index])
  }
  if (isCycleNavigationEvent(e)) {
    e.preventDefault()
    const n = TAB_KEYS.length
    const idx = TAB_KEYS.indexOf(activeTab.value)
    const nextTab = e.shiftKey
      ? TAB_KEYS[(idx - 1 + n) % n]
      : TAB_KEYS[(idx + 1) % n]
    setActiveTab(nextTab)
  }
  if (e.key === 'F12') {
    e.preventDefault()
    window.electronAPI.toggleDevTools()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.workbench-shell {
  flex: 1;
  display: flex;
  min-height: 0;
}

.workbench-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background:
    linear-gradient(180deg, var(--app-bg-glow), transparent 230px),
    var(--bg-primary);
}

.context-bar {
  height: 40px;
  flex: none;
  display: flex;
  align-items: center;
  padding: 0 18px;
  border-bottom: 1px solid var(--border-color);
  background: var(--topbar-bg);
  -webkit-app-region: drag;
}

.content-area {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

@media (max-width: 820px) {
  .context-bar {
    padding: 0 12px;
  }
}
</style>
