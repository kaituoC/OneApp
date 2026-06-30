import { describe, it, expect } from 'vitest'
import {
  formatJSON,
  minifyJSON,
  validateJSON,
  unescapeJSON,
  jsonToYAML,
  yamlToJSON,
  validateYAML
} from '../src/renderer/utils/jsonHelper.js'

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

  describe('jsonToYAML', () => {
    it('should convert valid JSON object to block style YAML', () => {
      const result = jsonToYAML('{"name":"OneApp","tags":["dev","tool"],"enabled":true}')
      expect(result.success).toBe(true)
      expect(result.result).toContain('name: OneApp')
      expect(result.result).toContain('tags:')
      expect(result.result).toContain('- dev')
      expect(result.result).toContain('enabled: true')
    })

    it('should return JSON parse error for invalid JSON', () => {
      const result = jsonToYAML('{"name":"OneApp"')
      expect(result.success).toBe(false)
      expect(result.displayMessage).toContain('解析错误')
    })
  })

  describe('yamlToJSON', () => {
    it('should convert valid YAML to formatted JSON', () => {
      const input = 'name: OneApp\ntags:\n  - dev\n  - tool\nenabled: true\ncount: 3\nempty: null'
      const result = yamlToJSON(input)
      expect(result.success).toBe(true)
      expect(result.result).toContain('"name": "OneApp"')
      expect(result.result).toContain('"enabled": true')
      expect(result.result).toContain('"count": 3')
      expect(result.result).toContain('"empty": null')
    })

    it('should keep date-like scalars as strings', () => {
      const result = yamlToJSON('date: 2026-06-30')
      expect(result.success).toBe(true)
      expect(JSON.parse(result.result)).toEqual({ date: '2026-06-30' })
    })

    it('should accept a single leading document marker', () => {
      const result = yamlToJSON('---\nname: OneApp\n')
      expect(result.success).toBe(true)
      expect(JSON.parse(result.result)).toEqual({ name: 'OneApp' })
    })

    it('should reject multiple YAML documents', () => {
      const result = yamlToJSON('---\nname: first\n---\nname: second\n')
      expect(result.success).toBe(false)
      expect(result.displayMessage).toContain('多文档')
    })
  })

  describe('validateYAML', () => {
    it('should validate single-document YAML', () => {
      const result = validateYAML('name: OneApp\nnested:\n  value: 1')
      expect(result.success).toBe(true)
      expect(result.message).toBe('YAML 格式有效')
    })

    it('should return line and column for invalid YAML when available', () => {
      const result = validateYAML('name: OneApp\n  broken: true')
      expect(result.success).toBe(false)
      expect(result.displayMessage).toContain('YAML')
      expect(result.line).toBeGreaterThan(0)
      expect(result.column).toBeGreaterThan(0)
    })

    it('should reject multiple YAML documents', () => {
      const result = validateYAML('---\na: 1\n---\nb: 2')
      expect(result.success).toBe(false)
      expect(result.displayMessage).toContain('多文档')
    })
  })
})
