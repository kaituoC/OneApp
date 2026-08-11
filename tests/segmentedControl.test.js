// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'
import { handleSegmentedKeydown } from '../src/renderer/utils/segmentedControl.js'

describe('segmented control keyboard behavior', () => {
  it('moves selection with arrows while skipping disabled options', () => {
    document.body.innerHTML = `
      <div role="radiogroup">
        <button role="radio">A</button>
        <button role="radio" disabled>B</button>
        <button role="radio">C</button>
      </div>
    `
    const group = document.querySelector('[role="radiogroup"]')
    const [first, , last] = group.querySelectorAll('[role="radio"]')
    const click = vi.spyOn(last, 'click')
    first.focus()

    handleSegmentedKeydown({
      key: 'ArrowRight',
      currentTarget: group,
      target: first,
      preventDefault: vi.fn()
    })

    expect(click).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(last)
  })

  it('supports Home and End without handling unrelated keys', () => {
    document.body.innerHTML = `
      <div role="radiogroup">
        <button role="radio">A</button>
        <button role="radio">B</button>
      </div>
    `
    const group = document.querySelector('[role="radiogroup"]')
    const [first, last] = group.querySelectorAll('[role="radio"]')
    const firstClick = vi.spyOn(first, 'click')
    const lastClick = vi.spyOn(last, 'click')

    handleSegmentedKeydown({ key: 'End', currentTarget: group, target: first, preventDefault: vi.fn() })
    handleSegmentedKeydown({ key: 'Home', currentTarget: group, target: last, preventDefault: vi.fn() })
    handleSegmentedKeydown({ key: 'Enter', currentTarget: group, target: first, preventDefault: vi.fn() })

    expect(lastClick).toHaveBeenCalledOnce()
    expect(firstClick).toHaveBeenCalledOnce()
  })
})
