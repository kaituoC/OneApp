import { describe, expect, it } from 'vitest'
import {
  createRegexInputSignature,
  isRegexResultCurrent
} from '../src/renderer/composables/useRegexMatcher.js'

describe('regex matcher input snapshots', () => {
  it('uses pattern, flags and full text to identify a result', () => {
    const signature = createRegexInputSignature('\\d+', 'g', 'abc 123')

    expect(isRegexResultCurrent(signature, '\\d+', 'g', 'abc 123')).toBe(true)
    expect(isRegexResultCurrent(signature, '\\d+', 'i', 'abc 123')).toBe(false)
    expect(isRegexResultCurrent(signature, '\\d+', 'g', 'new 456')).toBe(false)
  })

  it('does not collide when input contains separators', () => {
    expect(createRegexInputSignature('a|b', 'g', 'c')).not.toBe(
      createRegexInputSignature('a', 'b|g', 'c')
    )
  })
})
