import { format as formatSqlText } from 'sql-formatter'
import { XMLValidator } from 'fast-xml-parser'

function formatError(kind, message) {
  return {
    success: false,
    error: message,
    displayMessage: `✗ ${kind} 处理错误：${message}`
  }
}

function validateInput(kind, input) {
  if (!String(input || '').trim()) {
    return formatError(kind, `${kind} 内容不能为空`)
  }
  return null
}

export function formatSQL(input) {
  const inputError = validateInput('SQL', input)
  if (inputError) return inputError

  try {
    return {
      success: true,
      result: formatSqlText(input, { language: 'sql', keywordCase: 'upper' }),
      message: 'SQL 格式化完成'
    }
  } catch (error) {
    return formatError('SQL', error.message || 'SQL 格式化失败')
  }
}

export function minifySQL(input) {
  const inputError = validateInput('SQL', input)
  if (inputError) return inputError

  return {
    success: true,
    result: collapseWhitespaceOutsideQuotes(input),
    message: 'SQL 压缩完成'
  }
}

export function formatXML(input) {
  const inputError = validateInput('XML', input)
  if (inputError) return inputError

  const validation = validateXML(input)
  if (!validation.success) return validation

  return {
    success: true,
    result: prettyPrintXML(input),
    message: 'XML 格式化完成'
  }
}

export function minifyXML(input) {
  const inputError = validateInput('XML', input)
  if (inputError) return inputError

  const validation = validateXML(input)
  if (!validation.success) return validation

  return {
    success: true,
    result: input.trim().replace(/>\s+</g, '><'),
    message: 'XML 压缩完成'
  }
}

function validateXML(input) {
  const result = XMLValidator.validate(input)
  if (result === true) return { success: true }
  const err = result?.err
  const location = err?.line ? `第${err.line}行，第${err.col || 1}列，` : ''
  return formatError('XML', `${location}${err?.msg || 'XML 结构无效'}`)
}

function collapseWhitespaceOutsideQuotes(input) {
  let result = ''
  let quote = ''
  let pendingSpace = false

  for (const char of input.trim()) {
    if (quote) {
      result += char
      if (char === quote) quote = ''
      continue
    }

    if (char === '\'' || char === '"' || char === '`') {
      if (pendingSpace && result && !result.endsWith(' ')) result += ' '
      pendingSpace = false
      quote = char
      result += char
      continue
    }

    if (/\s/.test(char)) {
      pendingSpace = true
      continue
    }

    if (pendingSpace && result && !result.endsWith(' ')) {
      result += ' '
    }
    pendingSpace = false
    result += char
  }

  return result
}

function prettyPrintXML(input) {
  const tokens = input.trim().match(/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) || []
  const lines = []
  let indent = 0

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i].trim()
    if (!token) continue

    const next = tokens[i + 1]?.trim()
    const afterNext = tokens[i + 2]?.trim()
    const openName = getOpeningTagName(token)
    const closeName = getClosingTagName(afterNext)

    if (openName && next && !next.startsWith('<') && closeName === openName) {
      lines.push(`${'  '.repeat(indent)}${token}${next}${afterNext}`)
      i += 2
      continue
    }

    if (token.startsWith('</')) {
      indent = Math.max(0, indent - 1)
      lines.push(`${'  '.repeat(indent)}${token}`)
      continue
    }

    lines.push(`${'  '.repeat(indent)}${token}`)

    if (openName) {
      indent += 1
    }
  }

  return lines.join('\n')
}

function getOpeningTagName(token) {
  if (!token.startsWith('<') || token.startsWith('</') || token.startsWith('<?') || token.startsWith('<!--') || token.startsWith('<!')) {
    return ''
  }
  if (token.endsWith('/>')) return ''
  return token.match(/^<([^\s>/]+)/)?.[1] || ''
}

function getClosingTagName(token = '') {
  return token.match(/^<\/([^\s>]+)>$/)?.[1] || ''
}
