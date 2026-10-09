import {beforeEach,describe,it,expect,vi} from 'vitest'
const mocks=vi.hoisted(()=>({save:vi.fn(),discussion:vi.fn(),dialog:vi.fn()}))
vi.mock('electron',()=>({ipcMain:{handle:vi.fn()},dialog:{showSaveDialog:mocks.dialog},app:{getPath:()=>'/tmp/oneapp-fake-records'}}))
vi.mock('../electron/agentWorkshop/records.js',()=>({createRecordStore:()=>({save:mocks.save,loadLatest:()=>null})}))
vi.mock('../electron/agentWorkshop/gitSafety.js',()=>({isGitRepo:()=>false,readGitStatus:()=>'',readGitBranch:()=>null,gitSafetyResult:()=>({ok:true})}))
vi.mock('../electron/agentWorkshop/orchestrator.js',()=>({runDiscussion:mocks.discussion}))
import {registerAgentWorkshopIpc} from '../electron/agentWorkshop/ipc.js'
import {STORE_KEYS} from '../src/renderer/utils/agentWorkshopHelper.js'
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j});return {promise,resolve,reject}}
function setup(runner,canStart){
 const handlers={},data=new Map([[STORE_KEYS.repoDir,'/tmp'],[STORE_KEYS.availability,{codex:{installed:true,resolvedPath:'/fake/codex',loggedIn:true,version:'1'}}]])
 const controller=registerAgentWorkshopIpc({store:{get:(key,fallback)=>data.has(key)?data.get(key):fallback,set:(key,value)=>data.set(key,value)},getWindow:()=>null,runner,canStart,handle:(key,fn)=>{handlers[key]=fn}})
 return {controller,call:(key,...args)=>handlers['agent-discussion:'+key]({},...args)}
}
beforeEach(()=>{vi.clearAllMocks()})
describe('Agent 活动互斥与停止',()=>{
 it('连接测试登记活动，双向阻止并发，取消传 signal 且 idle 等待 finally',async()=>{
  const wait=deferred(),runner=vi.fn(()=>wait.promise),{controller,call}=setup(runner)
  const testing=call('test-agent-connection',{agentId:'codex',repoDir:'/tmp'})
  expect(controller.isActive()).toBe(true);expect(controller.activityKind()).toBe('connection')
  expect((await call('test-agent-connection',{agentId:'codex'})).success).toBe(false)
  expect((await call('start',{repoDir:'/tmp',selectedAgents:['codex'],moderator:'codex',idea:'test'})).success).toBe(false)
  let idle=false;const waiting=controller.waitForIdle().then(()=>{idle=true});controller.cancel()
  expect(runner.mock.calls[0][0].signal.aborted).toBe(true);expect(idle).toBe(false)
  wait.resolve({ok:false,error:'canceled'});expect((await testing).success).toBe(false);await waiting
  expect(idle).toBe(true);expect(controller.isActive()).toBe(false);expect(mocks.save).not.toHaveBeenCalled()
 })
 it('连接 runner 拒绝/超时后可再测试',async()=>{
  const runner=vi.fn().mockRejectedValueOnce(new Error('spawn failure')).mockResolvedValueOnce({ok:false,timeout:true,error:'timeout'})
  const {controller,call}=setup(runner)
  expect((await call('test-agent-connection',{agentId:'codex'})).error).toBe('spawn failure');expect(controller.isActive()).toBe(false)
  expect((await call('test-agent-connection',{agentId:'codex'})).timeout).toBe(true);expect(controller.isActive()).toBe(false)
 })
 it('正式研讨同样阻止连接测试；异常 finally 清理',async()=>{
  const wait=deferred();mocks.discussion.mockImplementationOnce(()=>wait.promise)
  const {controller,call}=setup(vi.fn()),starting=call('start',{repoDir:'/tmp',selectedAgents:['codex'],moderator:'codex',idea:'测试'})
  expect(controller.activityKind()).toBe('discussion');expect((await call('test-agent-connection',{agentId:'codex'})).success).toBe(false)
  controller.cancel();wait.reject(new Error('fake discussion failed'));expect((await starting).success).toBe(false);expect(controller.isActive()).toBe(false)
 })
})

it('关闭确认期间不可启动新调用',async()=>{
 const runner=vi.fn(),{call}=setup(runner,()=>false)
 expect((await call('test-agent-connection',{agentId:'codex'})).success).toBe(false)
 expect((await call('start',{})).success).toBe(false);expect(runner).not.toHaveBeenCalled()
})
