// @vitest-environment jsdom
import { afterEach, it, expect, vi } from 'vitest'
import { createApp, h, ref, nextTick } from 'vue'
import JsonTab from '../src/renderer/components/JsonTab.vue'

let app
function mount() {
  const mode = ref('json')
  const host = document.createElement('div')
  document.body.append(host)
  app = createApp({ render: () => h(JsonTab, { subTool: mode.value }) })
  app.mount(host)
  return { host, mode }
}
async function fill(element, value) {
  element.value = value
  element.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}
async function click(host, name) {
  [...host.querySelectorAll('button')].find(button => button.textContent.trim() === name).click()
  await nextTick()
}
const editors = host => [...host.querySelectorAll('textarea')]
afterEach(() => {
  app?.unmount()
  document.body.innerHTML = ''
  delete window.electronAPI
})

it('数据工具默认软换行，切换保留原文、有效结果与复制语义', async () => {
  const { host, mode } = mount()
  const source = ' {"text":"' + 'abc'.repeat(200) + '"} '
  const writeText = vi.fn().mockResolvedValue({ success: true })
  window.electronAPI = { clipboard: { writeText } }
  await fill(editors(host)[0], source)
  await click(host, '压缩')
  const result = editors(host)[1].value
  expect(editors(host).map(editor => editor.wrap)).toEqual(['soft', 'soft'])
  await click(host, '自动换行')
  expect(editors(host).map(editor => editor.wrap)).toEqual(['off', 'off'])
  expect(editors(host)[0].value).toBe(source)
  expect(editors(host)[1].value).toBe(result)
  expect(host.querySelector('[aria-pressed]').getAttribute('aria-pressed')).toBe('false')
  expect(host.textContent).not.toContain('待更新')
  await click(host, '复制')
  expect(writeText).toHaveBeenCalledWith(result)

  for (const subTool of ['yaml', 'csv', 'sql', 'xml']) {
    mode.value = subTool
    await nextTick()
    expect(editors(host).every(editor => editor.wrap === 'soft')).toBe(true)
  }
  mode.value = 'json'
  await nextTick()
  expect(editors(host).map(editor => editor.wrap)).toEqual(['off', 'off'])
  expect(editors(host)[0].value).toBe(source)
  expect(editors(host)[1].value).toBe(result)
  await click(host, '自动换行')
  expect(editors(host).map(editor => editor.wrap)).toEqual(['soft', 'soft'])
})

it('JSONPath 查询结果同样响应换行开关，查询表达式保持单行', async () => {
  const { host } = mount()
  await fill(editors(host)[0], '{"value":"' + 'a'.repeat(400) + '"}')
  await click(host, 'JSONPath 查询')
  await fill(host.querySelector('#jsonpath-expression'), '$.value')
  await click(host, '查询')
  const result = editors(host)[1].value
  await click(host, '自动换行')
  expect(editors(host).map(editor => editor.wrap)).toEqual(['off', 'off'])
  expect(editors(host)[1].value).toBe(result)
  expect(host.querySelector('#jsonpath-expression').tagName).toBe('INPUT')
  expect(host.querySelector('#jsonpath-expression').value).toBe('$.value')
  expect(host.textContent).not.toContain('待更新')
})

it('非法内容在换行切换与清空撤销后保持原文和错误状态', async () => {
  const { host } = mount()
  const source = '{invalid:' + '中'.repeat(400) + '\n\t trailing  '
  await fill(editors(host)[0], source)
  await click(host, '格式化')
  const error = host.querySelector('[role=alert]').textContent
  await click(host, '自动换行')
  expect(editors(host)[0].value).toBe(source)
  expect(host.querySelector('[role=alert]').textContent).toBe(error)
  expect(host.querySelectorAll('.line-number')).toHaveLength(3)
  await click(host, '清空')
  await click(host, '撤销输入操作')
  expect(editors(host)[0].value).toBe(source)
  expect(editors(host)[0].wrap).toBe('off')
})
