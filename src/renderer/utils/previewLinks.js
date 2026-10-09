export async function handlePreviewLink(event, root) {
  const link = event.target.closest?.('a[href]')
  if (!link) return
  const href = link.getAttribute('href')
  event.preventDefault()
  if (href.startsWith('#')) {
    try { root?.querySelector(`[id="${CSS.escape(decodeURIComponent(href.slice(1)))}"]`)?.scrollIntoView() } catch { /* 无效锚点留在预览 */ }
    return
  }
  try {
    let url
    try { url = new URL(href) } catch { throw new Error('相对文件链接暂不支持，请通过文件列表打开目标文件。') }
    if (url.protocol !== 'https:') throw new Error('仅支持 HTTPS 外链；相对文件链接暂不支持。')
    await window.electronAPI.openExternal(url.href)
  } catch (error) {
    await window.electronAPI.showMessageBox({ type:'info', message:'无法打开此链接', detail:error.message, buttons:['确定'] })
  }
}
