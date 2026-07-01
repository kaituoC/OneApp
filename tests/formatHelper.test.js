import { describe, expect, it } from 'vitest'
import {
  formatSQL,
  minifySQL,
  formatXML,
  minifyXML
} from '../src/renderer/utils/formatHelper.js'

describe('formatHelper SQL', () => {
  it('格式化 SQL 为多行缩进文本', () => {
    const result = formatSQL('select id,name from users where active=1 order by name')

    expect(result.success).toBe(true)
    expect(result.result).toContain('SELECT')
    expect(result.result).toContain('\nFROM')
    expect(result.result).toContain('\nWHERE')
  })

  it('压缩 SQL 去除多余空白', () => {
    const result = minifySQL('SELECT  *\nFROM   users\nWHERE  name =  \"Ada\"')

    expect(result.success).toBe(true)
    expect(result.result).toBe('SELECT * FROM users WHERE name = "Ada"')
  })

  it('SQL 空输入返回错误', () => {
    const result = formatSQL('   ')

    expect(result.success).toBe(false)
    expect(result.displayMessage).toContain('不能为空')
  })
})

describe('formatHelper XML', () => {
  it('格式化 XML 并保持节点结构', () => {
    const result = formatXML('<root><item id="1">Ada</item><item id="2"/></root>')

    expect(result.success).toBe(true)
    expect(result.result).toContain('<root>')
    expect(result.result).toContain('\n  <item id="1">Ada</item>')
    expect(result.result).toContain('\n  <item id="2"/>')
  })

  it('压缩 XML 去除标签间无意义空白', () => {
    const result = minifyXML('<root>\n  <item>Ada</item>\n  <item>Linus</item>\n</root>')

    expect(result.success).toBe(true)
    expect(result.result).toBe('<root><item>Ada</item><item>Linus</item></root>')
  })

  it('XML 结构错误返回解析原因', () => {
    const result = formatXML('<root><item>Ada</root>')

    expect(result.success).toBe(false)
    expect(result.displayMessage).toContain('XML')
  })
})
