// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { safeMarkdown } from '../src/renderer/utils/safeMarkdown.js'

describe('safeMarkdown 消毒渲染', () => {
  it('正常 Markdown 仍正确渲染', () => {
    const html = safeMarkdown('# 标题\n\n- 列表项\n\n`code`')
    expect(html).toContain('<h1')
    expect(html).toContain('<li')
    expect(html).toContain('<code')
  })

  it('剥离 <script> 标签', () => {
    const html = safeMarkdown('hello <script>alert(1)</script> world')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('alert(1)')
  })

  it('剥离事件属性（onerror 等）', () => {
    const html = safeMarkdown('<img src=x onerror="alert(1)">')
    expect(html).not.toMatch(/onerror/i)
    expect(html).not.toContain('alert(1)')
  })

  it('中和 javascript: 链接', () => {
    const html = safeMarkdown('[点我](javascript:alert(1))')
    expect(html).not.toMatch(/javascript:/i)
  })

  it('外链补 target=_blank 与 rel=noopener', () => {
    const html = safeMarkdown('[站点](https://example.com)')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('空输入返回空字符串', () => {
    expect(safeMarkdown('')).toBe('')
    expect(safeMarkdown(null)).toBe('')
    expect(safeMarkdown(undefined)).toBe('')
  })
})

it('表格、代码块和 HTTPS 图片保留，危险嵌入与锚点处理安全',()=>{
 const html=safeMarkdown('| 列 |\n| --- |\n| 值 |\n\n```js\nconst a=1\n```\n\n![图](https://example.com/a.png)\n\n<a href="#anchor">页内</a><iframe src="https://evil"></iframe><form><input></form>')
 expect(html).toContain('<table>');expect(html).toContain('<pre>');expect(html).toContain('https://example.com/a.png');expect(html).not.toMatch(/<iframe|<form|<input/)
 expect(html).toContain('href="#anchor"')
})

it('HTML 静态呈现保留样式而源码可独立保存，删除跳转和嵌入',async()=>{
 const {safeHtmlPreview}=await import('../src/renderer/utils/safeMarkdown.js')
 const source='<html><head><style>p{color:red}</style><meta http-equiv="refresh" content="0;url=https://evil"></head><body><p onclick="alert(1)">文本</p><script>alert(1)</script></body></html>'
 const html=safeHtmlPreview(source)
 expect(html).toContain('p{color:red}');expect(html).not.toMatch(/<script|onclick|http-equiv="refresh"/);expect(html).toContain("script-src 'none'")
 expect(source).toContain('<script>')
})
