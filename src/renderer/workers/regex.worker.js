// 正则匹配 Worker：在子线程执行匹配，主线程设超时兜底，
// 灾难性回溯时主线程 terminate 本 Worker，UI 永不冻结。
import { runRegex } from '../utils/regexHelper.js'

self.onmessage = (e) => {
  const { pattern, flags, text, gen, signature } = e.data || {}
  const result = runRegex(pattern, flags, text)
  // 回传 gen，供主线程丢弃陈旧响应
  self.postMessage({ ...result, gen, signature })
}
