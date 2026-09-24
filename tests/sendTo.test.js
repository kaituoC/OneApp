import { describe, it, expect, vi } from 'vitest'
import { provideSendTo } from '../src/renderer/composables/useSendTo.js'
describe('跨工具输入保护', () => {
  it('空目标直接发送，已有输入先确认；取消不导航不覆盖', () => {
    const select = vi.fn(), sub = vi.fn(), api = provideSendTo(select, sub)
    api.registerInput('json', () => 'existing')
    expect(api.sendTo('json', 'next', 'json')).toBe(true)
    expect(api.pendingInput.value).toBeNull()
    expect(select).not.toHaveBeenCalled()
    api.confirmTransfer('cancel')
    expect(api.transferRequest.value).toBeNull()
    expect(api.pendingInput.value).toBeNull()
    api.sendTo('encode', 'hello', 'base64')
    expect(api.pendingInput.value).toMatchObject({ tabKey:'encode',subKey:'base64',content:'hello' })
  })
  it('追加和替换按明确选择执行，使用目标最新内容', () => {
    const api = provideSendTo(vi.fn(), vi.fn())
    let content = 'old'
    api.registerInput('json', () => content)
    api.sendTo('json','next','json')
    content = 'newest'
    api.confirmTransfer('append')
    expect(api.pendingInput.value.content).toBe('newest\nnext')
    api.sendTo('json','replacement','json')
    api.confirmTransfer('replace')
    expect(api.pendingInput.value.content).toBe('replacement')
  })
  it('不发送无效目标或超出限制的追加内容', () => {
    const api = provideSendTo(vi.fn(), vi.fn())
    expect(api.sendTo('invalid','x')).toBe(false)
    api.registerInput('json', () => 'x'.repeat(512*1024))
    api.sendTo('json','next','json')
    expect(api.confirmTransfer('append')).toBe(false)
    expect(api.pendingInput.value).toBeNull()
  })
})
