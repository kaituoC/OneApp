import { describe, it, expect } from 'vitest'
import { runRegex, MAX_MATCHES } from '../src/renderer/utils/regexHelper.js'

describe('regexHelper', () => {
  describe('runRegex 基础匹配', () => {
    it('单次匹配（无 g）只返回第一处', () => {
      const r = runRegex('\\d+', '', 'a1 b2 c3')
      expect(r.success).toBe(true)
      expect(r.count).toBe(1)
      expect(r.matches[0].match).toBe('1')
      expect(r.matches[0].index).toBe(1)
      expect(r.matches[0].end).toBe(2)
    })

    it('global 匹配返回全部命中', () => {
      const r = runRegex('\\d+', 'g', 'a1 b22 c333')
      expect(r.success).toBe(true)
      expect(r.count).toBe(3)
      expect(r.matches.map(m => m.match)).toEqual(['1', '22', '333'])
    })

    it('i 标志忽略大小写', () => {
      const r = runRegex('abc', 'gi', 'ABC abc AbC')
      expect(r.count).toBe(3)
    })
  })

  describe('捕获组', () => {
    it('返回每个捕获组的值与位置', () => {
      const r = runRegex('(\\d{3})-(\\d{4})', 'g', '400-1234 987-6543')
      expect(r.count).toBe(2)
      const g = r.matches[0].groups
      expect(g).toHaveLength(2)
      expect(g[0].value).toBe('400')
      expect(g[0].index).toBe(0)
      expect(g[0].end).toBe(3)
      expect(g[1].value).toBe('1234')
    })

    it('命名组附带 name', () => {
      const r = runRegex('(?<area>\\d{3})-(?<num>\\d{4})', '', '400-1234')
      const g = r.matches[0].groups
      expect(g[0].name).toBe('area')
      expect(g[1].name).toBe('num')
    })

    it('未参与匹配的可选组 value 为 null', () => {
      const r = runRegex('(a)(b)?', '', 'a')
      const g = r.matches[0].groups
      expect(g[0].value).toBe('a')
      expect(g[1].value).toBeNull()
    })
  })

  describe('边界情况', () => {
    it('空 pattern 返回无匹配', () => {
      const r = runRegex('', 'g', 'anything')
      expect(r.success).toBe(true)
      expect(r.count).toBe(0)
      expect(r.matches).toEqual([])
    })

    it('非法 pattern 返回 error', () => {
      const r = runRegex('(\\d', 'g', 'text')
      expect(r.success).toBe(false)
      expect(r.error).toBeDefined()
    })

    it('global 零宽匹配不死循环', () => {
      const r = runRegex('', 'g', 'abc') // 空 pattern 已被前置拦截
      expect(r.success).toBe(true)
      // 用真正的零宽 pattern 验证推进
      const r2 = runRegex('(?:)', 'g', 'abc')
      expect(r2.success).toBe(true)
      expect(r2.count).toBeGreaterThan(0)
      expect(r2.count).toBeLessThanOrEqual(4) // 每个位置一次空匹配
    })

    it('零宽断言 \\b 全局匹配', () => {
      const r = runRegex('\\b', 'g', 'a b')
      expect(r.success).toBe(true)
      expect(r.count).toBeGreaterThan(0)
    })
  })

  describe('海量匹配截断', () => {
    it('命中数超过 MAX_MATCHES 时截断并标记', () => {
      const text = 'a'.repeat(MAX_MATCHES + 100)
      const r = runRegex('a', 'g', text)
      expect(r.success).toBe(true)
      expect(r.truncated).toBe(true)
      expect(r.count).toBe(MAX_MATCHES)
    })

    it('未超量时 truncated 为 false', () => {
      const r = runRegex('a', 'g', 'aaa')
      expect(r.truncated).toBe(false)
      expect(r.count).toBe(3)
    })
  })
})
