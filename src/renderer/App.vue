<template>
  <div class="app-container">
    <Header :active-tab="activeTab" @tab-change="activeTab = $event" />
    <main class="content-area">
      <MarkdownTab
        v-show="activeTab === 'markdown'"
        :work-dir="workDir"
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
import MarkdownTab from './components/MarkdownTab.vue'
import JsonTab from './components/JsonTab.vue'
import DiffTab from './components/DiffTab.vue'
import TimeTab from './components/TimeTab.vue'
import SettingsTab from './components/SettingsTab.vue'
import StatusBar from './components/StatusBar.vue'

const activeTab = ref('markdown')
const currentFile = ref('')
const workDir = ref('')
const currentTheme = ref('dark')
const editorFontSize = ref(14)
const recentFiles = ref([])

// 应用主题到 DOM
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

// 监听主题变化并应用
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

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === '1') { e.preventDefault(); activeTab.value = 'markdown' }
  if (e.ctrlKey && e.key === '2') { e.preventDefault(); activeTab.value = 'json' }
  if (e.ctrlKey && e.key === '3') { e.preventDefault(); activeTab.value = 'diff' }
  if (e.ctrlKey && e.key === '4') { e.preventDefault(); activeTab.value = 'time' }
  if (e.ctrlKey && e.key === '5') { e.preventDefault(); activeTab.value = 'settings' }
  if (e.ctrlKey && e.key === 'Tab') {
    e.preventDefault()
    const tabs = ['markdown', 'json', 'diff', 'time', 'settings']
    const idx = tabs.indexOf(activeTab.value)
    activeTab.value = e.shiftKey
      ? tabs[(idx - 1 + 5) % 5]
      : tabs[(idx + 1) % 5]
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
