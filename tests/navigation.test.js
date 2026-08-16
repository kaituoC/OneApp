import { describe, expect, it } from 'vitest'
import {
  NAV_GROUPS,
  NAV_ITEMS,
  TAB_KEYS,
  GROUP_BY_KEY,
  TAB_TO_GROUP_KEY,
  SUB_TOOLS,
  DEFAULT_SUB_TOOL,
  CYCLE_SHORTCUTS,
  getFirstTabInGroup,
  getNavigationTooltip,
  getShortcutSortValue,
  isCycleNavigationEvent,
  isNumericNavigationEvent
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

  it('数字快捷键按侧栏从上到下的顺序保留 1-9，并将 0 作为第 10 个入口', () => {
    expect(TAB_KEYS).toEqual([
      'editor',
      'json',
      'time',
      'encode',
      'diff',
      'text',
      'regex',
      'generator',
      'agent',
      'settings'
    ])

    const data = NAV_ITEMS.find((item) => item.key === 'json')
    expect(data.label).toBe('数据工具')
    expect(data.description).toContain('JSONPath')
    expect(data.description).toContain('SQL / XML')
    expect(getNavigationTooltip(data, 'Cmd')).toContain('Cmd+2')

    const text = NAV_ITEMS.find((item) => item.key === 'text')
    expect(text.label).toBe('文本处理')
    expect(getNavigationTooltip(text, 'Cmd')).toContain('Cmd+6')

    const time = NAV_ITEMS.find((item) => item.key === 'time')
    expect(time.description).toContain('Cron')
    expect(time.description).toContain('多时区')

    const generator = NAV_ITEMS.find((item) => item.key === 'generator')
    expect(generator.label).toBe('生成器')
    expect(generator.description).toContain('二维码')
    expect(getNavigationTooltip(generator, 'Cmd')).toContain('Cmd+8')
    expect(generator.shortcut).toBe(8)

    const settings = NAV_ITEMS.find((item) => item.key === 'settings')
    expect(settings.shortcut).toBe(0)
    expect(getShortcutSortValue(settings.shortcut)).toBe(10)
  })

  it('一级分组映射能够驱动顶部导航与左侧上下文工具导航', () => {
    const group = NAV_GROUPS.find((item) => item.key === 'generate')

    expect(group.label).toBe('生成工具')
    expect(group.items.map((item) => item.key)).toEqual(['generator'])
    expect(TAB_TO_GROUP_KEY).toMatchObject({
      json: 'transform',
      time: 'transform',
      encode: 'inspect',
      diff: 'inspect',
      text: 'inspect',
      regex: 'inspect'
    })
    expect(GROUP_BY_KEY.transform.map((item) => item.key)).toEqual(['json', 'time'])
    expect(GROUP_BY_KEY.inspect.map((item) => item.key)).toEqual(['diff', 'text', 'regex', 'encode'])
    expect(getFirstTabInGroup('transform')).toBe('json')
    expect(getFirstTabInGroup('inspect')).toBe('diff')
    expect(getFirstTabInGroup('unknown')).toBe('editor')
  })

  it('数字直达按平台使用可靠的修饰键', () => {
    expect(isNumericNavigationEvent({ key: '2', metaKey: true }, true)).toBe(true)
    expect(isNumericNavigationEvent({ key: '2', ctrlKey: true }, true)).toBe(false)
    expect(isNumericNavigationEvent({ key: '2', ctrlKey: true }, false)).toBe(true)
    expect(isNumericNavigationEvent({ key: '2', metaKey: true }, false)).toBe(false)
  })

  it('循环切换始终使用 Ctrl+Tab，并保留 macOS Cmd+Tab', () => {
    expect(CYCLE_SHORTCUTS).toEqual({ next: 'Ctrl+Tab', previous: 'Ctrl+Shift+Tab' })
    expect(isCycleNavigationEvent({ key: 'Tab', ctrlKey: true })).toBe(true)
    expect(isCycleNavigationEvent({ key: 'Tab', ctrlKey: true, shiftKey: true })).toBe(true)
    expect(isCycleNavigationEvent({ key: 'Tab', metaKey: true })).toBe(false)
  })

  it('子工具导航覆盖五个多子工具入口，key 唯一且 label 非空', () => {
    expect(Object.keys(SUB_TOOLS).sort()).toEqual(['encode', 'generator', 'json', 'text', 'time'])

    for (const [tabKey, subs] of Object.entries(SUB_TOOLS)) {
      expect(subs.length).toBeGreaterThan(1)
      const keys = subs.map((sub) => sub.key)
      expect(new Set(keys).size).toBe(keys.length)
      for (const sub of subs) {
        expect(sub.key).toBeTruthy()
        expect(sub.label).toBeTruthy()
      }
      expect(DEFAULT_SUB_TOOL[tabKey]).toBe(subs[0].key)
    }

    // 子工具入口均挂在真实存在的一级工具上
    for (const tabKey of Object.keys(SUB_TOOLS)) {
      expect(NAV_ITEMS.some((item) => item.key === tabKey)).toBe(true)
    }
  })
})
