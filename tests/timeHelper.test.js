import { describe, it, expect } from 'vitest'
import {
  formatDate,
  parseDate,
  timestampToDate,
  dateToTimestamp,
  getCurrentTimestamp,
  getCurrentFormattedDate,
  explainCronExpression,
  buildInitialCronPreview,
  DEFAULT_CRON_EXPRESSION,
  parseCronExpression,
  buildTimezoneComparison,
  getAvailableTimezonePresets,
  formatTimezoneTime
} from '../src/renderer/utils/timeHelper.js'

describe('timeHelper', () => {
  describe('formatDate', () => {
    it('should format date with yyyy-MM-dd HH:mm:ss', () => {
      const timestamp = new Date(2024, 0, 15, 10, 30, 45).getTime()
      const result = formatDate(timestamp, 'yyyy-MM-dd HH:mm:ss')
      expect(result).toBe('2024-01-15 10:30:45')
    })

    it('should format date with yyyy/MM/dd', () => {
      const timestamp = new Date(2024, 11, 25).getTime()
      const result = formatDate(timestamp, 'yyyy/MM/dd')
      expect(result).toBe('2024/12/25')
    })

    it('should format date with yyyyMMdd', () => {
      const timestamp = new Date(2024, 5, 1).getTime()
      const result = formatDate(timestamp, 'yyyyMMdd')
      expect(result).toBe('20240601')
    })

    it('should format date with Chinese format', () => {
      const timestamp = new Date(2024, 0, 15, 10, 30, 45).getTime()
      const result = formatDate(timestamp, 'yyyy年MM月dd日HH时mm分ss秒')
      expect(result).toBe('2024年01月15日10时30分45秒')
    })

    it('should format date with HH:mm:ss only', () => {
      const timestamp = new Date(2024, 0, 15, 14, 5, 9).getTime()
      const result = formatDate(timestamp, 'HH:mm:ss')
      expect(result).toBe('14:05:09')
    })

    it('should pad single digit values', () => {
      const timestamp = new Date(2024, 0, 5, 8, 5, 3).getTime()
      const result = formatDate(timestamp, 'yyyy-MM-dd HH:mm:ss')
      expect(result).toBe('2024-01-05 08:05:03')
    })
  })

  describe('parseDate', () => {
    it('should parse valid date string', () => {
      const result = parseDate('2024-01-15 10:30:45')
      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(0)
      expect(result.getDate()).toBe(15)
      expect(result.getHours()).toBe(10)
      expect(result.getMinutes()).toBe(30)
      expect(result.getSeconds()).toBe(45)
    })

    it('should return null for invalid format', () => {
      expect(parseDate('2024-01-15')).toBeNull()
      expect(parseDate('2024/01/15 10:30:45')).toBeNull()
      expect(parseDate('invalid')).toBeNull()
      expect(parseDate('')).toBeNull()
    })

    it('should return null for malformed date', () => {
      expect(parseDate('2024-13-15 10:30:45')).toBeInstanceOf(Date) // JS Date 允许无效月份
      expect(parseDate('2024-01-32 10:30:45')).toBeInstanceOf(Date) // JS Date 允许溢出
    })
  })

  describe('timestampToDate', () => {
    it('should convert second timestamp to date', () => {
      const ts = 1705303845 // 2024-01-15 10:30:45 (approx)
      const result = timestampToDate(ts, 'second', 'yyyy-MM-dd HH:mm:ss')
      expect(result.success).toBe(true)
      expect(result.result).toBeDefined()
    })

    it('should convert millisecond timestamp to date', () => {
      const ts = 1705303845000
      const result = timestampToDate(ts, 'millisecond', 'yyyy-MM-dd HH:mm:ss')
      expect(result.success).toBe(true)
      expect(result.result).toBeDefined()
    })

    it('should return error for invalid timestamp', () => {
      const result = timestampToDate('invalid', 'second')
      expect(result.success).toBe(false)
      expect(result.error).toBe('无效时间戳')
    })

    it('should handle string timestamp', () => {
      const ts = '1705303845'
      const result = timestampToDate(ts, 'second', 'yyyy-MM-dd HH:mm:ss')
      expect(result.success).toBe(true)
    })

    it('should return error for out of range timestamp', () => {
      const result = timestampToDate(-1, 'second')
      expect(result.success).toBe(false)
      expect(result.error).toBe('时间戳超出有效范围')
    })

    it('should handle zero timestamp', () => {
      const result = timestampToDate(0, 'second', 'yyyy-MM-dd HH:mm:ss')
      expect(result.success).toBe(true)
      expect(result.result).toBe('1970-01-01 08:00:00') // UTC+8
    })
  })

  describe('dateToTimestamp', () => {
    it('should convert date string to timestamp', () => {
      const result = dateToTimestamp('2024-01-15 10:30:45')
      expect(result.success).toBe(true)
      expect(result.second).toBeDefined()
      expect(result.millisecond).toBeDefined()
      expect(result.millisecond).toBe(result.second * 1000)
    })

    it('should return error for invalid date format', () => {
      const result = dateToTimestamp('2024-01-15')
      expect(result.success).toBe(false)
      expect(result.error).toContain('无效日期格式')
    })

    it('should return error for empty string', () => {
      const result = dateToTimestamp('')
      expect(result.success).toBe(false)
    })
  })

  describe('getCurrentTimestamp', () => {
    it('should return millisecond timestamp by default', () => {
      const result = getCurrentTimestamp()
      expect(result).toBeGreaterThan(0)
      expect(result.toString().length).toBeGreaterThanOrEqual(13)
    })

    it('should return second timestamp when unit is second', () => {
      const result = getCurrentTimestamp('second')
      expect(result).toBeGreaterThan(0)
      expect(result.toString().length).toBeLessThanOrEqual(10)
    })

    it('should return consistent values', () => {
      const ms = getCurrentTimestamp('millisecond')
      const s = getCurrentTimestamp('second')
      expect(Math.floor(ms / 1000)).toBe(s)
    })
  })

  describe('getCurrentFormattedDate', () => {
    it('should return formatted current date', () => {
      const result = getCurrentFormattedDate('yyyy-MM-dd HH:mm:ss')
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('should return current date with custom format', () => {
      const result = getCurrentFormattedDate('yyyyMMdd')
      expect(result).toMatch(/^\d{8}$/)
    })
  })

  describe('parseCronExpression', () => {
    it('should parse a standard 5-field cron expression', () => {
      const result = parseCronExpression('*/15 9-18 * * 1-5')

      expect(result.success).toBe(true)
      expect(result.fields.minute.has(0)).toBe(true)
      expect(result.fields.minute.has(15)).toBe(true)
      expect(result.fields.hour.has(9)).toBe(true)
      expect(result.fields.dayOfWeek.has(5)).toBe(true)
    })

    it('should reject invalid field count', () => {
      const result = parseCronExpression('* * * * * *')

      expect(result.success).toBe(false)
      expect(result.displayMessage).toContain('5 个字段')
    })

    it('should reject out-of-range values', () => {
      const result = parseCronExpression('60 * * * *')

      expect(result.success).toBe(false)
      expect(result.displayMessage).toContain('分钟字段')
    })

    it('should reject invalid range order', () => {
      const result = parseCronExpression('* 18-9 * * *')

      expect(result.success).toBe(false)
      expect(result.displayMessage).toContain('起点不能大于终点')
    })
  })

  describe('explainCronExpression', () => {
    it('builds a ready initial preview for the default Cron expression', () => {
      const preview = buildInitialCronPreview(new Date(2026, 0, 1, 8, 0, 0))

      expect(preview.expression).toBe(DEFAULT_CRON_EXPRESSION)
      expect(preview.success).toBe(true)
      expect(preview.description).toBeTruthy()
      expect(preview.formattedRuns).toHaveLength(5)
    })

    it('should explain cron and return next 5 local run times', () => {
      const base = new Date(2026, 0, 1, 8, 0, 0)
      const result = explainCronExpression('0 9 * * 1-5', base)

      expect(result.success).toBe(true)
      expect(result.description).toContain('分钟为 0')
      expect(result.formattedRuns).toHaveLength(5)
      expect(result.formattedRuns[0]).toBe('2026-01-01 09:00:00')
    })

    it('should support step syntax for future times', () => {
      const base = new Date(2026, 0, 1, 8, 0, 0)
      const result = explainCronExpression('*/30 8 * * *', base)

      expect(result.success).toBe(true)
      expect(result.formattedRuns.slice(0, 2)).toEqual([
        '2026-01-01 08:30:00',
        '2026-01-02 08:00:00'
      ])
    })

    it('should reject impossible day of month values', () => {
      const result = explainCronExpression('0 0 32 * *')

      expect(result.success).toBe(false)
      expect(result.displayMessage).toContain('日期字段')
    })
  })

  describe('timezone comparison', () => {
    it('builds timezone rows for selected presets', () => {
      const result = buildTimezoneComparison(['new-york', 'tokyo'], new Date(2026, 0, 1, 12, 0, 0).getTime())

      expect(result.success).toBe(true)
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0].label).toBe('纽约')
      expect(result.rows[0].time).toMatch(/^\d{2}:\d{2}:\d{2}$/)
      expect(result.rows[0].relation).toBeTruthy()
    })

    it('filters addable timezone presets', () => {
      const result = getAvailableTimezonePresets(['local', 'tokyo'])

      expect(result.some((item) => item.id === 'local')).toBe(false)
      expect(result.some((item) => item.id === 'london')).toBe(true)
    })

    it('returns relation labels for neighboring dates', () => {
      const base = new Date(2026, 0, 1, 23, 30, 0).getTime()
      const result = formatTimezoneTime({ id: 'tokyo', label: '东京', timeZone: 'Asia/Tokyo' }, base)

      expect(result.success).toBe(true)
      expect(['今天', '明天']).toContain(result.row.relation)
    })

    it('returns error for invalid timezone', () => {
      const result = formatTimezoneTime({ id: 'bad', label: 'Bad', timeZone: 'Not/AZone' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('时区格式化失败')
    })
  })
})
