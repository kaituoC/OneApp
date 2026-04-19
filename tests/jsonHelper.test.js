import { describe, it, expect } from 'vitest'
import { formatJSON, minifyJSON, validateJSON, unescapeJSON } from '../src/renderer/utils/jsonHelper.js'

describe('jsonHelper', () => {
  describe('formatJSON', () => {
    it('should format valid JSON with indentation', () => {
      const input = '{"name":"test","value":123}'
      const result = formatJSON(input)
      expect(result.success).toBe(true)
      expect(result.result).toBe('{\n  "name": "test",\n  "value": 123\n}')
    })

    it('should format nested JSON correctly', () => {
      const input = '{"obj":{"a":1,"b":2}}'
      const result = formatJSON(input)
      expect(result.success).toBe(true)
      expect(result.result).toContain('"obj"')
      expect(result.result).toContain('"a": 1')
    })

    it('should return error for invalid JSON', () => {
      const input = '{"name":"test"'
      const result = formatJSON(input)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.line).toBeGreaterThan(0)
      expect(result.column).toBeGreaterThan(0)
    })

    it('should handle arrays', () => {
      const input = '[1,2,3]'
      const result = formatJSON(input)
      expect(result.success).toBe(true)
      expect(result.result).toBe('[\n  1,\n  2,\n  3\n]')
    })
  })

  describe('minifyJSON', () => {
    it('should minify formatted JSON', () => {
      const input = '{\n  "name": "test",\n  "value": 123\n}'
      const result = minifyJSON(input)
      expect(result.success).toBe(true)
      expect(result.result).toBe('{"name":"test","value":123}')
    })

    it('should minify JSON with extra spaces', () => {
      const input = '{ "name" : "test" , "value" : 123 }'
      const result = minifyJSON(input)
      expect(result.success).toBe(true)
      expect(result.result).toBe('{"name":"test","value":123}')
    })

    it('should return error for invalid JSON', () => {
      const input = '{"name":"test"'
      const result = minifyJSON(input)
      expect(result.success).toBe(false)
    })
  })

  describe('validateJSON', () => {
    it('should validate correct JSON', () => {
      const input = '{"name":"test"}'
      const result = validateJSON(input)
      expect(result.success).toBe(true)
      expect(result.message).toBe('JSON 格式有效')
    })

    it('should detect missing closing brace', () => {
      const input = '{"name":"test"'
      const result = validateJSON(input)
      expect(result.success).toBe(false)
      expect(result.displayMessage).toContain('解析错误')
    })

    it('should detect extra comma', () => {
      const input = '{"name":"test",}'
      const result = validateJSON(input)
      expect(result.success).toBe(false)
    })

    it('should validate arrays', () => {
      const input = '[1, 2, 3]'
      const result = validateJSON(input)
      expect(result.success).toBe(true)
    })

    it('should validate empty object', () => {
      const input = '{}'
      const result = validateJSON(input)
      expect(result.success).toBe(true)
    })

    it('should validate empty array', () => {
      const input = '[]'
      const result = validateJSON(input)
      expect(result.success).toBe(true)
    })
  })

  describe('unescapeJSON', () => {
    it('should unescape escaped JSON string', () => {
      const input = '{\\"name\\":\\"test\\"}'
      const result = unescapeJSON(input)
      expect(result.success).toBe(true)
      expect(result.result).toBe('{"name":"test"}')
    })

    it('should handle already valid JSON', () => {
      const input = '{"name":"test"}'
      const result = unescapeJSON(input)
      expect(result.success).toBe(true)
    })
  })
})