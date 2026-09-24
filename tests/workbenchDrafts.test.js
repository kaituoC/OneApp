// @vitest-environment jsdom
import { afterEach, describe, it, expect } from 'vitest'
import { createApp, h, ref, nextTick } from 'vue'
import JsonTab from '../src/renderer/components/JsonTab.vue'
import GeneratorTab from '../src/renderer/components/GeneratorTab.vue'
const apps=[]
function mount(Component, initial) {
  const sub=ref(initial),host=document.createElement('div'); document.body.append(host)
  const app=createApp({render:()=>h(Component,{subTool:sub.value})}); app.mount(host); apps.push(app)
  return {host,sub}
}
async function fill(el,value){el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));await nextTick()}
async function click(host,label){[...host.querySelectorAll('button')].find(b=>b.textContent.trim()===label).click();await nextTick()}
afterEach(()=>{apps.splice(0).forEach(a=>a.unmount());document.body.innerHTML=''})
describe('工作台子工具状态',()=>{
 it('JSON 与 YAML 独立保留输入结果，旧结果不可复制',async()=>{
  const {host,sub}=mount(JsonTab,'json')
  await fill(host.querySelector('textarea'),' {"a":1} ')
  await click(host,'格式化')
  const result=host.querySelectorAll('textarea')[1].value
  sub.value='yaml';await nextTick();expect(host.querySelector('textarea').value).toBe('')
  await fill(host.querySelector('textarea'),'a: 2')
  await click(host,'转 JSON')
  sub.value='json';await nextTick()
  expect(host.querySelector('textarea').value).toBe(' {"a":1} ')
  expect(host.querySelectorAll('textarea')[1].value).toBe(result)
  await fill(host.querySelector('textarea'),'{"a":3}')
  expect([...host.querySelectorAll('button')].find(b=>b.textContent==='复制').disabled).toBe(true)
  expect(host.textContent).toContain('待更新')
 })
 it('生成器切换恢复结果，配置变化提示待更新',async()=>{
  const {host,sub}=mount(GeneratorTab,'uuid')
  await click(host,'生成')
  const result=host.querySelector('textarea').value
  sub.value='password';await nextTick()
  await click(host,'生成')
  sub.value='uuid';await nextTick()
  expect(host.querySelector('textarea').value).toBe(result)
  await fill(host.querySelector('input[type=number]'),'3')
  expect(host.textContent).toContain('待更新')
 })
})

it('JSONPath 修改表达式后不能复制旧查询结果', async () => {
 const {host} = mount(JsonTab, 'json')
 await fill(host.querySelector('textarea'), '{"a":1,"b":2}')
 await click(host, 'JSONPath 查询')
 await fill(host.querySelector('#jsonpath-expression'), '$.a')
 await click(host, '查询')
 await fill(host.querySelector('#jsonpath-expression'), '$.b')
 expect(host.textContent).toContain('待更新')
 expect([...host.querySelectorAll('button')].find(b => b.textContent === '复制').disabled).toBe(true)
 await click(host, '查询')
 expect(host.textContent).not.toContain('待更新')
})
