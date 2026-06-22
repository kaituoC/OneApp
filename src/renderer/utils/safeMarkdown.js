// Markdown 安全渲染：marked 解析后用 DOMPurify 消毒。
// Agent 输出可能回显被分析仓库里的恶意内容，经 v-html 注入的 <script>、on* 事件属性、
// javascript: 链接在 Electron 渲染层会触达 window.electronAPI（含文件读写），故必须消毒。
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// 外链统一在新窗口打开并切断 opener 引用，避免反向控制
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

/** 将 Markdown 文本解析为消毒后的安全 HTML 字符串，供 v-html 使用 */
export function safeMarkdown(src) {
  const html = marked.parse(src || '')
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    ALLOW_DATA_ATTR: false
  })
}
