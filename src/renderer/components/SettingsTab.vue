<template>
  <div class="settings-tab">
    <section class="setting-section">
      <h3 class="section-title">工作目录</h3>
      <div class="setting-row">
        <span class="current-dir">当前：{{ workDir || '未设置' }}</span>
        <button @click="chooseDir">选择目录</button>
      </div>
    </section>

    <section class="setting-section">
      <h3 class="section-title">界面设置</h3>
      <div class="setting-row">
        <label>主题：</label>
        <div class="btn-group">
          <button :class="{ active: theme === 'dark' }" @click="theme = 'dark'">深色</button>
          <button :class="{ active: theme === 'light' }" @click="theme = 'light'">浅色</button>
        </div>
      </div>
      <div class="setting-row">
        <label>字体大小：</label>
        <div class="btn-group">
          <button
            v-for="size in [12, 14, 16, 18]"
            :key="size"
            :class="{ active: fontSize === size }"
            @click="fontSize = size"
          >
            {{ size }}px
          </button>
        </div>
      </div>
    </section>

    <section class="setting-section">
      <h3 class="section-title">最近文件</h3>
      <div class="recent-files">
        <span v-if="recentFiles.length === 0" class="empty-hint">无最近文件</span>
        <span v-else v-for="f in recentFiles" :key="f" class="file-name">{{ f }}</span>
      </div>
      <button @click="$emit('clear-recent')" :disabled="recentFiles.length === 0">清除记录</button>
    </section>

    <section class="setting-section">
      <h3 class="section-title">快捷键说明</h3>
      <table class="shortcut-table">
        <tbody>
          <tr><td>{{ isMac ? 'Cmd' : 'Ctrl' }}+N</td><td>新建文件</td></tr>
          <tr><td>{{ isMac ? 'Cmd' : 'Ctrl' }}+O</td><td>打开文件</td></tr>
          <tr><td>{{ isMac ? 'Cmd' : 'Ctrl' }}+S</td><td>保存文件</td></tr>
          <tr><td>{{ isMac ? 'Cmd' : 'Ctrl' }}+W</td><td>关闭当前文件</td></tr>
          <tr><td>{{ isMac ? 'Cmd' : 'Ctrl' }}+R / F5</td><td>刷新页面</td></tr>
          <tr><td>{{ isMac ? 'Cmd' : 'Ctrl' }}+Tab</td><td>切换下一个标签</td></tr>
          <tr><td>{{ isMac ? 'Cmd' : 'Ctrl' }}+Shift+Tab</td><td>切换上一个标签</td></tr>
          <tr><td>{{ isMac ? 'Cmd' : 'Ctrl' }}+1~5</td><td>切换到指定标签</td></tr>
          <tr><td>{{ isMac ? 'Cmd+Option+I' : 'Ctrl+Shift+I' }} / F12</td><td>打开/关闭调试工具</td></tr>
        </tbody>
      </table>
    </section>

    <section class="setting-section">
      <h3 class="section-title">关于</h3>
      <div class="about-info">
        <p>OneApp v{{ version }}</p>
        <p>构建于 {{ buildDate }}</p>
        <p class="github-link">
          <span class="link" @click="openGitHub">GitHub: kaituoC/OneApp</span>
          — 如果觉得有用，欢迎 Star 支持 ⭐
        </p>
        <button class="check-update" @click="checkUpdate">检查更新</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { chooseDirectory } from '../utils/fileHelper.js'

const version = __APP_VERSION__
const buildDate = __BUILD_DATE__

const workDir = defineModel('workDir', { type: String, default: '' })
const theme = defineModel('theme', { type: String, default: 'dark' })
const fontSize = defineModel('fontSize', { type: Number, default: 14 })

defineProps({
  recentFiles: { type: Array, default: () => [] }
})

defineEmits(['clear-recent'])

const isMac = computed(() => navigator.platform.toLowerCase().includes('mac'))

async function chooseDir() {
  const dir = await chooseDirectory()
  if (dir) workDir.value = dir
}

function checkUpdate() {
  alert(`当前版本 v${version}，已是最新版本`)
}

function openGitHub() {
  window.electronAPI.openExternal('https://github.com/kaituoC/OneApp')
}
</script>

<style scoped>
.settings-tab {
  padding: 20px;
  overflow-y: auto;
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
}
.setting-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
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
  gap: 4px;
}
.btn-group button.active {
  background: var(--accent);
  border-color: var(--accent);
}
.recent-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
.file-name {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: 3px;
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
  padding: 4px 8px;
  border-bottom: 1px solid var(--border-color);
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
</style>
