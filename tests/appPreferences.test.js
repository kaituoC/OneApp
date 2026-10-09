// @vitest-environment jsdom
import {afterEach,it,expect,vi} from 'vitest'
import {createApp,h,nextTick} from 'vue'
const editor = vi.hoisted(()=>({hasDirtyDraft:vi.fn(()=>false),openFromPath:vi.fn(async()=>true),focusEditor:vi.fn()}))
vi.mock('../src/renderer/components/EditorTab.vue',()=>({default:{setup(_p,{expose}){expose({prepareClose:async()=>true,executeCommand:async()=>false,...editor});return()=>h('div')}}}))
vi.mock('../src/renderer/components/JsonTab.vue',()=>({default:{render:()=>null}}))
vi.mock('../src/renderer/components/DiffTab.vue',()=>({default:{render:()=>null}}))
vi.mock('../src/renderer/components/TextTab.vue',()=>({default:{render:()=>null}}))
vi.mock('../src/renderer/components/TimeTab.vue',()=>({default:{render:()=>null}}))
vi.mock('../src/renderer/components/RegexTab.vue',()=>({default:{render:()=>null}}))
vi.mock('../src/renderer/components/EncodeTab.vue',()=>({default:{render:()=>null}}))
vi.mock('../src/renderer/components/GeneratorTab.vue',()=>({default:{render:()=>null}}))
vi.mock('../src/renderer/components/AgentWorkshopTab.vue',()=>({default:{render:()=>null}}))
vi.mock('../src/renderer/components/ToolSearch.vue',()=>({default:{setup(_p,{expose}){expose({open:()=>{}});return()=>null}}}))
import App from '../src/renderer/App.vue'
let app
const flush=async()=>{await Promise.resolve();await nextTick();await nextTick()}
afterEach(()=>{app?.unmount();document.body.innerHTML='';delete window.electronAPI;editor.hasDirtyDraft.mockReset().mockReturnValue(false);editor.openFromPath.mockClear()})
it('设置三态绑定可写偏好，初始化不写回；system 接收系统变化',async()=>{
 globalThis.__APP_VERSION__='test';globalThis.__BUILD_DATE__='test'
 let command,onTheme;const setStore=vi.fn()
 window.electronAPI={getStore:async()=>({theme:'light',fontSize:14,recentFiles:[],recentTabByGroup:{},nativeDark:true}),setStore,updates:{onAvailable:()=>()=>{}},commands:{setEditorActive:vi.fn(),onCommand:fn=>{command=fn;return()=>{}},onTheme:fn=>{onTheme=fn;return()=>{}},onCloseState:()=>()=>{},onCheckClose:()=>()=>{}}}
 const host=document.createElement('div');document.body.append(host);app=createApp(App);app.mount(host);await flush()
 expect(document.documentElement.dataset.theme).toBe('light');expect(setStore).not.toHaveBeenCalled()
 await command('settings');await nextTick();[...host.querySelectorAll('button')].find(b=>b.textContent==='跟随系统').click();await nextTick()
 expect(setStore).toHaveBeenCalledWith({theme:'system'});expect(setStore).toHaveBeenCalledWith({recentTabByGroup:{system:'settings'}})
 expect(document.documentElement.dataset.theme).toBe('dark');onTheme(false);await nextTick();expect(document.documentElement.dataset.theme).toBe('light')
 const callCount=setStore.mock.calls.length;onTheme(true);await nextTick();expect(setStore).toHaveBeenCalledTimes(callCount)
 expect([...host.querySelectorAll('button')].find(b=>b.textContent==='跟随系统').getAttribute('aria-checked')).toBe('true')
})
it('最近文件优先恢复 dirty 缓存；失效磁盘文件给出错误且留在原工具',async()=>{
 globalThis.__APP_VERSION__='test';globalThis.__BUILD_DATE__='test'
 let command;const authorizeRecent=vi.fn(async()=>({success:false,error:'文件不存在'})),showMessageBox=vi.fn()
 window.electronAPI={getStore:async()=>({theme:'dark',fontSize:14,recentFiles:['/tmp/cached.md','/tmp/missing.md'],recentTabByGroup:{}}),setStore:vi.fn(),authorizeRecent,showMessageBox,updates:{onAvailable:()=>()=>{}},commands:{setEditorActive:vi.fn(),onCommand:fn=>{command=fn;return()=>{}},onTheme:()=>()=>{},onCloseState:()=>()=>{},onCheckClose:()=>()=>{}}}
 const host=document.createElement('div');document.body.append(host);app=createApp(App);app.mount(host);await flush()
 await command('settings');await nextTick()
 const button=text=>[...host.querySelectorAll('button')].find(b=>b.textContent.trim()===text)
 button('最近文件').click();await nextTick()
 editor.hasDirtyDraft.mockReturnValueOnce(true);button('cached.md').click();await flush()
 expect(authorizeRecent).not.toHaveBeenCalled();expect(editor.openFromPath).toHaveBeenCalledWith('/tmp/cached.md')
 await command('settings');await nextTick();button('missing.md').click();await flush()
 expect(showMessageBox).toHaveBeenCalledWith(expect.objectContaining({message:'最近文件打开失败',detail:'文件不存在'}))
 expect(host.querySelector('.settings-tab').style.display).not.toBe('none');expect(editor.openFromPath).toHaveBeenCalledTimes(1)
})
