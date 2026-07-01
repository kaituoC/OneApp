import { describe, expect, it } from 'vitest'
import {
  csvToJson,
  jsonToCsv,
  previewCsvTable
} from '../src/renderer/utils/csvHelper.js'

describe('csvHelper csvToJson', () => {
  it('将带表头 CSV 转为对象数组', () => {
    const result = csvToJson('name,age\nAda,36\nLinus,55')

    expect(result.success).toBe(true)
    expect(result.result).toBe(JSON.stringify([
      { name: 'Ada', age: '36' },
      { name: 'Linus', age: '55' }
    ], null, 2))
  })

  it('正确处理字段内逗号、换行和双引号转义', () => {
    const input = 'name,note\n"Ada","hello, world"\n"Linus","line 1\nline ""2"""'
    const result = csvToJson(input)

    expect(result.success).toBe(true)
    expect(JSON.parse(result.result)).toEqual([
      { name: 'Ada', note: 'hello, world' },
      { name: 'Linus', note: 'line 1\nline "2"' }
    ])
  })

  it('列数不一致时返回错误', () => {
    const result = csvToJson('name,age\nAda,36,extra')

    expect(result.success).toBe(false)
    expect(result.displayMessage).toContain('列数')
  })
})

describe('csvHelper jsonToCsv', () => {
  it('将对象数组转为 CSV，字段来自所有 key 的并集', () => {
    const result = jsonToCsv(JSON.stringify([
      { name: 'Ada', age: 36 },
      { name: 'Linus', city: 'Helsinki' }
    ]))

    expect(result.success).toBe(true)
    expect(result.result).toContain('name,age,city')
    expect(result.result).toContain('Ada,36,')
    expect(result.result).toContain('Linus,,Helsinki')
  })

  it('JSON 不是对象数组时返回错误', () => {
    const result = jsonToCsv('{"name":"Ada"}')

    expect(result.success).toBe(false)
    expect(result.displayMessage).toContain('对象数组')
  })
})

describe('csvHelper previewCsvTable', () => {
  it('返回只读表格预览数据', () => {
    const result = previewCsvTable('name,age\nAda,36')

    expect(result.success).toBe(true)
    expect(result.table.headers).toEqual(['name', 'age'])
    expect(result.table.rows).toEqual([['Ada', '36']])
  })

  it('空输入返回错误', () => {
    const result = previewCsvTable('')

    expect(result.success).toBe(false)
    expect(result.displayMessage).toContain('不能为空')
  })
})
