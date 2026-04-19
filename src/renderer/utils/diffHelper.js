import DiffMatchPatch from 'diff-match-patch'

const dmp = new DiffMatchPatch()

/**
 * 统一差异模式 - 类似 git diff
 */
export function diffTextUnified(textA, textB) {
  const diffs = dmp.diff_main(textA, textB)
  dmp.diff_cleanupSemantic(diffs)

  const result = []
  for (const [type, text] of diffs) {
    const lines = text.split('\n')
    if (lines[lines.length - 1] === '') lines.pop()

    for (const line of lines) {
      result.push({
        type: type === 0 ? 'equal' : type === 1 ? 'add' : 'remove',
        text: line
      })
    }
  }

  return result
}

/**
 * 并排对比模式 - 生成左右对齐的行数组
 */
export function diffTextSplit(textA, textB) {
  const linesA = textA.split('\n')
  const linesB = textB.split('\n')

  if (linesA[linesA.length - 1] === '') linesA.pop()
  if (linesB[linesB.length - 1] === '') linesB.pop()

  // 使用 LCS 算法找出公共行
  const lcs = findLCS(linesA, linesB)

  const result = []
  let idxA = 0
  let idxB = 0
  let idxLcs = 0

  while (idxA < linesA.length || idxB < linesB.length) {
    const lcsLine = idxLcs < lcs.length ? lcs[idxLcs] : null

    // 处理左侧删除的行
    while (idxA < linesA.length && linesA[idxA] !== lcsLine) {
      result.push({
        left: { type: 'remove', text: linesA[idxA], lineNum: idxA + 1 },
        right: { type: 'empty', text: '', lineNum: null }
      })
      idxA++
    }

    // 处理右侧新增的行
    while (idxB < linesB.length && linesB[idxB] !== lcsLine) {
      result.push({
        left: { type: 'empty', text: '', lineNum: null },
        right: { type: 'add', text: linesB[idxB], lineNum: idxB + 1 }
      })
      idxB++
    }

    // 处理公共行
    if (idxA < linesA.length && idxB < linesB.length && linesA[idxA] === lcsLine) {
      result.push({
        left: { type: 'equal', text: linesA[idxA], lineNum: idxA + 1 },
        right: { type: 'equal', text: linesB[idxB], lineNum: idxB + 1 }
      })
      idxA++
      idxB++
      idxLcs++
    }
  }

  return result
}

/**
 * LCS 算法 - 找出最长公共子序列
 */
function findLCS(arrA, arrB) {
  const m = arrA.length
  const n = arrB.length

  // 构建 DP 表
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arrA[i - 1] === arrB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // 回溯找出 LCS
  const lcs = []
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (arrA[i - 1] === arrB[j - 1]) {
      lcs.unshift(arrA[i - 1])
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return lcs
}

/**
 * 统计差异
 */
export function diffStats(diffResult, mode = 'unified') {
  let added = 0
  let removed = 0

  if (mode === 'unified') {
    for (const item of diffResult) {
      if (item.type === 'add') added++
      else if (item.type === 'remove') removed++
    }
  } else {
    for (const item of diffResult) {
      if (item.left?.type === 'remove') removed++
      if (item.right?.type === 'add') added++
    }
  }

  const modified = Math.min(added, removed)
  const netAdded = added - modified
  const netRemoved = removed - modified

  return {
    added: netAdded,
    removed: netRemoved,
    modified
  }
}