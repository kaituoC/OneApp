// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

const fileMocks = vi.hoisted(() => ({
  openFile: vi.fn(),
  readFile: vi.fn()
}))

const diffCalls = vi.hoisted(() => ({
  split: vi.fn(),
  unified: vi.fn()
}))

vi.mock('../src/renderer/utils/fileHelper.js', () => fileMocks)

vi.mock('../src/renderer/utils/diffHelper.js', async () => {
  const actual = await vi.importActual('../src/renderer/utils/diffHelper.js')
  return {
    ...actual,
    diffTextSplit: (...args) => {
      diffCalls.split(...args)
      return actual.diffTextSplit(...args)
    },
    diffTextUnified: (...args) => {
      diffCalls.unified(...args)
      return actual.diffTextUnified(...args)
    }
  }
})

const { default: DiffTab } = await import('../src/renderer/components/DiffTab.vue')

const mountedApps = []

function mountDiffTab() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(DiffTab, { fontSize: 14, workDir: '/workspace' })
  app.mount(host)
  mountedApps.push(app)
  return host
}

function findButton(host, label) {
  return [...host.querySelectorAll('button')]
    .find(button => button.textContent.trim() === label)
}

async function setTextarea(textarea, value) {
  textarea.value = value
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

async function click(element) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

async function flushAsyncUi() {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

describe('DiffTab edit and result workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fileMocks.openFile.mockResolvedValue('')
    fileMocks.readFile.mockResolvedValue('')
  })

  afterEach(() => {
    while (mountedApps.length) mountedApps.pop().unmount()
    document.body.innerHTML = ''
  })

  it('preserves inputs when editing again and clears only the selected side', async () => {
    const host = mountDiffTab()
    let [textA, textB] = host.querySelectorAll('textarea')
    await setTextarea(textA, 'line 1\nold value')
    await setTextarea(textB, 'line 1\nnew value')

    await click(findButton(host, '对比'))
    expect(host.querySelectorAll('textarea')).toHaveLength(0)
    expect(findButton(host, '编辑内容')).toBeTruthy()

    await click(findButton(host, '编辑内容'))
    ;[textA, textB] = host.querySelectorAll('textarea')
    expect(textA.value).toBe('line 1\nold value')
    expect(textB.value).toBe('line 1\nnew value')

    await setTextarea(textA, 'replacement')
    await click(host.querySelector('[aria-label="清空文本 B"]'))
    ;[textA, textB] = host.querySelectorAll('textarea')
    expect(textA.value).toBe('replacement')
    expect(textB.value).toBe('')
    expect(document.activeElement).toBe(textB)

    await setTextarea(textB, 'next comparison')
    await click(findButton(host, '对比'))
    expect(host.textContent).toContain('replacement')
    expect(host.textContent).toContain('next comparison')

    await click(findButton(host, '清空全部'))
    ;[textA, textB] = host.querySelectorAll('textarea')
    expect(textA.value).toBe('')
    expect(textB.value).toBe('')
    expect(host.querySelector('.diff-summary')).toBeNull()
  })

  it('refreshes once for result-side file loading and swapping but not view changes', async () => {
    const host = mountDiffTab()
    const [textA, textB] = host.querySelectorAll('textarea')
    await setTextarea(textA, 'base text')
    await setTextarea(textB, 'changed text')

    expect(diffCalls.split).not.toHaveBeenCalled()
    expect(diffCalls.unified).not.toHaveBeenCalled()
    await click(findButton(host, '对比'))

    expect(diffCalls.split).toHaveBeenCalledTimes(1)
    expect(diffCalls.unified).toHaveBeenCalledTimes(1)

    await click(findButton(host, '统一'))
    await click(findButton(host, '并排'))
    expect(diffCalls.split).toHaveBeenCalledTimes(1)
    expect(diffCalls.unified).toHaveBeenCalledTimes(1)

    fileMocks.openFile.mockResolvedValueOnce('/workspace/loaded.txt')
    fileMocks.readFile.mockResolvedValueOnce('loaded text')
    await click(findButton(host, '加载文件A'))
    await flushAsyncUi()
    expect(diffCalls.split).toHaveBeenCalledTimes(2)
    expect(diffCalls.unified).toHaveBeenCalledTimes(2)
    expect(host.querySelector('.left .remove .line-text')?.textContent).toBe('loaded text')

    await click(findButton(host, '交换'))
    expect(diffCalls.split).toHaveBeenCalledTimes(3)
    expect(diffCalls.unified).toHaveBeenCalledTimes(3)
    expect(host.querySelector('.left .remove .line-text')?.textContent).toBe('changed text')
    expect(host.querySelector('.right .add .line-text')?.textContent).toBe('loaded text')
  })
})
