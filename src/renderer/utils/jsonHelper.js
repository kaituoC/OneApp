import { parseAllDocuments, stringify as stringifyYAML } from 'yaml'

export function formatJSON(input) {
  try {
    const parsed = JSON.parse(input)
    return { success: true, result: JSON.stringify(parsed, null, 2) }
  } catch (error) {
    return parseError(error, input)
  }
}

export function minifyJSON(input) {
  try {
    const parsed = JSON.parse(input)
    return { success: true, result: JSON.stringify(parsed) }
  } catch (error) {
    return parseError(error, input)
  }
}

export function validateJSON(input) {
  try {
    JSON.parse(input)
    return { success: true, message: 'JSON 格式有效' }
  } catch (error) {
    return parseError(error, input)
  }
}

export function unescapeJSON(input) {
  try {
    let unescaped = input
    try {
      unescaped = JSON.parse(`"${input}"`)
    } catch {
      unescaped = input
    }
    JSON.parse(unescaped)
    return { success: true, result: unescaped }
  } catch (error) {
    return parseError(error, input)
  }
}

export function jsonToYAML(input) {
  try {
    const parsed = JSON.parse(input)
    return { success: true, result: stringifyYAML(parsed) }
  } catch (error) {
    return parseError(error, input)
  }
}

export function yamlToJSON(input) {
  const parsed = parseSingleYAMLDocument(input)
  if (!parsed.success) return parsed
  return { success: true, result: JSON.stringify(parsed.value, null, 2) }
}

export function validateYAML(input) {
  const parsed = parseSingleYAMLDocument(input)
  if (!parsed.success) return parsed
  return { success: true, message: 'YAML 格式有效' }
}

function parseSingleYAMLDocument(input) {
  try {
    const docs = parseAllDocuments(input)
    const firstError = docs.flatMap((doc) => doc.errors || [])[0]
    if (firstError) return yamlError(firstError)
    if (docs.length > 1) return yamlMultiDocumentError()
    const doc = docs[0]
    return { success: true, value: doc ? doc.toJSON() : null }
  } catch (error) {
    return yamlError(error)
  }
}

function yamlMultiDocumentError() {
  return {
    success: false,
    error: 'YAML multi-document input is not supported',
    line: 1,
    column: 1,
    displayMessage: '✗ YAML 解析错误：暂不支持 YAML 多文档输入，请仅保留一个文档内容后重试'
  }
}

function yamlError(error) {
  const linePos = Array.isArray(error.linePos) ? error.linePos[0] : null
  const line = linePos?.line || 1
  const column = linePos?.col || linePos?.column || 1
  const message = error.message || String(error)

  return {
    success: false,
    error: message,
    line,
    column,
    displayMessage: `✗ YAML 解析错误：第${line}行，第${column}列，${message}`
  }
}

function parseError(error, input) {
  const message = error.message
  const positionMatch = message.match(/position\s+(\d+)/i)
  let line = 1
  let column = 1

  if (positionMatch) {
    const pos = parseInt(positionMatch[1], 10)
    const lines = input.substring(0, pos).split('\n')
    line = lines.length
    column = lines[lines.length - 1].length + 1
  }

  return {
    success: false,
    error: message,
    line,
    column,
    displayMessage: `✗ 解析错误：第${line}行，第${column}列，${message}`
  }
}
