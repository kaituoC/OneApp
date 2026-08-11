// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import OverflowMenu from '../src/renderer/components/OverflowMenu.vue'

let app

afterEach(() => {
  app?.unmount()
  app = null
  document.body.innerHTML = ''
})

describe('OverflowMenu keyboard behavior', () => {
  it('moves across enabled items and restores focus on Escape', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(OverflowMenu, {
      label: '更多操作',
      items: [
        { key: 'disabled', label: '不可用', disabled: true },
        { key: 'format', label: '格式化' },
        { key: 'clear', label: '清空' }
      ]
    })
    app.mount(host)

    const trigger = host.querySelector('[aria-haspopup="menu"]')
    trigger.click()
    await nextTick()
    await nextTick()
    expect(document.activeElement.textContent.trim()).toBe('格式化')

    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(document.activeElement.textContent.trim()).toBe('清空')
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(document.activeElement).toBe(trigger)
  })

  it('emits the selected key and closes', async () => {
    const onSelect = vi.fn()
    const host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(OverflowMenu, {
      items: [{ key: 'copy', label: '复制' }],
      onSelect
    })
    app.mount(host)

    host.querySelector('[aria-haspopup="menu"]').click()
    await nextTick()
    host.querySelector('[role="menuitem"]').click()
    await nextTick()

    expect(onSelect).toHaveBeenCalledWith('copy')
    expect(host.querySelector('[role="menu"]')).toBeNull()
  })

  it('still closes with Escape when every item is disabled', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(OverflowMenu, {
      items: [{ key: 'disabled', label: '不可用', disabled: true }]
    })
    app.mount(host)

    const trigger = host.querySelector('[aria-haspopup="menu"]')
    trigger.click()
    await nextTick()
    host.querySelector('[role="menu"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()

    expect(host.querySelector('[role="menu"]')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })
})
