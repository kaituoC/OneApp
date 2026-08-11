import { ref, computed, onUnmounted } from 'vue'

// 单次匹配超时（ms）；超时即判定为灾难性回溯，terminate Worker
const TIMEOUT_MS = 1500

export function createRegexInputSignature(pattern, flags, text) {
  return JSON.stringify([pattern || '', flags || '', text || ''])
}

export function isRegexResultCurrent(resultSignature, pattern, flags, text) {
  return resultSignature === createRegexInputSignature(pattern, flags, text)
}

/**
 * 正则匹配 composable：在 Web Worker 中执行匹配，主线程超时兜底。
 * 超时 → terminate 当前 Worker → 提示 → 重建待命 Worker，UI 永不冻结。
 *
 * generation 计数器保证乱序/陈旧响应不会覆盖最新结果，也不会取消最新请求的超时守卫。
 */
export function useRegexMatcher() {
  const matches = ref([])
  const truncated = ref(false)
  const error = ref('')      // 正则非法或超时的提示
  const matching = ref(false)
  const resultSignature = ref('')

  // count 始终与 matches.length 相同，用 computed 消除冗余状态
  const count = computed(() => matches.value.length)

  let worker = null
  let timer = null
  let generation = 0  // 每次 match() 调用时递增，用于丢弃陈旧响应

  function clearTimer() {
    if (timer) { clearTimeout(timer); timer = null }
  }

  function createWorker() {
    worker = new Worker(new URL('../workers/regex.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = (e) => {
      const r = e.data
      // 丢弃与当前 generation 不符的陈旧响应（快速连续输入时可能出现）
      if (r.gen !== generation || r.signature !== currentSignature) return
      clearTimer()
      matching.value = false
      if (r.success) {
        matches.value = r.matches
        truncated.value = r.truncated
        error.value = ''
        resultSignature.value = r.signature
      } else {
        matches.value = []
        truncated.value = false
        error.value = r.error
        resultSignature.value = r.signature
      }
    }
  }

  function reset() {
    matches.value = []
    truncated.value = false
    resultSignature.value = ''
  }

  let currentSignature = ''

  function invalidate(pattern, flags, text) {
    generation++
    clearTimer()
    matching.value = false
    currentSignature = createRegexInputSignature(pattern, flags, text)
    reset()
    error.value = ''
  }

  function match(pattern, flags, text) {
    if (!worker) createWorker()
    const signature = createRegexInputSignature(pattern, flags, text)
    currentSignature = signature
    const gen = ++generation
    matching.value = true
    clearTimer()
    timer = setTimeout(() => {
      // 超时守卫：仅对当前请求生效，更新的请求已替换 generation
      if (gen !== generation) return
      if (worker) worker.terminate()
      worker = null
      matching.value = false
      reset()
      error.value = '正则过于复杂，已中止'
      createWorker()
    }, TIMEOUT_MS)
    worker.postMessage({ pattern, flags, text, gen, signature })
  }

  onUnmounted(() => {
    clearTimer()
    if (worker) { worker.terminate(); worker = null }
  })

  return { matches, count, truncated, error, matching, resultSignature, invalidate, match }
}
