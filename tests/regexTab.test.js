// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import RegexTab from '../src/renderer/components/RegexTab.vue'

const workers = []

class MockWorker {
  constructor() {
    this.onmessage = null
    this.messages = []
    this.terminated = false
    workers.push(this)
  }

  postMessage(message) {
    this.messages.push(message)
  }

  terminate() {
    this.terminated = true
  }
}

let app
let host

async function mountRegexTab() {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(RegexTab, { fontSize: 14 })
  app.mount(host)
  await nextTick()
  return host
}

describe('RegexTab interaction semantics', () => {
  beforeEach(() => {
    workers.length = 0
    vi.useFakeTimers()
    vi.stubGlobal('Worker', MockWorker)
  })

  afterEach(() => {
    app?.unmount()
    app = null
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('exposes flag state and supports keyboard-adjustable result height', async () => {
    await mountRegexTab()
    const ignoreCase = [...host.querySelectorAll('.flag')].find((button) => button.textContent === 'i')

    expect(ignoreCase.getAttribute('aria-pressed')).toBe('false')
    expect(ignoreCase.getAttribute('aria-label')).toContain('忽略大小写')
    ignoreCase.click()
    await nextTick()
    expect(ignoreCase.getAttribute('aria-pressed')).toBe('true')

    const splitter = host.querySelector('[role="separator"]')
    expect(splitter.getAttribute('aria-valuenow')).toBe('210')
    splitter.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    await nextTick()
    expect(splitter.getAttribute('aria-valuenow')).toBe('230')
    splitter.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    await nextTick()
    expect(splitter.getAttribute('aria-valuenow')).toBe('210')
  })

  it('clears stale matches immediately when the text snapshot changes', async () => {
    await mountRegexTab()
    await vi.advanceTimersByTimeAsync(250)
    const worker = workers[0]
    const request = worker.messages[0]
    worker.onmessage({
      data: {
        success: true,
        matches: [{ index: 3, end: 11, match: '400-1234', groups: [] }],
        truncated: false,
        gen: request.gen,
        signature: request.signature
      }
    })
    await nextTick()
    expect(host.querySelector('.result-header').textContent).toContain('匹配 1 处')

    const textarea = host.querySelector('textarea')
    textarea.value = '新文本'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    expect(host.querySelector('.result-header').textContent).toContain('匹配 0 处')
    expect(host.querySelector('.preview').textContent).toBe('新文本')
  })

  it('cancels the previous timeout guard as soon as input changes', async () => {
    await mountRegexTab()
    await vi.advanceTimersByTimeAsync(250)
    const worker = workers[0]
    await vi.advanceTimersByTimeAsync(1400)

    const textarea = host.querySelector('textarea')
    textarea.value = '新输入'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    await vi.advanceTimersByTimeAsync(150)

    expect(worker.terminated).toBe(false)
    expect(host.querySelector('.pattern-error')).toBeNull()
  })
})
