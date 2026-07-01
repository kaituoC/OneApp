import { describe, expect, it } from 'vitest'
import { queryJSONPath } from '../src/renderer/utils/jsonPathHelper.js'

const sample = JSON.stringify({
  users: [
    { id: 1, name: 'Ada', active: true },
    { id: 2, name: 'Linus', active: false }
  ],
  meta: { count: 2 }
})

describe('jsonPathHelper', () => {
  it('查询单个字段并输出格式化 JSON', () => {
    const result = queryJSONPath(sample, '$.users[0].name')

    expect(result.success).toBe(true)
    expect(result.result).toBe('"Ada"')
    expect(result.matches).toEqual([
      { path: "$['users'][0]['name']", summary: 'Ada' }
    ])
    expect(result.message).toContain('1 个结果')
  })

  it('查询多个结果并输出数组', () => {
    const result = queryJSONPath(sample, '$.users[*].name')

    expect(result.success).toBe(true)
    expect(JSON.parse(result.result)).toEqual(['Ada', 'Linus'])
    expect(result.matches.map((match) => match.path)).toEqual([
      "$['users'][0]['name']",
      "$['users'][1]['name']"
    ])
  })

  it('无匹配时返回明确状态', () => {
    const result = queryJSONPath(sample, '$.missing[*]')

    expect(result.success).toBe(false)
    expect(result.displayMessage).toContain('未找到匹配结果')
  })

  it('JSON 无效时返回解析错误', () => {
    const result = queryJSONPath('{"users": [}', '$.users')

    expect(result.success).toBe(false)
    expect(result.displayMessage).toContain('JSON 解析失败')
  })

  it('表达式为空时返回错误', () => {
    const result = queryJSONPath(sample, '   ')

    expect(result.success).toBe(false)
    expect(result.displayMessage).toContain('不能为空')
  })

  it('JSONPath 表达式无效时返回错误', () => {
    const result = queryJSONPath(sample, '$.users[?(@.')

    expect(result.success).toBe(false)
    expect(result.displayMessage).toContain('JSONPath')
  })
})
