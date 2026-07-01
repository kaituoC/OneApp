/**
 * 时间转换工具函数
 */

/**
 * 格式化日期
 * @param {number} timestamp - 时间戳（毫秒）
 * @param {string} format - 格式字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(timestamp, format) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('yyyy', year)
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 解析日期字符串为 Date 对象
 * @param {string} dateStr - 日期字符串，格式：yyyy-MM-dd HH:mm:ss
 * @returns {Date|null} Date 对象，解析失败返回 null
 */
export function parseDate(dateStr) {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/)
  if (!match) return null

  const [, year, month, day, hours, minutes, seconds] = match
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds)
  )
}

/**
 * 时间戳转日期
 * @param {number|string} ts - 时间戳
 * @param {string} unit - 单位：'second' 或 'millisecond'
 * @param {string} format - 输出格式
 * @returns {object} { success, result/error }
 */
export function timestampToDate(ts, unit = 'second', format = 'yyyy-MM-dd HH:mm:ss') {
  const timestamp = parseInt(ts)
  if (isNaN(timestamp)) {
    return { success: false, error: '无效时间戳' }
  }

  let ms = timestamp
  if (unit === 'second') {
    ms = timestamp * 1000
  }

  // 检查时间戳范围是否合理
  if (ms < 0 || ms > 8640000000000000) {
    return { success: false, error: '时间戳超出有效范围' }
  }

  return { success: true, result: formatDate(ms, format) }
}

/**
 * 日期转时间戳
 * @param {string} dateStr - 日期字符串
 * @returns {object} { success, second, millisecond, error }
 */
export function dateToTimestamp(dateStr) {
  const date = parseDate(dateStr)
  if (!date) {
    return { success: false, error: '无效日期格式，请使用 yyyy-MM-dd HH:mm:ss' }
  }

  const ms = date.getTime()
  return {
    success: true,
    second: Math.floor(ms / 1000),
    millisecond: ms
  }
}

/**
 * 获取当前时间戳
 * @param {string} unit - 单位：'second' 或 'millisecond'
 * @returns {number} 时间戳
 */
export function getCurrentTimestamp(unit = 'millisecond') {
  const now = Date.now()
  return unit === 'second' ? Math.floor(now / 1000) : now
}

/**
 * 获取当前格式化日期
 * @param {string} format - 输出格式
 * @returns {string} 格式化后的日期字符串
 */
export function getCurrentFormattedDate(format = 'yyyy-MM-dd HH:mm:ss') {
  return formatDate(Date.now(), format)
}

const CRON_FIELDS = [
  { key: 'minute', label: '分钟', min: 0, max: 59 },
  { key: 'hour', label: '小时', min: 0, max: 23 },
  { key: 'dayOfMonth', label: '日期', min: 1, max: 31 },
  { key: 'month', label: '月份', min: 1, max: 12 },
  { key: 'dayOfWeek', label: '星期', min: 0, max: 7 }
]

export function explainCronExpression(expression, baseDate = new Date()) {
  const parsed = parseCronExpression(expression)
  if (!parsed.success) return parsed

  const nextRuns = getNextCronRuns(parsed.fields, baseDate, 5)
  if (!nextRuns.length) {
    return {
      success: false,
      error: '无法在未来 5 年内计算出执行时间',
      displayMessage: '✗ Cron 解析错误：无法在未来 5 年内计算出执行时间'
    }
  }

  return {
    success: true,
    description: describeCronFields(parsed.parts),
    nextRuns,
    formattedRuns: nextRuns.map((date) => formatDate(date.getTime(), 'yyyy-MM-dd HH:mm:ss')),
    message: 'Cron 表达式解析完成'
  }
}

export function parseCronExpression(expression) {
  const parts = String(expression || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length !== 5) {
    return cronError('Cron 表达式必须是 5 个字段：分钟 小时 日 月 星期')
  }

  const fields = {}
  for (let index = 0; index < CRON_FIELDS.length; index += 1) {
    const meta = CRON_FIELDS[index]
    const parsed = parseCronField(parts[index], meta)
    if (!parsed.success) return parsed
    fields[meta.key] = parsed.values
  }

  return { success: true, parts, fields }
}

function parseCronField(field, meta) {
  const values = new Set()
  const pieces = String(field).split(',')
  if (!pieces.length || pieces.some((piece) => !piece)) {
    return cronError(`${meta.label}字段包含空片段`)
  }

  for (const piece of pieces) {
    const result = parseCronFieldPiece(piece, meta)
    if (!result.success) return result
    result.values.forEach((value) => values.add(normalizeCronValue(value, meta)))
  }

  return { success: true, values }
}

function parseCronFieldPiece(piece, meta) {
  const [rangePart, stepPart] = piece.split('/')
  if (piece.split('/').length > 2) {
    return cronError(`${meta.label}字段步进语法无效`)
  }

  const step = stepPart === undefined ? 1 : Number(stepPart)
  if (!Number.isInteger(step) || step < 1) {
    return cronError(`${meta.label}字段步进必须是大于 0 的整数`)
  }

  let start = meta.min
  let end = meta.max

  if (rangePart !== '*') {
    if (rangePart.includes('-')) {
      const [rawStart, rawEnd] = rangePart.split('-')
      start = parseCronNumber(rawStart, meta)
      end = parseCronNumber(rawEnd, meta)
      if (start === null || end === null) return cronError(`${meta.label}字段范围无效`)
      if (start > end) return cronError(`${meta.label}字段范围起点不能大于终点`)
    } else {
      const single = parseCronNumber(rangePart, meta)
      if (single === null) return cronError(`${meta.label}字段数值无效`)
      start = single
      end = single
    }
  }

  if (start < meta.min || end > meta.max) {
    return cronError(`${meta.label}字段超出范围 ${meta.min}-${meta.max}`)
  }

  const values = []
  for (let value = start; value <= end; value += step) {
    values.push(value)
  }
  return { success: true, values }
}

function parseCronNumber(value, meta) {
  if (!/^\d+$/.test(String(value))) return null
  const number = Number(value)
  if (!Number.isInteger(number)) return null
  if (meta.key === 'dayOfWeek' && number === 7) return 7
  return number
}

function normalizeCronValue(value, meta) {
  if (meta.key === 'dayOfWeek' && value === 7) return 0
  return value
}

function getNextCronRuns(fields, baseDate, count) {
  const results = []
  const current = new Date(baseDate.getTime())
  current.setSeconds(0, 0)
  current.setMinutes(current.getMinutes() + 1)

  const limit = new Date(baseDate.getTime())
  limit.setFullYear(limit.getFullYear() + 5)

  while (results.length < count && current <= limit) {
    if (matchesCronDate(current, fields)) {
      results.push(new Date(current.getTime()))
    }
    current.setMinutes(current.getMinutes() + 1)
  }

  return results
}

function matchesCronDate(date, fields) {
  if (!fields.minute.has(date.getMinutes())) return false
  if (!fields.hour.has(date.getHours())) return false
  if (!fields.month.has(date.getMonth() + 1)) return false

  const dayMatches = fields.dayOfMonth.has(date.getDate())
  const weekMatches = fields.dayOfWeek.has(date.getDay())
  const dayWildcard = fields.dayOfMonth.size === 31
  const weekWildcard = fields.dayOfWeek.size === 7

  if (dayWildcard && weekWildcard) return true
  if (dayWildcard) return weekMatches
  if (weekWildcard) return dayMatches
  return dayMatches || weekMatches
}

function describeCronFields(parts) {
  const descriptions = parts.map((part, index) => describeCronField(part, CRON_FIELDS[index]))
  return descriptions.join('；')
}

function describeCronField(part, meta) {
  if (part === '*') return `${meta.label}为每${meta.label}`
  if (part.startsWith('*/')) return `${meta.label}每 ${part.slice(2)} 个单位`
  return `${meta.label}为 ${part}`
}

function cronError(message) {
  return {
    success: false,
    error: message,
    displayMessage: `✗ Cron 解析错误：${message}`
  }
}
