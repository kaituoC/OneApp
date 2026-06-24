import { describe, expect, it } from 'vitest'
import { NAV_ITEMS, getNavigationTooltip } from '../src/renderer/utils/navigation.js'

describe('navigation metadata', () => {
  it('每个导航项都有适合侧栏展示的短说明', () => {
    for (const item of NAV_ITEMS) {
      expect(item.summary).toBeTruthy()
      expect(item.summary.length).toBeLessThanOrEqual(14)
    }
  })

  it('tooltip 包含完整说明和快捷键', () => {
    const editor = NAV_ITEMS.find((item) => item.key === 'editor')

    expect(getNavigationTooltip(editor, 'Cmd')).toContain('编辑器')
    expect(getNavigationTooltip(editor, 'Cmd')).toContain('Markdown / HTML / 纯文本')
    expect(getNavigationTooltip(editor, 'Cmd')).toContain('Cmd+1')
  })
})
