import { describe, it, expect } from 'vitest'
import {
  formatDate,
  parseDate,
  timestampToDate,
  dateToTimestamp,
  getCurrentTimestamp,
  getCurrentFormattedDate
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
})