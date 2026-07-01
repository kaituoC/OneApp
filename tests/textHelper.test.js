import { describe, expect, it } from 'vitest'
import {
  getTextStats,
  convertTextCase,
  sortLines,
  dedupeLines
} from '../src/renderer/utils/textHelper.js'

describe('textHelper stats', () => {
  it('统计字符、单词、行数、非空行和 UTF-8 字节数', () => {
    const result = getTextStats('Hello 世界\n\nOneApp tools')

    expect(result).toEqual({
      characters: 20,
      words: 5,
      lines: 3,
      nonEmptyLines: 2,
      bytes: 26
    })
  })

  it('空输入统计均为 0', () => {
    expect(getTextStats('')).toEqual({
      characters: 0,
      words: 0,
      lines: 0,
      nonEmptyLines: 0,
      bytes: 0
    })
  })

  it('emoji 按一个字符统计，UTF-8 字节数按真实编码统计', () => {
    const result = getTextStats('A😀')

    expect(result.characters).toBe(2)
    expect(result.bytes).toBe(5)
  })
})

describe('textHelper case conversion', () => {
  it('转换为全大写和全小写', () => {
    expect(convertTextCase('Hello 世界', 'upper').result).toBe('HELLO 世界')
    expect(convertTextCase('Hello 世界', 'lower').result).toBe('hello 世界')
  })

  it('转换为首字母大写样式', () => {
    const result = convertTextCase('hello_world ONE-app 世界', 'title')

    expect(result.success).toBe(true)
    expect(result.result).toBe('Hello World One App 世界')
  })

  it('转换为代码命名风格', () => {
    expect(convertTextCase('hello_world ONE app', 'camel').result).toBe('helloWorldOneApp')
    expect(convertTextCase('hello_world ONE app', 'pascal').result).toBe('HelloWorldOneApp')
    expect(convertTextCase('hello_world ONE app', 'snake').result).toBe('hello_world_one_app')
    expect(convertTextCase('hello_world ONE app', 'kebab').result).toBe('hello-world-one-app')
  })

  it('未知转换类型返回错误', () => {
    const result = convertTextCase('hello', 'unknown')

    expect(result.success).toBe(false)
    expect(result.error).toContain('不支持')
  })
})

describe('textHelper line sorting', () => {
  it('按行升序排序', () => {
    const result = sortLines('banana\napple\ncarrot', 'asc')

    expect(result.success).toBe(true)
    expect(result.result).toBe('apple\nbanana\ncarrot')
  })

  it('按行降序排序并保留空行参与排序', () => {
    const result = sortLines('banana\n\napple', 'desc')

    expect(result.success).toBe(true)
    expect(result.result).toBe('banana\napple\n')
  })
})

describe('textHelper line dedupe', () => {
  it('按行去重并保留首次出现顺序', () => {
    const result = dedupeLines('apple\nbanana\napple\ncarrot\nbanana')

    expect(result.success).toBe(true)
    expect(result.result).toBe('apple\nbanana\ncarrot')
    expect(result.summary).toEqual({
      originalLines: 5,
      remainingLines: 3,
      removedLines: 2
    })
  })

  it('空输入返回空结果和 0 摘要', () => {
    const result = dedupeLines('')

    expect(result.success).toBe(true)
    expect(result.result).toBe('')
    expect(result.summary).toEqual({
      originalLines: 0,
      remainingLines: 0,
      removedLines: 0
    })
  })
})
