// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useCopyToast } from '../src/renderer/composables/useCopyToast.js'

let scope
beforeEach(() => { vi.useFakeTimers(); scope = effectScope() })
afterEach(() => { scope.stop(); delete window.electronAPI; vi.restoreAllMocks(); vi.useRealTimers() })
const useCopy = () => scope.run(() => useCopyToast())

it('等待主进程成功才显示成功，保留完整文本', async () => {
  let finish
  const writeText = vi.fn(() => new Promise(resolve => { finish = resolve }))
  window.electronAPI = { clipboard: { writeText } }
  const { copyMessage, copyToClipboard } = useCopy()
  const pending = copyToClipboard('中文\n文本 ')
  expect(copyMessage.value).toBe('')
  expect(writeText).toHaveBeenCalledWith('中文\n文本 ')
  finish({ success: true })
  expect(await pending).toBe(true)
  expect(copyMessage.value).toBe('已复制')
  await vi.advanceTimersByTimeAsync(1500)
  expect(copyMessage.value).toBe('')
})

it('结构化失败、异常、缺失接口均捕获并提示失败，不回退到浏览器权限', async () => {
  const browserWrite = vi.fn()
  vi.stubGlobal('navigator', { clipboard: { writeText: browserWrite } })
  const { copyMessage, copyToClipboard } = useCopy()
  for (const response of [{ success: false }, undefined, { success: 'true' }]) {
    window.electronAPI = { clipboard: { writeText: vi.fn().mockResolvedValue(response) } }
    expect(await copyToClipboard('data')).toBe(false)
    expect(copyMessage.value).toBe('复制失败')
  }
  window.electronAPI.clipboard.writeText = vi.fn().mockRejectedValue(new Error('denied'))
  expect(await copyToClipboard('data')).toBe(false)
  delete window.electronAPI
  expect(await copyToClipboard('data')).toBe(false)
  expect(copyMessage.value).toBe('复制失败')
  expect(browserWrite).not.toHaveBeenCalled()
  vi.unstubAllGlobals()
})

it('图片只调用 PNG 写入接口，成功及失败分别反馈', async () => {
  const writePng = vi.fn().mockResolvedValueOnce({ success: true }).mockResolvedValueOnce({ success: false })
  window.electronAPI = { clipboard: { writePng } }
  const { copyMessage, copyPngToClipboard } = useCopy()
  expect(await copyPngToClipboard('data:image/png;base64,test')).toBe(true)
  expect(copyMessage.value).toBe('已复制 PNG')
  expect(writePng).toHaveBeenCalledWith('data:image/png;base64,test')
  expect(await copyPngToClipboard('invalid')).toBe(false)
  expect(copyMessage.value).toBe('复制 PNG 失败')
})
