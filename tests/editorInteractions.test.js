// @vitest-environment jsdom
import {afterEach,it,expect,vi} from 'vitest'
import {createApp,h,nextTick} from 'vue'
vi.mock('../src/renderer/utils/fileHelper.js',()=>({readDir:vi.fn().mockResolvedValue([]),readFile:vi.fn(),writeFile:vi.fn(),saveFile:vi.fn(),openFile:vi.fn(),chooseDirectory:vi.fn(),filterTreeItems:items=>items}))
import {readDir} from '../src/renderer/utils/fileHelper.js'
import EditorTab from '../src/renderer/components/EditorTab.vue'
import TreeNode from '../src/renderer/components/TreeNode.vue'
let app
const settle=async()=>{await Promise.resolve();await nextTick();await nextTick()}
afterEach(()=>{app?.unmount();document.body.innerHTML='';vi.clearAllMocks()})
it('编辑器分隔条键盘调节、重置及换行开关保留输入',async()=>{
 const host=document.createElement('div');document.body.append(host);app=createApp(EditorTab);app.mount(host);await settle()
 const divider=host.querySelector('[aria-label="编辑与预览宽度"]')
 divider.setPointerCapture=vi.fn()
 const pointer=new Event('pointerdown',{bubbles:true,cancelable:true});Object.assign(pointer,{button:0,pointerId:1,clientX:300});divider.dispatchEvent(pointer)
 expect(document.activeElement).toBe(divider)
 divider.dispatchEvent(new Event('pointerup'))
 expect(divider.getAttribute('aria-valuenow')).toBe('50');divider.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await nextTick();expect(Number(divider.getAttribute('aria-valuenow'))).toBeGreaterThan(50)
 divider.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));await nextTick();expect(divider.getAttribute('aria-valuenow')).toBe('50')
 const textarea=host.querySelector('textarea'),value=textarea.value
 ;[...host.querySelectorAll('button')].find(b=>b.textContent==='自动换行').click();await nextTick();expect(textarea.wrap).toBe('off');expect(textarea.value).toBe(value)
 ;[...host.querySelectorAll('button')].find(b=>b.textContent==='编辑').click();await nextTick();expect(host.querySelector('textarea')).toBe(null)
 ;[...host.querySelectorAll('button')].find(b=>b.textContent==='重置布局').click();await nextTick();expect(host.querySelector('textarea').value).toBe(value)
})
it('文件夹重复展开只读一次，左右键进入子项与返回父项',async()=>{
 let resolve;readDir.mockImplementationOnce(()=>new Promise(r=>{resolve=r}))
 const host=document.createElement('div');host.className='file-tree';document.body.append(host)
 app=createApp({render:()=>h(TreeNode,{item:{path:'/tmp/work',name:'work',isDirectory:true}})});app.mount(host)
 const folder=host.querySelector('.node-row');folder.focus();folder.click();folder.click();expect(readDir).toHaveBeenCalledTimes(1)
 resolve([{path:'/tmp/work/a.md',name:'a.md',isDirectory:false}]);await settle();expect(folder.getAttribute('aria-expanded')).toBe('true')
 folder.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await settle();const child=host.querySelectorAll('.node-row')[1];expect(document.activeElement).toBe(child)
 child.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));expect(document.activeElement).toBe(folder)
 folder.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));await nextTick();expect(folder.getAttribute('aria-expanded')).toBe('false')
})
