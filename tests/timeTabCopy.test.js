// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import TimeTab from '../src/renderer/components/TimeTab.vue'

let app, host, writeText
const button = (section, label) => [...section.querySelectorAll('button')].find(b => b.textContent.trim() === label)
const setInput = async (input, value) => { input.value = value; input.dispatchEvent(new Event('input', { bubbles:true })); await nextTick() }
const click = async b => { b.click(); await nextTick() }

beforeEach(async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-10T09:00:00Z'))
  writeText = vi.fn().mockResolvedValue({ success:true })
  window.electronAPI = { clipboard:{ writeText } }
  host = document.createElement('div'); document.body.appendChild(host)
  app = createApp(TimeTab); app.mount(host); await nextTick()
})
afterEach(() => { app.unmount();host.remove();delete window.electronAPI;vi.useRealTimers() })

describe('时间转换结果复制的真实 DOM 状态', () => {
  it('初始无结果时三个结果按钮均禁用', () => {
    expect(button(host.querySelector('.section-convert-ts'), '复制').disabled).toBe(true)
    expect([...host.querySelectorAll('.section-convert-date .ts-item button')].map(b=>b.disabled)).toEqual([true,true])
  })

  it('当前时间戳转换成功后启用，复制完整结果；输入或输出格式变更后禁用', async () => {
    const section = host.querySelector('.section-convert-ts'), copy = button(section,'复制')
    await click(button(section,'当前'));await click(button(section,'转换'))
    expect(copy.disabled).toBe(false)
    const text = section.querySelector('.convert-result').textContent
    await click(copy)
    expect(writeText).toHaveBeenCalledWith(text)
    const select = section.querySelector('select')
    select.value='yyyy-MM-dd';select.dispatchEvent(new Event('change',{bubbles:true}));await nextTick()
    expect(copy.disabled).toBe(true)
    await click(button(section,'转换'));expect(copy.disabled).toBe(false)
    await setInput(section.querySelector('input[type="text"]'),'invalid')
    expect(copy.disabled).toBe(true)
    await click(button(section,'转换'));expect(copy.disabled).toBe(true)
    await click(button(section,'当前'));await click(button(section,'转换'));expect(copy.disabled).toBe(false)
  })

  it('时间戳单位变化使结果过期，重新转换后恢复可用', async () => {
    const section=host.querySelector('.section-convert-ts'),copy=button(section,'复制')
    await click(button(section,'当前'));await click(button(section,'转换'));expect(copy.disabled).toBe(false)
    const millisecond=section.querySelector('input[value="millisecond"]')
    millisecond.checked=true;millisecond.dispatchEvent(new Event('change',{bubbles:true}));await nextTick()
    expect(copy.disabled).toBe(true)
    await click(button(section,'当前'));await click(button(section,'转换'));expect(copy.disabled).toBe(false)
  })

  it('日期转换成功后秒及毫秒均可复制，各自对应正确结果；错误和过期时禁用', async () => {
    await click([...host.querySelectorAll('.time-direction button')].find(b=>b.textContent.includes('日期 →')))
    const section=host.querySelector('.section-convert-date'),copies=[...section.querySelectorAll('.ts-item button')]
    await click(button(section,'当前'));await click(button(section,'转换'))
    expect(copies.map(b=>b.disabled)).toEqual([false,false])
    const results=[...section.querySelectorAll('.ts-value')].map(el=>el.textContent)
    await click(copies[0]);await click(copies[1])
    expect(writeText.mock.calls.map(args=>args[0])).toEqual(results)
    expect(BigInt(results[1])).toBe(BigInt(results[0])*1000n)
    await setInput(section.querySelector('input'),'invalid')
    expect(copies.map(b=>b.disabled)).toEqual([true,true])
    await click(button(section,'转换'));expect(copies.map(b=>b.disabled)).toEqual([true,true])
    await click(button(section,'当前'));await click(button(section,'转换'));expect(copies.map(b=>b.disabled)).toEqual([false,false])
  })
})
