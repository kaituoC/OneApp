// 正则测试器的纯逻辑层：编译正则并执行匹配，返回结构化结果。
// 被 Web Worker 引用，也可脱离 Worker 单独单元测试。

// 单次匹配命中数上限，超过则截断（防海量匹配撑爆 DOM）
export const MAX_MATCHES = 5000

/**
 * 执行正则匹配。
 * @param {string} pattern 正则源
 * @param {string} flags 标志位（g/i/m/s/u/y），内部会追加 'd' 以获取捕获组位置
 * @param {string} text 测试文本
 * @returns {{success:true, matches:Array, count:number, truncated:boolean} | {success:false, error:string}}
 *   matches 每项：{ index, end, match, groups: [{ value, index, end, name? }] }
 */
export function runRegex(pattern, flags, text) {
  // 空 pattern 视为无匹配，清空高亮
  if (!pattern) {
    return { success: true, matches: [], count: 0, truncated: false }
  }

  let re
  try {
    // 内部追加 'd'（hasIndices）以拿到每个捕获组的位置；去重避免重复 flag
    const effectiveFlags = flags.includes('d') ? flags : flags + 'd'
    re = new RegExp(pattern, effectiveFlags)
  } catch (e) {
    return { success: false, error: e.message }
  }

  const matches = []
  let truncated = false

  try {
    if (re.global) {
      let m
      while ((m = re.exec(text)) !== null) {
        matches.push(toMatch(m))
        if (matches.length >= MAX_MATCHES) {
          truncated = true
          break
        }
        // 零宽匹配（如 //、(?:) 命中空串）不推进 lastIndex 会死循环
        if (m.index === re.lastIndex) re.lastIndex++
      }
    } else {
      const m = re.exec(text)
      if (m) matches.push(toMatch(m))
    }
  } catch (e) {
    return { success: false, error: e.message }
  }

  return { success: true, matches, count: matches.length, truncated }
}

// 将一次 RegExp.exec 的结果转为结构化匹配（含捕获组位置与命名）
function toMatch(m) {
  const indices = m.indices || []
  const namedIndices = (m.indices && m.indices.groups) || null

  // 预构建位置 → name 映射（O(named groups)），避免对每个组逐一扫描（O(n²)）
  const posToName = {}
  if (namedIndices) {
    for (const [name, pos] of Object.entries(namedIndices)) {
      if (pos) posToName[`${pos[0]},${pos[1]}`] = name
    }
  }

  const groups = []
  for (let i = 1; i < m.length; i++) {
    const value = m[i] === undefined ? null : m[i]
    const pos = indices[i]
    const group = {
      value,
      index: pos ? pos[0] : null,
      end: pos ? pos[1] : null
    }
    if (pos) {
      const name = posToName[`${pos[0]},${pos[1]}`]
      if (name) group.name = name
    }
    groups.push(group)
  }

  return {
    index: m.index,
    end: m.index + m[0].length,
    match: m[0],
    groups
  }
}
