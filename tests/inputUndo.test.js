import {describe,it,expect} from 'vitest'
import {ref} from 'vue'
import {useInputUndo} from '../src/renderer/composables/useInputUndo.js'
describe('一次局部撤销',()=>{
 it('只恢复受影响字段，编辑后失效',()=>{
  const a=ref('A'),b=ref('B'),undo=useInputUndo([a,b]);undo.replace([a],()=>{a.value=''})
  expect(undo.canUndo.value).toBe(true);undo.undo();expect(a.value).toBe('A');expect(b.value).toBe('B');expect(undo.canUndo.value).toBe(false)
  undo.replace([a],()=>{a.value='replace'});a.value='new typing';undo.undo();expect(a.value).toBe('new typing')
 })
 it('多字段清空可一起恢复，切换工具取消快照',()=>{
  const a=ref('json'),expression=ref('$.a'),tool=ref('json'),undo=useInputUndo([a,expression],tool)
  undo.replace([a,expression],()=>{a.value='';expression.value='$'});undo.undo();expect(a.value).toBe('json');expect(expression.value).toBe('$.a')
  undo.replace([a],()=>{a.value=''});tool.value='yaml';expect(undo.canUndo.value).toBe(false)
 })
})
