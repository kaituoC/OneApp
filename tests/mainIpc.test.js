import {beforeAll,it,expect,vi} from 'vitest'
import {pathToFileURL} from 'node:url'
const state=vi.hoisted(()=>({handlers:{},windows:[],save:vi.fn(),write:vi.fn(),stat:vi.fn(()=>({isFile:()=>true})),loadFail:false,printFail:false,data:{},fileAccess:{grantFile:vi.fn(),grantDirectory:vi.fn(),requireAccess:vi.fn(p=>p),canAccess:vi.fn(()=>true)}}))
vi.mock('electron-store',()=>({default:class{constructor({defaults}){state.data={...defaults}}get(k){return state.data[k]}set(k,v){state.data[k]=v}get store(){return state.data}}}))
vi.mock('fs',()=>({default:{existsSync:()=>false,statSync:state.stat,accessSync:vi.fn(),constants:{R_OK:4},writeFileSync:state.write,readFileSync:()=>'',promises:{readdir:async()=>[]}}}))
vi.mock('../electron/fileAccess.js',()=>({createFileAccess:()=>state.fileAccess}))
vi.mock('../electron/agentWorkshop/ipc.js',()=>({registerAgentWorkshopIpc:()=>({isActive:()=>false})}))
vi.mock('electron',()=>{
 class Window{
  constructor(options){this.options=options;this.events={};this.destroyed=false;this.webContents={mainFrame:{url:''},on:vi.fn(),once:vi.fn(),send:vi.fn(),setWindowOpenHandler:vi.fn(),session:{setPermissionRequestHandler:vi.fn()},printToPDF:vi.fn(async()=>{if(state.printFail)throw Error('print failed');return new Uint8Array([1])})};state.windows.push(this)}
  on(k,f){this.events[k]=f}isDestroyed(){return this.destroyed}isFullScreen(){return false}isMaximized(){return false}getNormalBounds(){return {x:1,y:1,width:1200,height:800}}maximize(){}show(){}close(){this.destroy()}destroy(){this.destroyed=true}
  async loadURL(url){this.webContents.mainFrame.url=url;if(state.loadFail)throw Error('load failed')}
  async loadFile(file){this.webContents.mainFrame.url=pathToFileURL(file).href}
  static fromWebContents(){return state.windows[0]}
 }
 return {app:{setName:vi.fn(),isPackaged:false,getVersion:()=> 'test',whenReady:()=>Promise.resolve(),on:vi.fn(),quit:vi.fn(),dock:{setIcon:vi.fn()}},BrowserWindow:Window,ipcMain:{handle:(key,fn)=>{state.handlers[key]=fn}},dialog:{showSaveDialog:state.save,showMessageBox:vi.fn(),showOpenDialog:vi.fn()},nativeImage:{createFromPath:vi.fn()},nativeTheme:{shouldUseDarkColors:false,on:vi.fn()},screen:{getAllDisplays:()=>[{workArea:{x:0,y:0,width:1440,height:900}}]},shell:{openExternal:vi.fn()},Menu:{buildFromTemplate:()=>({getMenuItemById:()=>({enabled:true})}),setApplicationMenu:vi.fn()}}
})
beforeAll(async()=>{await import('../electron/main.js');await Promise.resolve()})
const event=()=>({sender:state.windows[0].webContents,senderFrame:state.windows[0].webContents.mainFrame})
it('生产页面 IPC 拒绝错误来源和非法参数，无写入',async()=>{
 const write=state.handlers['write-file'];expect(()=>write({...event(),sender:{}},'/tmp/a','data')).toThrow('请求来源')
 expect(()=>write(event(),'relative','data')).toThrow('请求来源');expect(state.write).not.toHaveBeenCalled()
 expect(()=>state.handlers['set-store'](event(),{unknown:'secret'})).toThrow('参数')
})
it('系统保存面板和最近入口都返回真实路径，避免缓存稿身份别名',async()=>{
 state.save.mockResolvedValueOnce({canceled:false,filePath:'/alias/a.md'})
 state.fileAccess.grantFile.mockReturnValueOnce('/real/a.md')
 expect((await state.handlers['show-save-dialog'](event(),{defaultPath:'a.md'})).filePath).toBe('/real/a.md')
 state.fileAccess.requireAccess.mockReturnValueOnce('/real/a.md')
 expect((await state.handlers['authorize-recent'](event(),'/alias/a.md')).filePath).toBe('/real/a.md')
})
it('PDF 取消不创建窗口，失败 finally 清理，成功仍禁脚本和资源越界',async()=>{
 const handler=state.handlers['export-pdf'],main=state.windows[0]
 state.save.mockResolvedValueOnce({canceled:true});const count=state.windows.length
 expect((await handler(event(),'<h1>内容</h1>','a.pdf')).canceled).toBe(true);expect(state.windows).toHaveLength(count)
 state.save.mockResolvedValue({canceled:false,filePath:'/tmp/a.pdf'})
 state.loadFail=true;expect((await handler(event(),'<h1>内容</h1>','a.pdf')).success).toBe(false);expect(state.windows.at(-1).destroyed).toBe(true)
 state.loadFail=false;state.printFail=true;expect((await handler(event(),'<h1>内容</h1>','a.pdf')).success).toBe(false);expect(state.windows.at(-1).destroyed).toBe(true)
 state.printFail=false;expect((await handler(event(),'<script>evil()</script>','a.pdf')).success).toBe(true)
 const pdf=state.windows.at(-1);expect(pdf.options.webPreferences).toMatchObject({javascript:false,sandbox:true,nodeIntegration:false});expect(pdf.options.webPreferences.preload).toBeUndefined();expect(pdf.destroyed).toBe(true);expect(main.destroyed).toBe(false)
 expect(decodeURIComponent(pdf.webContents.mainFrame.url)).toContain("default-src 'none'")
})
it('最近文件不存在时明确失败，不诱导重新选择其他文件',async()=>{
 state.stat.mockImplementationOnce(()=>{throw Object.assign(new Error('missing'),{code:'ENOENT'})})
 const result=await state.handlers['authorize-recent'](event(),'/tmp/missing.md')
 expect(result).toMatchObject({success:false,error:expect.stringContaining('文件不存在')})
})
