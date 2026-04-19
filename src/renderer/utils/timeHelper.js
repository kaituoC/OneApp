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