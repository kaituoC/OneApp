<template>
  <div class="app-container">
    <Header :active-group="activeGroup" :theme="effectiveTheme" @group-change="handleGroupChange" @search="executeCommand('search')" @toggle-theme="currentTheme = effectiveTheme === 'dark' ? 'light' : 'dark'" />
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
      <div v-if="closeState === 'stopping'" class="close-progress" role="status">正在停止活动调用，请等待完成。<button @click="windowApi.commands.cancelClose()">取消关闭（不会恢复调用）</button></div>
      <button v-if="activeTab === 'settings'" class="settings-back" @click="returnFromSettings">← 返回 {{ TAB_BY_KEY[previousTool]?.label }}</button>
      <main class="content-area">
        <EditorTab
          ref="editorTabRef"
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
          @remove-recent="recentFiles = recentFiles.filter(p => p !== $event)"
          @open-recent="openRecent"
        />
      </main>

      <StatusBar :current-file="currentFile" :active-tab="activeTab" />
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed, provide, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
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

const windowApi = window.electronAPI
const editorTabRef = ref(null), previousTool = ref('editor'), closeState = ref('idle')
const nativeDark = ref(false)
const effectiveTheme = computed(() => currentTheme.value === 'system' ? (nativeDark.value ? 'dark' : 'light') : currentTheme.value)
let preferencesLoaded = false, lastPreferences = {}, settingsFocus = null
const subscriptions = []
let composing = false
const beginComposition = () => { composing = true }
const endComposition = () => { composing = false }
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
  if (tabKey === 'settings' && activeTab.value !== 'settings') { previousTool.value = activeTab.value; settingsFocus = document.activeElement }
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

function preferences() {
  return { workDir:workDir.value, theme:currentTheme.value, fontSize:editorFontSize.value, recentFiles:[...recentFiles.value], updateCheckOnLaunch:updateCheckOnLaunch.value, recentTabByGroup:{...recentTabByGroup.value} }
}
onMounted(async () => {
  const store = await windowApi.getStore()
  workDir.value = store.workDir || ''
  currentTheme.value = ['dark','light','system'].includes(store.theme) ? store.theme : 'dark'
  editorFontSize.value = Number.isInteger(store.fontSize) && store.fontSize >= 10 && store.fontSize <= 24 ? store.fontSize : 14
  recentFiles.value = Array.isArray(store.recentFiles) ? store.recentFiles : []
  updateCheckOnLaunch.value = store.updateCheckOnLaunch === true
  recentTabByGroup.value = store.recentTabByGroup || {}
  nativeDark.value = !!store.nativeDark
  await nextTick()
  lastPreferences = preferences(); preferencesLoaded = true
  applyTheme(effectiveTheme.value)
})
watch([workDir,currentTheme,editorFontSize,recentFiles,updateCheckOnLaunch,recentTabByGroup], () => {
  if (!preferencesLoaded) return
  const next = preferences(), patch = {}
  for (const [key,value] of Object.entries(next)) if (JSON.stringify(value) !== JSON.stringify(lastPreferences[key])) patch[key] = value
  lastPreferences = next
  if (Object.keys(patch).length) windowApi.setStore(patch)
}, {deep:true})
watch(effectiveTheme, applyTheme)
watch(activeTab, value => windowApi.commands?.setEditorActive(value === 'editor'), {immediate:true})
function returnFromSettings() {
  setActiveTab(previousTool.value)
  nextTick(() => settingsFocus?.isConnected && settingsFocus.focus())
}
async function openRecent(path) {
  try {
  const result = editorTabRef.value?.hasDirtyDraft(path) ? {success:true,filePath:path} : await windowApi.authorizeRecent(path)
  if (!result.success && !result.canceled) throw new Error(result.error || '无法打开最近文件')
  if (result.success && await editorTabRef.value?.openFromPath(result.filePath)) {setActiveTab('editor'); nextTick(() => editorTabRef.value?.focusEditor())}
  } catch (error) { await windowApi.showMessageBox({type:'error',message:'最近文件打开失败',detail:error.message}) }
}
async function executeCommand(id) {
  if (composing) return
  if (document.querySelector('dialog[open]')) return
  if (id === 'settings') setActiveTab('settings')
  else if (id === 'search') searchRef.value.open()
  else if (id === 'open' || id === 'new') {
    const success = await editorTabRef.value?.executeCommand(id)
    if (success) { setActiveTab('editor'); nextTick(() => editorTabRef.value?.focusEditor()) }
  } else if (activeTab.value === 'editor') await editorTabRef.value?.executeCommand(id)
}
onMounted(() => {
  const commands = windowApi.commands
  if (!commands) return
  subscriptions.push(commands.onCommand(executeCommand), commands.onTheme(value => { nativeDark.value = value }), commands.onCloseState(value => { closeState.value = value }), commands.onCheckClose(async ({id,token}) => {
    let approved = false
    try { approved = await editorTabRef.value.prepareClose(token) } finally { commands.replyClose({id,approved}) }
  }))
})
onUnmounted(() => subscriptions.forEach(unsubscribe => unsubscribe()))

function onFileOpen(filePath) {
  currentFile.value = filePath
  if (!recentFiles.value.includes(filePath)) {
    recentFiles.value.unshift(filePath)
    if (recentFiles.value.length > 10) recentFiles.value.pop()
  }
}

function onKeydown(e) {
  if (e.isComposing) return
  if (document.querySelector('dialog[open]')) return
  if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
    if (windowApi.commands) return
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
  document.addEventListener('compositionstart',beginComposition)
  document.addEventListener('compositionend',endComposition)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('compositionstart',beginComposition)
  document.removeEventListener('compositionend',endComposition)
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
.tool-heading {display:flex;align-items:center;gap:10px;padding:10px 18px;flex:none;}
.tool-heading-icon {display:grid;place-items:center;width:28px;height:28px;border-radius:10px;background:var(--accent-soft);color:var(--accent);}
.tool-heading h1 {font-size:18px;line-height:1.3;font-weight:650;}
.tool-heading p {display:none;font-size:12px;color:var(--text-muted);margin-top:4px;}
.heading-shortcut {margin-left:auto;font-size:11px;color:var(--text-muted);}
.content-area {margin:0 16px 12px;}
.workbench-main {background:var(--bg-primary);}
@media(max-width:900px){.tool-heading{padding:14px 16px}.content-area{margin:0 16px 14px}.tool-heading h1{font-size:20px}.tool-heading-icon{width:35px;height:35px}}
.settings-back{align-self:flex-start;margin:0 16px 8px}.close-progress{padding:8px 16px;background:var(--accent-soft)}
</style>
