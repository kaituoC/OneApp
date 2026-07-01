import { describe, expect, it } from 'vitest'
import {
  NAV_GROUPS,
  NAV_ITEMS,
  TAB_KEYS,
  getNavigationTooltip,
  getShortcutSortValue
} from '../src/renderer/utils/navigation.js'

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

  it('数字快捷键顺序保留 1-9 并将 0 作为第 10 个入口', () => {
    expect(TAB_KEYS).toEqual([
      'editor',
      'json',
      'diff',
      'text',
      'time',
      'regex',
      'encode',
      'agent',
      'settings',
      'generator'
    ])

    const text = NAV_ITEMS.find((item) => item.key === 'text')
    expect(text.label).toBe('文本处理')
    expect(getNavigationTooltip(text, 'Cmd')).toContain('Cmd+4')

    const generator = NAV_ITEMS.find((item) => item.key === 'generator')
    expect(generator.label).toBe('生成器')
    expect(getNavigationTooltip(generator, 'Cmd')).toContain('Cmd+0')
    expect(getShortcutSortValue(generator.shortcut)).toBe(10)
  })

  it('生成器位于生成工具分组', () => {
    const group = NAV_GROUPS.find((item) => item.key === 'generate')

    expect(group.label).toBe('生成工具')
    expect(group.items.map((item) => item.key)).toEqual(['generator'])
  })
})
