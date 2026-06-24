<template>
  <div class="app-container">
    <Header :active-tab="activeTab" @tab-change="activeTab = $event" />
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
          :recent-files="recentFiles"
          @clear-recent="recentFiles = []"
        />
      </main>

      <StatusBar :current-file="currentFile" :active-tab="activeTab" />
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import Header from './components/Header.vue'
import EditorTab from './components/EditorTab.vue'
import JsonTab from './components/JsonTab.vue'
import DiffTab from './components/DiffTab.vue'
import TimeTab from './components/TimeTab.vue'
import RegexTab from './components/RegexTab.vue'
import EncodeTab from './components/EncodeTab.vue'
import AgentWorkshopTab from './components/AgentWorkshopTab.vue'
import SettingsTab from './components/SettingsTab.vue'
import StatusBar from './components/StatusBar.vue'
import { TAB_BY_KEY, TAB_KEYS } from './utils/navigation.js'

const activeTab = ref('editor')
const currentFile = ref('')
const workDir = ref('')
const currentTheme = ref('dark')
const editorFontSize = ref(14)
const recentFiles = ref([])

const activeTool = computed(() => TAB_BY_KEY[activeTab.value] || TAB_BY_KEY.editor)
const shortcutHint = computed(() => {
  const isMac = navigator.platform.toLowerCase().includes('mac')
  return `${isMac ? 'Cmd' : 'Ctrl'}+${activeTool.value.shortcut}`
})
const activeContext = computed(() => {
  if (activeTab.value === 'editor') return currentFile.value || workDir.value || activeTool.value.description
  if (activeTab.value === 'agent') return 'AI · 本地仓库只读研讨'
  return activeTool.value.description
})

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

onMounted(async () => {
  const store = await window.electronAPI.getStore()
  workDir.value = store.workDir || getDefaultDir()
  currentTheme.value = store.theme || 'dark'
  editorFontSize.value = store.fontSize || 14
  recentFiles.value = store.recentFiles || []
  applyTheme(currentTheme.value)
})

watch([workDir, currentTheme, editorFontSize, recentFiles], () => {
  const data = {
    workDir: workDir.value,
    theme: currentTheme.value,
    fontSize: editorFontSize.value,
    recentFiles: JSON.parse(JSON.stringify(recentFiles.value))
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
  const primary = e.ctrlKey || e.metaKey
  if (primary && e.key >= '1' && e.key <= '8') {
    e.preventDefault()
    activeTab.value = TAB_KEYS[Number(e.key) - 1]
  }
  if (primary && e.key === 'Tab') {
    e.preventDefault()
    const n = TAB_KEYS.length
    const idx = TAB_KEYS.indexOf(activeTab.value)
    activeTab.value = e.shiftKey
      ? TAB_KEYS[(idx - 1 + n) % n]
      : TAB_KEYS[(idx + 1) % n]
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
  flex-direction: row;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
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
