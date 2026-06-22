<template>
  <div class="app-container">
    <Header :active-tab="activeTab" @tab-change="activeTab = $event" />
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
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

const activeTab = ref('editor')
const currentFile = ref('')
const workDir = ref('')
const currentTheme = ref('dark')
const editorFontSize = ref(14)
const recentFiles = ref([])

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

const tabs = ['editor', 'json', 'diff', 'time', 'regex', 'encode', 'agent', 'settings']

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key >= '1' && e.key <= '8') {
    e.preventDefault()
    activeTab.value = tabs[Number(e.key) - 1]
  }
  if (e.ctrlKey && e.key === 'Tab') {
    e.preventDefault()
    const n = tabs.length
    const idx = tabs.indexOf(activeTab.value)
    activeTab.value = e.shiftKey
      ? tabs[(idx - 1 + n) % n]
      : tabs[(idx + 1) % n]
  }
  if (e.key === 'F12') {
    e.preventDefault()
    window.electronAPI.toggleDevTools()
  }
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}
.content-area {
  flex: 1;
  overflow: hidden;
  background: var(--bg-primary);
}
</style>
