import DOMPurify from 'dompurify'
import { safeMarkdown } from './safeMarkdown.js'

// 更新详情不加载远端媒体；外链由点击事件校验后交给已有系统接口。
export function renderReleaseNotes(notes) {
  return DOMPurify.sanitize(safeMarkdown(notes || '暂无更新说明。'), {
    FORBID_TAGS: ['img', 'video', 'audio', 'source', 'svg', 'button', 'input'],
    FORBID_ATTR: ['style', 'id', 'name'],
    ALLOWED_URI_REGEXP: /^https:\/\//i
  })
}

export function getReleaseNoteLink(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''
  } catch { return '' }
}
