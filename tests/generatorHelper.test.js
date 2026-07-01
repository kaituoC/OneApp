import { describe, expect, it } from 'vitest'
import {
  generateUuidV4,
  generatePassword,
  generateLorem,
  generateQrCode
} from '../src/renderer/utils/generatorHelper.js'

function sequenceRandom(start = 0) {
  let value = start
  return (length) => {
    const bytes = new Uint8Array(length)
    for (let i = 0; i < length; i += 1) {
      bytes[i] = value % 256
      value += 1
    }
    return bytes
  }
}

describe('generatorHelper UUID', () => {
  it('生成符合 v4 格式的单个 UUID', () => {
    const result = generateUuidV4({ randomBytes: sequenceRandom() })

    expect(result.success).toBe(true)
    expect(result.result).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f')
    expect(result.result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('批量生成 UUID，每行一个', () => {
    const result = generateUuidV4({ count: 2, randomBytes: sequenceRandom() })

    expect(result.success).toBe(true)
    expect(result.values).toHaveLength(2)
    expect(result.result.split('\n')).toHaveLength(2)
  })

  it('UUID 数量越界返回错误', () => {
    expect(generateUuidV4({ count: 0 }).success).toBe(false)
    expect(generateUuidV4({ count: 1001 }).error).toContain('1-1000')
  })
})

describe('generatorHelper password', () => {
  it('按指定长度和字符集生成密码', () => {
    const result = generatePassword({
      length: 8,
      useLowercase: true,
      useUppercase: false,
      useDigits: false,
      useSymbols: false,
      randomBytes: sequenceRandom()
    })

    expect(result.success).toBe(true)
    expect(result.result).toBe('abcdefgh')
  })

  it('排除易混字符', () => {
    const result = generatePassword({
      length: 40,
      useLowercase: true,
      useUppercase: true,
      useDigits: true,
      useSymbols: false,
      excludeSimilar: true,
      randomBytes: sequenceRandom()
    })

    expect(result.success).toBe(true)
    expect(result.result).not.toMatch(/[Il1O0o]/)
  })

  it('字符集为空时返回错误', () => {
    const result = generatePassword({
      useLowercase: false,
      useUppercase: false,
      useDigits: false,
      useSymbols: false
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('至少选择')
  })
})

describe('generatorHelper lorem', () => {
  it('按词数生成 Lorem', () => {
    const result = generateLorem({ mode: 'words', count: 5 })

    expect(result.success).toBe(true)
    expect(result.result.split(/\s+/)).toHaveLength(5)
  })

  it('按句数生成 Lorem', () => {
    const result = generateLorem({ mode: 'sentences', count: 2 })

    expect(result.success).toBe(true)
    expect(result.result.split('.').filter(Boolean)).toHaveLength(2)
  })

  it('按段数生成 Lorem', () => {
    const result = generateLorem({ mode: 'paragraphs', count: 2 })

    expect(result.success).toBe(true)
    expect(result.result.split('\n\n')).toHaveLength(2)
  })

  it('不支持的模式返回错误', () => {
    const result = generateLorem({ mode: 'chapters', count: 1 })

    expect(result.success).toBe(false)
    expect(result.error).toContain('不支持')
  })
})

describe('generatorHelper QR code', () => {
  it('生成 PNG data URL 二维码', async () => {
    const result = await generateQrCode({
      text: 'https://example.com',
      size: 192,
      errorCorrectionLevel: 'Q'
    })

    expect(result.success).toBe(true)
    expect(result.dataUrl).toMatch(/^data:image\/png;base64,/)
    expect(result.size).toBe(192)
    expect(result.errorCorrectionLevel).toBe('Q')
  })

  it('空输入返回错误', async () => {
    const result = await generateQrCode({ text: '   ' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('不能为空')
  })

  it('尺寸越界返回错误', async () => {
    expect((await generateQrCode({ text: 'OneApp', size: 64 })).success).toBe(false)
    expect((await generateQrCode({ text: 'OneApp', size: 2048 })).error).toContain('128-1024')
  })

  it('纠错级别无效返回错误', async () => {
    const result = await generateQrCode({ text: 'OneApp', errorCorrectionLevel: 'Z' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('纠错级别')
  })
})
