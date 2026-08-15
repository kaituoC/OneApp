<template>
  <div class="app-container">
    <Header :active-group="activeGroup" @group-change="handleGroupChange" />
    <section class="workbench-shell">
      <aside v-if="hasContextualTools" class="contextual-nav">
        <div class="contextual-nav-header">
          <span>{{ activeGroupLabel }}</span>
          <span>{{ activeGroupTools.length }} 个工具</span>
        </div>
        <ToolMenu
          :items="activeGroupTools"
          :active="activeTab"
          label="当前分组工具"
          show-description
          show-shortcut
          @select="setActiveTab"
        />
      </aside>
      <section class="workbench-main">
      <div class="context-bar">
        <div class="context-title">
          <component :is="activeTool.icon" class="context-icon" :size="18" aria-hidden="true" />
          <div>
            <div class="context-name">{{ activeTool.label }}</div>
            <div class="context-desc" :title="activeContext">{{ activeContext }}</div>
          </div>
        </div>
        <div class="context-meta">
          <span class="meta-chip">{{ shortcutHint }}</span>
          <span class="meta-chip">{{ currentTheme === 'dark' ? '深色' : '浅色' }}</span>
          <span class="meta-chip">{{ editorFontSize }}px</span>
        </div>
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
        />
        <DiffTab
          v-show="activeTab === 'diff'"
          :work-dir="workDir"
          :font-size="editorFontSize"
        />
        <TextTab
          v-show="activeTab === 'text'"
          :font-size="editorFontSize"
        />
        <TimeTab
          v-show="activeTab === 'time'"
          :font-size="editorFontSize"
        />
        <RegexTab
          v-show="activeTab === 'regex'"
          :font-size="editorFontSize"
        />
        <EncodeTab
          v-show="activeTab === 'encode'"
          :font-size="editorFontSize"
        />
        <GeneratorTab
          v-show="activeTab === 'generator'"
          :font-size="editorFontSize"
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
import ToolMenu from './components/ToolMenu.vue'
import {
  IS_MAC,
  TAB_BY_KEY,
  TAB_KEYS,
  TAB_TO_GROUP_KEY,
  GROUP_BY_KEY,
  NAV_GROUPS,
  getFirstTabInGroup,
  formatShortcut,
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

const activeTool = computed(() => TAB_BY_KEY[activeTab.value] || TAB_BY_KEY.editor)
const shortcutHint = computed(() => formatShortcut(activeTool.value))
const activeGroup = computed(() => TAB_TO_GROUP_KEY[activeTab.value] || 'workspace')
const activeGroupTools = computed(() => GROUP_BY_KEY[activeGroup.value] || [])
const activeGroupLabel = computed(() =>
  NAV_GROUPS.find((item) => item.key === activeGroup.value)?.label || ''
)
const hasContextualTools = computed(() => activeGroupTools.value.length > 1)
const activeContext = computed(() => {
  if (activeTab.value === 'editor') return currentFile.value || workDir.value || activeTool.value.description
  if (activeTab.value === 'agent') return 'AI · 本地仓库只读研讨'
  return activeTool.value.description
})
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

.contextual-nav {
  flex: 0 0 168px;
  min-width: 168px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--chrome-bg), var(--chrome-bg-muted));
  border-right: 1px solid var(--border-color);
}

.contextual-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  padding: 0 12px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
  font-size: 12px;
  font-weight: 700;
}

.contextual-nav-header span:last-child {
  color: var(--text-faint);
  font-size: 10px;
  font-weight: 500;
}

.context-bar {
  height: 56px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 18px;
  border-bottom: 1px solid var(--border-color);
  background: var(--topbar-bg);
  -webkit-app-region: drag;
}

.context-title {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.context-title > div {
  min-width: 0;
}

.context-icon {
  flex: none;
  color: var(--accent);
}

.context-name {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.1;
}

.context-desc {
  max-width: min(680px, 52vw);
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.context-meta {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.meta-chip {
  color: var(--text-muted);
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 3px 8px;
  font-family: var(--font-mono);
  font-size: 11px;
}

.content-area {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

@media (max-width: 1080px) {
  .context-desc {
    max-width: min(520px, 44vw);
  }

  .context-meta .meta-chip:nth-child(n + 2) {
    display: none;
  }
}

@media (max-width: 760px) {
  .contextual-nav {
    flex-basis: 148px;
    min-width: 148px;
  }
}

@media (max-width: 820px) {
  .context-bar {
    padding: 0 12px;
  }

  .context-meta {
    display: none;
  }

  .context-desc {
    max-width: 48vw;
  }
}
</style>
