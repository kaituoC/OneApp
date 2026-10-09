import { ref, watch } from 'vue'
// 只保存本次程序性输入操作影响的字段；后续输入或上下文切换使快照失效。
export function useInputUndo(fields, scope) {
  const canUndo = ref(false)
  let snapshot = null, changing = false
  const invalidate = () => { if (!changing) { snapshot = null; canUndo.value = false } }
  watch(fields, invalidate, {flush:'sync'})
  if (scope) watch(scope, invalidate, {flush:'sync'})
  function replace(affected, operation) {
    const before = affected.map(field => [field, field.value])
    changing = true
    try { operation() } finally { changing = false }
    snapshot = before.some(([field,value]) => field.value !== value) ? before : null
    canUndo.value = !!snapshot
  }
  function undo() {
    if (!snapshot) return
    changing = true
    try { snapshot.forEach(([field,value]) => { field.value = value }) } finally { changing = false; snapshot = null; canUndo.value = false }
  }
  return {canUndo,replace,undo}
}
