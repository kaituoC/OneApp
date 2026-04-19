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
