import { describe, it, expect } from 'vitest'
import { diffTextUnified, diffTextSplit, diffStats } from '../src/renderer/utils/diffHelper.js'

describe('diffHelper', () => {
  describe('diffTextUnified', () => {
    it('should detect added lines', () => {
      const textA = 'line1'
      const textB = 'line1\nline2'
      const result = diffTextUnified(textA, textB)
      // diff-match-patch 会将 \n 分割成单独的元素
      expect(result.some(item => item.type === 'add')).toBe(true)
      expect(result.some(item => item.text === 'line2')).toBe(true)
    })

    it('should detect removed lines', () => {
      const textA = 'line1\nline2'
      const textB = 'line1'
      const result = diffTextUnified(textA, textB)
      expect(result.some(item => item.type === 'remove')).toBe(true)
      expect(result.some(item => item.text === 'line2')).toBe(true)
    })

    it('should handle identical texts', () => {
      const textA = 'line1\nline2'
      const textB = 'line1\nline2'
      const result = diffTextUnified(textA, textB)
      expect(result.every(item => item.type === 'equal')).toBe(true)
    })

    it('should handle completely different texts', () => {
      const textA = 'abc'
      const textB = 'xyz'
      const result = diffTextUnified(textA, textB)
      expect(result.some(item => item.type === 'remove')).toBe(true)
      expect(result.some(item => item.type === 'add')).toBe(true)
    })

    it('should handle empty texts', () => {
      const textA = ''
      const textB = 'line1'
      const result = diffTextUnified(textA, textB)
      expect(result.length).toBe(1)
      expect(result[0].type).toBe('add')
    })

    it('should handle multiline changes', () => {
      const textA = 'line1\nline2\nline3'
      const textB = 'line1\nmodified\nline3'
      const result = diffTextUnified(textA, textB)
      expect(result.some(item => item.type === 'remove')).toBe(true)
      expect(result.some(item => item.type === 'add')).toBe(true)
    })
  })

  describe('diffTextSplit', () => {
    it('should produce split view with left and right', () => {
      const textA = 'line1\nline2'
      const textB = 'line1\nline3'
      const result = diffTextSplit(textA, textB)
      expect(result.length).toBe(3)
      expect(result[0].left.type).toBe('equal')
      expect(result[0].right.type).toBe('equal')
    })

    it('should show removed line on left with empty right', () => {
      const textA = 'line1\nline2'
      const textB = 'line1'
      const result = diffTextSplit(textA, textB)
      const removedItem = result.find(item => item.left.type === 'remove')
      expect(removedItem).toBeDefined()
      expect(removedItem.right.type).toBe('empty')
    })

    it('should show added line on right with empty left', () => {
      const textA = 'line1'
      const textB = 'line1\nline2'
      const result = diffTextSplit(textA, textB)
      const addedItem = result.find(item => item.right.type === 'add')
      expect(addedItem).toBeDefined()
      expect(addedItem.left.type).toBe('empty')
    })

    it('should preserve line numbers', () => {
      const textA = 'line1\nline2\nline3'
      const textB = 'line1\nline2\nline3'
      const result = diffTextSplit(textA, textB)
      expect(result[0].left.lineNum).toBe(1)
      expect(result[1].left.lineNum).toBe(2)
      expect(result[2].left.lineNum).toBe(3)
    })

    it('should handle identical texts', () => {
      const textA = 'line1\nline2'
      const textB = 'line1\nline2'
      const result = diffTextSplit(textA, textB)
      expect(result.every(item => item.left.type === 'equal' && item.right.type === 'equal')).toBe(true)
    })
  })

  describe('diffStats', () => {
    it('should count added lines in unified mode', () => {
      const diffResult = [
        { type: 'equal', text: 'line1' },
        { type: 'add', text: 'line2' },
        { type: 'add', text: 'line3' }
      ]
      const stats = diffStats(diffResult, 'unified')
      expect(stats.added).toBe(2)
      expect(stats.removed).toBe(0)
    })

    it('should count removed lines in unified mode', () => {
      const diffResult = [
        { type: 'equal', text: 'line1' },
        { type: 'remove', text: 'line2' },
        { type: 'remove', text: 'line3' }
      ]
      const stats = diffStats(diffResult, 'unified')
      expect(stats.added).toBe(0)
      expect(stats.removed).toBe(2)
    })

    it('should count modifications correctly', () => {
      const diffResult = [
        { type: 'equal', text: 'line1' },
        { type: 'remove', text: 'line2' },
        { type: 'add', text: 'line2_modified' }
      ]
      const stats = diffStats(diffResult, 'unified')
      expect(stats.modified).toBe(1)
      expect(stats.added).toBe(0)
      expect(stats.removed).toBe(0)
    })

    it('should count in split mode', () => {
      const diffResult = [
        { left: { type: 'equal', text: 'line1' }, right: { type: 'equal', text: 'line1' } },
        { left: { type: 'remove', text: 'line2' }, right: { type: 'empty', text: '' } },
        { left: { type: 'empty', text: '' }, right: { type: 'add', text: 'line3' } }
      ]
      const stats = diffStats(diffResult, 'split')
      // modified 计算方式：min(added, removed) = min(1, 1) = 1
      // 所以 netAdded = added - modified = 1 - 1 = 0
      // netRemoved = removed - modified = 1 - 1 = 0
      expect(stats.modified).toBe(1)
      expect(stats.added).toBe(0)
      expect(stats.removed).toBe(0)
    })
  })
})