<template>
  <div class="settings-tab tool-page-scroll">
    <header class="settings-hero">
      <div>
        <h2>设置</h2>
        <p>工作目录、界面偏好、最近文件和快捷键。</p>
      </div>
      <span class="version-pill">v{{ version }}</span>
    </header>

    <div class="settings-navigation tool-segmented" role="radiogroup" aria-label="设置分区" @keydown="handleSegmentedKeydown">
      <button
        v-for="section in SETTING_SECTIONS"
        :key="section.key"
        role="radio"
        :aria-checked="activeSection === section.key"
        :class="{ active: activeSection === section.key }"
        @click="activeSection = section.key"
      >{{ section.label }}</button>
    </div>

    <section v-show="activeSection === 'general'" class="setting-section">
      <h3 class="section-title">工作目录</h3>
      <div class="setting-row">
        <span class="current-dir">当前：{{ workDir || '未设置' }}</span>
        <button @click="chooseDir">选择目录</button>
      </div>
    </section>

    <section v-show="activeSection === 'general'" class="setting-section">
      <h3 class="section-title">界面设置</h3>
      <div class="setting-row">
        <label>主题：</label>
        <div class="btn-group" role="radiogroup" aria-label="主题" @keydown="handleSegmentedKeydown">
          <button role="radio" :aria-checked="theme === 'dark'" :class="{ active: theme === 'dark' }" @click="theme = 'dark'">深色</button>
          <button role="radio" :aria-checked="theme === 'light'" :class="{ active: theme === 'light' }" @click="theme = 'light'">浅色</button>
        </div>
      </div>
      <div class="setting-row">
        <label>字体大小：</label>
        <div class="btn-group" role="radiogroup" aria-label="编辑字号" @keydown="handleSegmentedKeydown">
          <button
            v-for="size in [12, 14, 16, 18]"
            :key="size"
            role="radio"
            :aria-checked="fontSize === size"
            :class="{ active: fontSize === size }"
            @click="fontSize = size"
          >
            {{ size }}px
          </button>
        </div>
      </div>
    </section>

    <section v-show="activeSection === 'recent'" class="setting-section">
      <h3 class="section-title">最近文件</h3>
      <div class="recent-files">
        <span v-if="recentFiles.length === 0" class="empty-hint">无最近文件</span>
        <span v-else v-for="item in recentFileItems" :key="item.path" class="file-name" :title="item.path">
          <span class="file-title">{{ item.name }}</span>
          <span class="file-path">{{ item.dir }}</span>
        </span>
      </div>
      <button @click="$emit('clear-recent')" :disabled="recentFiles.length === 0">清除记录</button>
    </section>

    <section v-show="activeSection === 'shortcuts'" class="setting-section">
      <h3 class="section-title">快捷键说明</h3>
      <table class="shortcut-table">
        <tbody>
          <tr><td>{{ SHORTCUT_MODIFIER }}+N</td><td>新建文件</td></tr>
          <tr><td>{{ SHORTCUT_MODIFIER }}+O</td><td>打开文件</td></tr>
          <tr><td>{{ SHORTCUT_MODIFIER }}+S</td><td>保存文件</td></tr>
          <tr><td>{{ SHORTCUT_MODIFIER }}+W</td><td>关闭当前文件</td></tr>
          <tr><td>{{ SHORTCUT_MODIFIER }}+R / F5</td><td>刷新页面</td></tr>
          <tr><td>{{ CYCLE_SHORTCUTS.next }}</td><td>切换下一个工具</td></tr>
          <tr><td>{{ CYCLE_SHORTCUTS.previous }}</td><td>切换上一个工具</td></tr>
          <tr><td>{{ SHORTCUT_MODIFIER }}+1~9 / 0</td><td>切换到指定工具</td></tr>
          <tr><td>{{ isMac ? 'Cmd+Option+I' : 'Ctrl+Shift+I' }} / F12</td><td>打开/关闭调试工具</td></tr>
        </tbody>
      </table>
    </section>

    <section v-show="activeSection === 'about'" class="setting-section">
      <h3 class="section-title">关于</h3>
      <div class="about-info">
        <p>OneApp v{{ version }}</p>
        <p>构建于 {{ buildDate }}</p>
        <p class="github-link">
          <span class="link" @click="openGitHub">GitHub: kaituoC/OneApp</span>
          - 如果觉得有用，欢迎 Star 支持
        </p>
        <button class="check-update" @click="checkUpdate" :disabled="checkingUpdate">
          {{ checkingUpdate ? '检查中...' : '检查更新' }}
        </button>
        <label class="update-launch-toggle">
          <input v-model="updateCheckOnLaunch" type="checkbox">
          启动时每天检查一次更新
        </label>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { chooseDirectory } from '../utils/fileHelper.js'
import { CYCLE_SHORTCUTS, IS_MAC, SHORTCUT_MODIFIER } from '../utils/navigation.js'
import { handleSegmentedKeydown } from '../utils/segmentedControl.js'

const version = __APP_VERSION__
const buildDate = __BUILD_DATE__

const workDir = defineModel('workDir', { type: String, default: '' })
const theme = defineModel('theme', { type: String, default: 'dark' })
const fontSize = defineModel('fontSize', { type: Number, default: 14 })
const updateCheckOnLaunch = defineModel('updateCheckOnLaunch', { type: Boolean, default: false })

const props = defineProps({
  recentFiles: { type: Array, default: () => [] }
})

defineEmits(['clear-recent'])

const isMac = IS_MAC
const checkingUpdate = ref(false)
const activeSection = ref('general')
const SETTING_SECTIONS = [
  { key: 'general', label: '常用设置' },
  { key: 'recent', label: '最近文件' },
  { key: 'shortcuts', label: '快捷键' },
  { key: 'about', label: '关于' }
]

const recentFileItems = computed(() => props.recentFiles.map((path) => {
  const parts = String(path).split(/[\\/]/)
  const name = parts.pop() || path
  const dir = parts.join('/') || '/'
  return { path, name, dir }
}))

async function chooseDir() {
  const dir = await chooseDirectory()
  if (dir) workDir.value = dir
}

function formatReleaseDate(value) {
  if (!value) return '未知'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未知'
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

async function checkUpdate() {
  if (checkingUpdate.value) return

  checkingUpdate.value = true
  try {
    const result = await window.electronAPI.updates.check()
    await showUpdateResult(result, { showNoUpdate: true })
  } finally {
    checkingUpdate.value = false
  }
}

async function showUpdateResult(result, { showNoUpdate = false } = {}) {
  if (!result?.success) {
    await window.electronAPI.showMessageBox({
      type: 'error',
      title: '检查更新失败',
      message: '检查更新失败',
      detail: result?.error || '暂时无法获取最新版本信息，请稍后再试。'
    })
    return
  }

  if (!result.updateAvailable) {
    if (!showNoUpdate) return
    await window.electronAPI.showMessageBox({
      type: 'info',
      title: '检查更新',
      message: '已是最新版本',
      detail: `当前版本 v${result.currentVersion} 已是最新版本。`
    })
    return
  }

  const hasDownload = Boolean(result.downloadUrl)
  const primaryLabel = hasDownload ? '下载更新' : '查看发布页'

  const response = await window.electronAPI.showMessageBox({
    type: 'info',
    title: '发现新版本',
    message: `发现新版本 v${result.latestVersion}`,
    detail: [
      `当前版本：v${result.currentVersion}`,
      `发布日期：${formatReleaseDate(result.publishedAt)}`,
      hasDownload ? `安装包：${result.assetName}` : '未找到适用于当前设备的安装包，可在发布页查看所有文件。',
      '',
      result.notesSummary
    ].join('\n'),
    buttons: [primaryLabel, '稍后'],
    defaultId: 0,
    cancelId: 1
  })

  if (response?.response === 0) {
    window.electronAPI.openExternal(result.downloadUrl || result.releaseUrl)
  }
}

const unsubscribeUpdateAvailable = window.electronAPI.updates.onAvailable((result) => {
  showUpdateResult(result)
})

onUnmounted(() => unsubscribeUpdateAvailable?.())

function openGitHub() {
  window.electronAPI.openExternal('https://github.com/kaituoC/OneApp')
}
</script>

<style scoped>
.settings-tab {
  padding: 20px;
  overflow-y: auto;
  max-width: 860px;
  margin: 0 auto;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
}
.settings-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 18px;
  background: linear-gradient(135deg, var(--bg-secondary), var(--surface-raised));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}
.settings-navigation {
  position: sticky;
  top: -20px;
  z-index: 4;
  margin-bottom: 16px;
  background: var(--bg-secondary);
}
.settings-hero h2 {
  font-size: 20px;
  margin-bottom: 4px;
}
.settings-hero p {
  color: var(--text-muted);
  font-size: 13px;
}
.version-pill {
  flex: none;
  border: 1px solid var(--accent-border);
  border-radius: 999px;
  padding: 4px 10px;
  color: var(--accent);
  background: var(--accent-soft);
  font-family: var(--font-mono);
  font-size: 12px;
}
.setting-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 16px;
}
.section-title {
  font-size: 14px;
  margin-bottom: 12px;
  color: var(--text-primary);
}
.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.setting-row label {
  min-width: 80px;
  font-size: 13px;
  color: var(--text-secondary);
}
.current-dir {
  flex: 1;
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.btn-group {
  display: flex;
  gap: 6px;
}
.btn-group button.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.recent-files {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}
.file-name {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}
.file-title {
  color: var(--text-primary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-path {
  color: var(--text-muted);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.empty-hint {
  font-size: 12px;
  color: var(--text-secondary);
}
.shortcut-table {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
}
.shortcut-table td {
  padding: 7px 8px;
  border-bottom: 1px solid var(--border-subtle);
}
.shortcut-table td:first-child {
  font-family: var(--font-mono);
  color: var(--accent);
  white-space: nowrap;
}
.about-info p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.github-link .link {
  color: var(--accent);
  text-decoration: none;
  cursor: pointer;
}
.github-link .link:hover {
  text-decoration: underline;
}
.check-update {
  margin-top: 8px;
}
.update-launch-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
}
</style>
