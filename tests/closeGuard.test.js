import {describe,it,expect,vi} from 'vitest'
import {createCloseGuard} from '../electron/closeGuard.js'
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve}}
describe('关闭保护',()=>{
 it('重复关闭/退出共享一条流程，停止完成后重查草稿',async()=>{
  const wait=deferred(),draft=vi.fn().mockResolvedValue(true),finish=vi.fn(),stop=vi.fn(()=>wait.promise)
  const guard=createCloseGuard({checkDrafts:draft,stopActivity:stop,finish,reportError:vi.fn()})
  const first=guard.request();await Promise.resolve();const second=guard.request('quit')
  expect(first).toBe(second);expect(draft).toHaveBeenCalledTimes(1);expect(finish).not.toHaveBeenCalled()
  wait.resolve(true);await first;expect(draft).toHaveBeenCalledTimes(2);expect(draft.mock.calls[0][0]).toBe(draft.mock.calls[1][0]);expect(finish).toHaveBeenCalledWith('quit')
 })
 it('草稿取消不会提前停止 Agent',async()=>{
  const stop=vi.fn(),finish=vi.fn();const guard=createCloseGuard({checkDrafts:async()=>false,stopActivity:stop,finish,reportError:vi.fn()})
  expect(await guard.request()).toBe(false);expect(stop).not.toHaveBeenCalled();expect(finish).not.toHaveBeenCalled()
 })
 it('停止失败或 renderer 不响应时保留窗口，可重试',async()=>{
  const finish=vi.fn(),error=vi.fn(),check=vi.fn().mockRejectedValueOnce(new Error('timeout')).mockResolvedValue(true)
  const guard=createCloseGuard({checkDrafts:check,stopActivity:async()=>{throw new Error('stop failed')},finish,reportError:error})
  expect(await guard.request()).toBe(false);expect(guard.isPending()).toBe(false)
  expect(await guard.request()).toBe(false);expect(error).toHaveBeenCalledTimes(2);expect(finish).not.toHaveBeenCalled()
 })
 it('停止中取消关闭不销毁窗口',async()=>{
  const wait=deferred(),finish=vi.fn();const guard=createCloseGuard({checkDrafts:async()=>true,stopActivity:()=>wait.promise,finish,reportError:vi.fn()})
  const pending=guard.request();await Promise.resolve();guard.cancel();wait.resolve(true);expect(await pending).toBe(false);expect(finish).not.toHaveBeenCalled()
 })
})
