<template>
  <AppDialog :open="Boolean(result)" :title="`发现新版本 v${result?.latestVersion || ''}`" width="720px" @close="$emit('close')">
    <div v-if="result" class="update-details">
      <div class="release-meta"><span>当前 v{{ result.currentVersion }} → v{{ result.latestVersion }}</span><span>{{ releaseDate }}</span></div>
      <section class="release-notes" aria-label="更新说明" @click="openNoteLink" @auxclick.prevent="openNoteLink" v-html="notesHtml"></section>
      <div class="download-info">
        <strong>{{ result.downloadUrl ? packageLabel : '当前设备暂无匹配安装包' }}</strong>
        <span v-if="result.downloadUrl">{{ result.assetName }}</span>
        <span v-else>可以在发布页查看其他下载文件。</span>
      </div>
    </div>
    <template #footer>
      <button data-dialog-focus @click="$emit('close')">稍后</button>
      <button @click="openRelease">查看发布页</button>
      <button v-if="result?.downloadUrl" class="primary" @click="download">下载更新</button>
    </template>
  </AppDialog>
</template>
<script setup>
import { computed } from 'vue'
import AppDialog from './AppDialog.vue'
import { renderReleaseNotes, getReleaseNoteLink } from '../utils/releaseNotes.js'
import { isSafeGitHubUrl } from '../utils/updateHelper.js'
const props = defineProps({ result: { type: Object, default: null } })
const emit = defineEmits(['close'])
const notesHtml = computed(() => renderReleaseNotes(props.result?.notesMarkdown || props.result?.notesSummary))
const releaseDate = computed(() => {
  const date = new Date(props.result?.publishedAt || '')
  return Number.isNaN(date.getTime()) ? '发布日期未知' : date.toLocaleDateString('zh-CN')
})
const packageLabel = computed(() => {
  const r = props.result
  const platform = { darwin: 'macOS', win32: 'Windows', linux: 'Linux' }[r?.platform]
  const arch = r?.platform === 'darwin' && r?.arch === 'arm64' ? 'Apple Silicon' : r?.arch
  return platform ? [platform, arch, r?.assetName?.split('.').pop()?.toUpperCase()].filter(Boolean).join(' · ') : '适用于当前设备的安装包'
})
function openRelease() {
  if (isSafeGitHubUrl(props.result?.releaseUrl)) window.electronAPI.openExternal(props.result.releaseUrl)
}
function download() {
  if (!isSafeGitHubUrl(props.result?.downloadUrl)) return
  window.electronAPI.openExternal(props.result.downloadUrl)
  emit('close')
}
function openNoteLink(event) {
  const anchor = event.target.closest('a')
  if (!anchor) return
  event.preventDefault()
  const url = getReleaseNoteLink(anchor.getAttribute('href'))
  if (url) window.electronAPI.openExternal(url)
}
</script>
<style scoped>
.release-meta{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--text-muted);margin-bottom:22px;}
.release-notes{font-size:14px;line-height:1.8;overflow-wrap:anywhere;}
.release-notes :deep(h1),.release-notes :deep(h2),.release-notes :deep(h3),.release-notes :deep(h4){font-size:16px;line-height:1.5;margin:22px 0 10px;}
.release-notes :deep(:first-child){margin-top:0;}
.release-notes :deep(p){margin:10px 0;}
.release-notes :deep(ul),.release-notes :deep(ol){padding-left:24px;margin:10px 0;}
.release-notes :deep(li){margin:7px 0;}
.release-notes :deep(code){font-family:var(--font-mono);font-size:12px;background:var(--surface-subtle);padding:2px 5px;border-radius:4px;}
.release-notes :deep(pre){max-width:100%;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;padding:12px;background:var(--surface-subtle);border-radius:6px;}
.release-notes :deep(a){color:var(--accent);text-decoration:underline;}
.release-notes :deep(blockquote){border-left:3px solid var(--accent);margin:12px 0;padding-left:12px;color:var(--text-secondary);}
.release-notes :deep(table){display:block;overflow:auto;max-width:100%;border-collapse:collapse;}
.release-notes :deep(td),.release-notes :deep(th){padding:8px;border:1px solid var(--border-color);}
.download-info{display:flex;flex-direction:column;gap:5px;margin-top:24px;padding:14px;background:var(--surface-subtle);border-radius:8px;font-size:12px;overflow-wrap:anywhere;}
.download-info span{color:var(--text-muted);}
</style>
