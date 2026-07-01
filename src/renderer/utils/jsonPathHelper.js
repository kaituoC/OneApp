import { JSONPath } from 'jsonpath-plus'

function jsonPathError(message) {
  return {
    success: false,
    error: message,
    displayMessage: `✗ JSONPath 查询错误：${message}`
  }
}

export function queryJSONPath(input, expression) {
  const path = String(expression || '').trim()
  if (!path) {
    return jsonPathError('JSONPath 表达式不能为空')
  }

  let json
  try {
    json = JSON.parse(input)
  } catch (error) {
    return jsonPathError(`JSON 解析失败：${error.message}`)
  }

  try {
    const matches = JSONPath({ path, json, resultType: 'all', wrap: true })
    if (!matches.length) {
      return jsonPathError('未找到匹配结果')
    }

    const values = matches.map((match) => match.value)
    const value = values.length === 1 ? values[0] : values
    return {
      success: true,
      result: JSON.stringify(value, null, 2),
      matches: matches.map((match) => ({
        path: match.path,
        summary: summarizeValue(match.value)
      })),
      message: `JSONPath 查询完成，共 ${matches.length} 个结果`
    }
  } catch (error) {
    return jsonPathError(error.message || 'JSONPath 表达式无效')
  }
}

function summarizeValue(value) {
  if (value === null) return 'null'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  const text = JSON.stringify(value)
  if (!text) return String(value)
  return text.length > 80 ? `${text.slice(0, 77)}...` : text
}
