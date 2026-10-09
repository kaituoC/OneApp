import {describe,it,expect} from 'vitest'
import {isTrustedEvent,validPath,httpsURL,validateSettingsPatch,normalizeSettings,validDialogOptions,restoreBounds} from '../electron/workbenchPolicy.js'
describe('IPC 与配置边界',()=>{
 it('只接受主窗口的 main frame 精确页面',()=>{
  const frame={url:'http://localhost:5173/'},wc={mainFrame:frame},win={webContents:wc,isDestroyed:()=>false}
  expect(isTrustedEvent({sender:wc,senderFrame:frame},win,'http://localhost:5173')).toBe(true)
  expect(isTrustedEvent({sender:{},senderFrame:frame},win,'http://localhost:5173')).toBe(false)
  expect(isTrustedEvent({sender:wc,senderFrame:{url:frame.url}},win,frame.url)).toBe(false)
  frame.url='http://localhost:5173/evil';expect(isTrustedEvent({sender:wc,senderFrame:frame},win,'http://localhost:5173/')).toBe(false)
 })
 it('拒绝路径/协议/配置/对话框的非法值',()=>{
  expect(validPath('/tmp/a.md')).toBe(true);expect(validPath('../a')).toBe(false);expect(validPath('/tmp/a\0b')).toBe(false)
  for(const url of ['file:///tmp/a','javascript:alert(1)','http://a.com','https://user:pass@a.com'])expect(httpsURL(url)).toBe(null)
  expect(httpsURL('https://example.com')).toBe('https://example.com/')
  expect(validateSettingsPatch({theme:'system',fontSize:18})).toBe(true)
  expect(validateSettingsPatch({recentTabByGroup:{workspace:'editor',transform:'json',inspect:'regex',encoding:'encode',time:'time',generate:'generator',ai:'agent',system:'settings'}})).toBe(true)
  expect(validateSettingsPatch({theme:'unknown'})).toBe(false);expect(validateSettingsPatch({arbitrary:'value'})).toBe(false)
  expect(validDialogOptions({properties:['openFile'],filters:[{name:'文本',extensions:['md']}]})).toBe(true)
  expect(validDialogOptions({properties:['createUnknownCapability']})).toBe(false)
  expect(validDialogOptions({buttons:['取消'],cancelId:8},true)).toBe(false)
 })
 it('旧主题不变，未知配置回默认',()=>{
  expect(normalizeSettings({theme:'light'}).theme).toBe('light')
  expect(normalizeSettings({theme:'foo',fontSize:999,recentFiles:'wrong'})).toMatchObject({theme:'dark',fontSize:14,recentFiles:[]})
 })
 it('屏幕断开与损坏 bounds 恢复可见窗口',()=>{
  const displays=[{x:0,y:0,width:1440,height:900}]
  expect(restoreBounds({x:5000,y:5000,width:1000,height:700},displays)).toEqual({x:440,y:200,width:1000,height:700})
  expect(restoreBounds({x:1,y:1,width:NaN,height:700},displays)).toEqual({width:1200,height:800})
 })
})
