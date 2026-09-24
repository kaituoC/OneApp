// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import AppDialog from '../src/renderer/components/AppDialog.vue'
import TransferDialog from '../src/renderer/components/TransferDialog.vue'
import UpdateDialog from '../src/renderer/components/UpdateDialog.vue'
import { renderReleaseNotes, getReleaseNoteLink } from '../src/renderer/utils/releaseNotes.js'
const apps = []
const tick = async () => { await nextTick(); await nextTick() }
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); queueMicrotask(() => this.dispatchEvent(new Event('close'))) }
})
function mount(render) {
  const host = document.createElement('div'); document.body.append(host)
  const app = createApp({ render }); app.mount(host); apps.push(app)
}
afterEach(() => { apps.splice(0).forEach(app => app.unmount()); document.body.innerHTML = ''; vi.unstubAllGlobals() })
describe('详情弹窗', () => {
  it('完整说明保留标题列表代码，过滤脚本媒体与危险链接', () => {
    const html = renderReleaseNotes('## 新增\n\n- **功能**\n- `code`\n\n<script>bad()</script><img src="https://example.com/a.png"><a href="javascript:bad()">危险</a>')
    expect(html).toContain('<h2>新增</h2>')
    expect(html).toContain('<li>')
    expect(html).toContain('<code>code</code>')
    expect(html).not.toMatch(/<script|<img|javascript:/)
    expect(getReleaseNoteLink('file:///tmp/a')).toBe('')
    expect(getReleaseNoteLink('https://example.com/help')).toBe('https://example.com/help')
  })
  it('第二个弹窗等待第一个关闭，关闭后恢复焦点', async () => {
    const trigger = document.createElement('button'); document.body.append(trigger); trigger.focus()
    const first = ref(true), second = ref(false)
    mount(() => h('div', [h(AppDialog, { open: first.value, title: '第一个', onClose: () => { first.value = false } }), h(AppDialog, { open: second.value, title: '第二个', onClose: () => { second.value = false } })]))
    await tick()
    second.value = true; await tick()
    expect(document.querySelectorAll('dialog[open]')).toHaveLength(1)
    expect(document.querySelector('dialog[open]').getAttribute('aria-label')).toBe('第一个')
    document.querySelector('dialog[open]').dispatchEvent(new Event('cancel'))
    await tick(); await tick()
    expect(document.querySelector('dialog[open]').getAttribute('aria-label')).toBe('第二个')
    second.value = false; await tick()
    expect(document.activeElement).toBe(trigger)
  })
  it('临时弹窗卸载后继续显示等待中的更新', async () => {
    const first = ref(true)
    mount(() => h('div', [first.value ? h(AppDialog, { open: true, title: '帮助', onClose: () => { first.value = false } }) : null, h(AppDialog, { open: true, title: '更新' })]))
    await tick()
    expect(document.querySelectorAll('dialog[open]')).toHaveLength(1)
    document.querySelector('dialog[open]').dispatchEvent(new Event('cancel'))
    await tick(); await tick()
    expect(document.querySelector('dialog[open]').getAttribute('aria-label')).toBe('更新')
  })
  it('迟到的 close 事件不会取消已排队的新请求', async () => {
    const busy = ref(true), open = ref(false)
    const close = vi.fn(() => { open.value = false })
    mount(() => h('div', [h(AppDialog, { open: busy.value, title: '忙碌' }), h(AppDialog, { open: open.value, title: '等待', onClose: close })]))
    await tick(); open.value = true; await tick()
    document.querySelector('dialog[aria-label="等待"]').dispatchEvent(new Event('close'))
    await tick(); expect(close).not.toHaveBeenCalled()
    busy.value = false; await tick(); await tick()
    expect(document.querySelector('dialog[open]').getAttribute('aria-label')).toBe('等待')
  })
  it('发送确认展示完整内容且取消不执行替换', async () => {
    const choose = vi.fn(), text = '长文本'.repeat(500)
    mount(() => h(TransferDialog, { request: { label: 'JSON', existing: text, content: 'new' }, onChoose: choose }))
    await tick()
    expect(document.querySelector('pre').textContent).toBe(text)
    expect(document.activeElement.textContent).toBe('取消')
    document.querySelector('dialog').dispatchEvent(new Event('cancel'))
    expect(choose).toHaveBeenCalledWith('cancel')
  })
  it('更新内容不截断，无包时提供发布页，外链经安全接口打开', async () => {
    const openExternal = vi.fn(); window.electronAPI = { openExternal }
    const notes = '## 新增\n\n- 内容\n\n'.repeat(40) + '[帮助](https://example.com/help)'
    mount(() => h(UpdateDialog, { result: { currentVersion: '1.30.0', latestVersion: '1.30.1', notesMarkdown: notes, releaseUrl: 'https://github.com/kaituoC/OneApp/releases/tag/v1.30.1' } }))
    await tick()
    expect(document.querySelectorAll('.release-notes h2')).toHaveLength(40)
    expect(document.body.textContent).toContain('暂无匹配安装包')
    expect([...document.querySelectorAll('button')].some(b => b.textContent === '下载更新')).toBe(false)
    document.querySelector('.release-notes a').click()
    expect(openExternal).toHaveBeenCalledWith('https://example.com/help')
  })
})
