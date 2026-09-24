<template>
  <div class="app-container">
    <Header :active-group="activeGroup" :theme="currentTheme" @group-change="handleGroupChange" @search="searchRef.open()" @toggle-theme="currentTheme = currentTheme === 'dark' ? 'light' : 'dark'" />
    <ToolSearch ref="searchRef" @select="handleNavSelect" />
    <TransferDialog :request="transferRequest" @choose="confirmTransfer" />
    <section class="workbench-shell">
      <section class="workbench-main">
      <div v-if="activeNavTools.length > 1" class="context-bar">
        <ContextNav
          :tools="activeNavTools"
          :active="activeTab"
          :active-sub="activeSubTool"
          :group-label="activeGroupLabel"
          @select="handleNavSelect"
        />
      </div>
      <div class="tool-heading">
        <span class="tool-heading-icon"><component :is="activeItem.icon" :size="23" /></span>
        <div><h1>{{ activeToolLabel }}</h1><p>{{ activeItem.description }}</p></div>
        <span class="heading-shortcut">{{ formatShortcut(activeItem) }}</span>
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
          @select-sub-tool="activeSubToolByTab.text = $event"
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
import { computed, provide, ref, watch, onMounted, onUnmounted } from 'vue'
import TransferDialog from './components/TransferDialog.vue'
import ToolSearch from './components/ToolSearch.vue'
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
  getGroupEntries, resolveGroupTab, formatShortcut,
  IS_MAC,
  TAB_BY_KEY,
  TAB_KEYS,
  TAB_TO_GROUP_KEY,
  NAV_GROUPS,
  SUB_TOOLS,
  DEFAULT_SUB_TOOL,
  isCycleNavigationEvent,
  isNumericNavigationEvent
} from './utils/navigation.js'
import { SEND_TO_KEY, PENDING_INPUT_KEY, provideSendTo } from './composables/useSendTo.js'

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
const searchRef = ref(null)
const activeItem = computed(() => TAB_BY_KEY[activeTab.value])
const activeToolLabel = computed(() => {
  const sub = SUB_TOOLS[activeTab.value]?.find(s => s.key === activeSubToolByTab.value[activeTab.value])
  return sub && activeTab.value !== 'text' ? sub.label : activeItem.value.label
})
const activeNavTools = computed(() => getGroupEntries(activeGroup.value))
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

const sendToApi = provideSendTo(
  setActiveTab,
  (tabKey, subKey) => {
    activeSubToolByTab.value = { ...activeSubToolByTab.value, [tabKey]: subKey }
  }
)
const { pendingInput, transferRequest, confirmTransfer } = sendToApi
provide(SEND_TO_KEY, sendToApi)
provide(PENDING_INPUT_KEY, pendingInput)

// context-bar 导航条选择负载：{ key, subKey? }；子工具选择同时激活对应一级工具
function handleNavSelect({ key, subKey }) {
  setActiveTab(key)
  if (subKey) {
    activeSubToolByTab.value = { ...activeSubToolByTab.value, [key]: subKey }
  }
}

function handleGroupChange(groupKey) {
  const next = resolveGroupTab(groupKey, recentTabByGroup.value)
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
  if (document.querySelector('dialog[open]')) return
  if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchRef.value.open()
    return
  }
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
.tool-heading {display:flex;align-items:center;gap:13px;padding:22px 28px 18px;flex:none;}
.tool-heading-icon {display:grid;place-items:center;width:42px;height:42px;border-radius:10px;background:var(--accent-soft);color:var(--accent);}
.tool-heading h1 {font-size:23px;line-height:1.3;font-weight:650;}
.tool-heading p {font-size:12px;color:var(--text-muted);margin-top:4px;}
.heading-shortcut {margin-left:auto;font-size:11px;color:var(--text-muted);}
.content-area {margin:0 28px 22px;}
.workbench-main {background:var(--bg-primary);}
@media(max-width:900px){.tool-heading{padding:14px 16px}.content-area{margin:0 16px 14px}.tool-heading h1{font-size:20px}.tool-heading-icon{width:35px;height:35px}}
</style>
