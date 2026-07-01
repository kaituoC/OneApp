const CASE_TYPES = new Set(['upper', 'lower', 'title', 'camel', 'pascal', 'snake', 'kebab'])

export function getTextStats(input) {
  if (!input) {
    return {
      characters: 0,
      words: 0,
      lines: 0,
      nonEmptyLines: 0,
      bytes: 0
    }
  }

  const lines = input.split('\n')
  return {
    characters: Array.from(input.replace(/\r?\n/g, '')).length,
    words: countWords(input),
    lines: lines.length,
    nonEmptyLines: lines.filter((line) => line.trim().length > 0).length,
    bytes: new TextEncoder().encode(input).length
  }
}

export function convertTextCase(input, type) {
  if (!CASE_TYPES.has(type)) {
    return { success: false, error: `不支持的转换类型：${type}` }
  }

  if (type === 'upper') return { success: true, result: input.toUpperCase() }
  if (type === 'lower') return { success: true, result: input.toLowerCase() }

  const tokens = tokenizeText(input)
  if (type === 'title') {
    return { success: true, result: tokens.map(capitalizeToken).join(' ') }
  }

  const normalized = tokens.map((token) => token.toLowerCase())
  if (type === 'snake') return { success: true, result: normalized.join('_') }
  if (type === 'kebab') return { success: true, result: normalized.join('-') }
  if (type === 'pascal') return { success: true, result: normalized.map(capitalizeToken).join('') }

  const [first = '', ...rest] = normalized
  return { success: true, result: first + rest.map(capitalizeToken).join('') }
}

export function sortLines(input, direction = 'asc') {
  const lines = splitTextLines(input)
  const sorted = [...lines].sort((a, b) => a.localeCompare(b))
  if (direction === 'desc') sorted.reverse()
  return { success: true, result: sorted.join('\n') }
}

export function dedupeLines(input) {
  const lines = splitTextLines(input)
  const seen = new Set()
  const unique = []

  for (const line of lines) {
    if (seen.has(line)) continue
    seen.add(line)
    unique.push(line)
  }

  return {
    success: true,
    result: unique.join('\n'),
    summary: {
      originalLines: lines.length,
      remainingLines: unique.length,
      removedLines: lines.length - unique.length
    }
  }
}

function splitTextLines(input) {
  if (!input) return []
  return input.split('\n')
}

function countWords(input) {
  const latinOrNumberWords = input.match(/[A-Za-z0-9]+/g) || []
  const cjkCharacters = input.match(/[\u3400-\u9fff]/g) || []
  return latinOrNumberWords.length + cjkCharacters.length
}

function tokenizeText(input) {
  return input.match(/[A-Za-z0-9]+|[\u3400-\u9fff]+/g) || []
}

function capitalizeToken(token) {
  if (!token) return ''
  const [first, ...rest] = Array.from(token)
  return first.toUpperCase() + rest.join('').toLowerCase()
}
