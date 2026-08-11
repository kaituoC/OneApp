// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'
import { publishToolStatus, TOOL_STATUS_EVENT } from '../src/renderer/utils/toolStatus.js'

describe('tool status event', () => {
  it('publishes scoped feedback for the global status bar', () => {
    const listener = vi.fn()
    window.addEventListener(TOOL_STATUS_EVENT, listener, { once: true })

    publishToolStatus('格式化完成', 'success')

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0][0].detail).toEqual({ message: '格式化完成', tone: 'success' })
  })
})
