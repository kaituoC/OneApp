// 一个窗口、一个确认链；保护失败绝不转化为允许关闭。
export function createCloseGuard({ checkDrafts, stopActivity, finish, reportError, onState = () => {} }) {
  let pending = null, intent = 'close', canceled = false, sequence = 0
  function cancel() { canceled = true }
  function request(nextIntent = 'close') {
    if (nextIntent === 'quit') intent = 'quit'
    if (pending) return pending
    intent = nextIntent; canceled = false
    const token = ++sequence
    onState('checking')
    pending = (async () => {
      try {
        if (!await checkDrafts(token) || canceled) return false
        if (!await stopActivity(() => canceled, () => intent) || canceled) return false
        if (!await checkDrafts(token) || canceled) return false
        finish(intent)
        return true
      } catch (e) { await reportError(e); return false }
      finally { pending = null; onState('idle') }
    })()
    return pending
  }
  return { request, cancel, isPending: () => !!pending }
}
