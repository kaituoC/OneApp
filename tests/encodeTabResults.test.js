// @vitest-environment jsdom
import {afterEach,it,expect,vi} from 'vitest'
import {createApp,h,ref,nextTick} from 'vue'
vi.mock('../src/renderer/utils/encodeHelper.js',async original=>({...await original(),hashAll:vi.fn()}))
import {hashAll} from '../src/renderer/utils/encodeHelper.js'
import EncodeTab from '../src/renderer/components/EncodeTab.vue'
let app
function mount(initial){const tool=ref(initial),host=document.createElement('div');document.body.append(host);app=createApp({render:()=>h(EncodeTab,{subTool:tool.value})});app.mount(host);return {host,tool}}
async function fill(el,text){el.value=text;el.dispatchEvent(new Event('input',{bubbles:true}));await nextTick()}
afterEach(()=>{app?.unmount();document.body.innerHTML='';vi.useRealTimers()})
it('Base64 空/错误不提供业务操作，互换保留方向且可局部撤销',async()=>{
 const {host}=mount('base64'),pane=host.querySelector('.pane'),input=pane.querySelector('textarea')
 expect(pane.textContent).not.toContain('复制');await fill(input,'中文')
 const result=pane.querySelectorAll('textarea')[1].value;pane.querySelector('.swap-btn').click();await nextTick()
 expect(input.value).toBe(result);expect(pane.textContent).toContain('Base64 → 文本')
 ;[...host.querySelectorAll('button')].find(b=>b.textContent==='撤销输入操作').click();await nextTick();expect(input.value).toBe('中文');expect(pane.textContent).toContain('文本 → Base64')
 pane.querySelector('.dir-btn').click();await nextTick();await fill(input,'!invalid!');expect(pane.textContent).not.toContain('复制');expect(pane.querySelectorAll('textarea')[1].value).toBe('')
})
it('Hash 输入变化立即清除旧结果且丢弃乱序响应',async()=>{
 vi.useFakeTimers();const {host}=mount('hash'),input=host.querySelector('[aria-label="Hash 输入"]')
 let finish;hashAll.mockResolvedValueOnce({success:true,result:{md5:'A',sha1:'A',sha256:'A',sha512:'A'}}).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve})).mockResolvedValueOnce({success:true,result:{md5:'C',sha1:'C',sha256:'C',sha512:'C'}})
 await fill(input,'A');await vi.advanceTimersByTimeAsync(300);await nextTick();expect(host.querySelector('.hash-val').textContent).toBe('A')
 await fill(input,'B');expect(host.querySelector('.hash-val')).toBe(null);await vi.advanceTimersByTimeAsync(300)
 await fill(input,'C');await vi.advanceTimersByTimeAsync(300);await nextTick();finish({success:true,result:{md5:'B'}});await Promise.resolve();await nextTick();expect(host.querySelector('.hash-val').textContent).toBe('C')
})
