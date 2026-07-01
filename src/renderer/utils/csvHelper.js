import Papa from 'papaparse'

function csvError(message) {
  return {
    success: false,
    error: message,
    displayMessage: `✗ CSV 处理错误：${message}`
  }
}

function jsonError(message) {
  return {
    success: false,
    error: message,
    displayMessage: `✗ JSON 处理错误：${message}`
  }
}

function normalizePapaError(error) {
  if (!error) return 'CSV 解析失败'
  if (error.code === 'TooManyFields' || error.code === 'TooFewFields' || error.type === 'FieldMismatch') {
    return `数据行列数与表头不一致（第 ${error.row + 2} 行）`
  }
  return error.message || 'CSV 解析失败'
}

function validateCsvInput(input) {
  if (!String(input || '').trim()) {
    return csvError('CSV 内容不能为空')
  }
  return null
}

function validateHeaders(headers) {
  if (!headers.length || headers.every((header) => !String(header).trim())) {
    return csvError('CSV 必须包含表头')
  }
  if (headers.some((header) => !String(header).trim())) {
    return csvError('CSV 表头不能为空')
  }
  return null
}

export function csvToJson(input) {
  const inputError = validateCsvInput(input)
  if (inputError) return inputError

  const parsed = Papa.parse(input, {
    header: true,
    skipEmptyLines: true
  })

  if (parsed.errors?.length) {
    return csvError(normalizePapaError(parsed.errors[0]))
  }

  const headers = parsed.meta?.fields || []
  const headerError = validateHeaders(headers)
  if (headerError) return headerError

  return {
    success: true,
    result: JSON.stringify(parsed.data, null, 2),
    message: `已转换 ${parsed.data.length} 行 CSV`
  }
}

export function jsonToCsv(input) {
  let parsed
  try {
    parsed = JSON.parse(input)
  } catch (error) {
    return jsonError(error.message || 'JSON 解析失败')
  }

  if (!Array.isArray(parsed) || parsed.some((item) => !item || Array.isArray(item) || typeof item !== 'object')) {
    return jsonError('请输入 JSON 对象数组')
  }

  const fields = []
  parsed.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!fields.includes(key)) fields.push(key)
    })
  })

  if (fields.length === 0) {
    return jsonError('JSON 对象数组至少需要包含一个字段')
  }

  return {
    success: true,
    result: Papa.unparse(parsed, { columns: fields }),
    message: `已转换 ${parsed.length} 行 JSON`
  }
}

export function previewCsvTable(input) {
  const inputError = validateCsvInput(input)
  if (inputError) return inputError

  const parsed = Papa.parse(input, {
    header: false,
    skipEmptyLines: true
  })

  if (parsed.errors?.length) {
    return csvError(normalizePapaError(parsed.errors[0]))
  }

  const rows = parsed.data || []
  const headers = rows[0] || []
  const headerError = validateHeaders(headers)
  if (headerError) return headerError

  const width = headers.length
  const bodyRows = rows.slice(1)
  const mismatchIndex = bodyRows.findIndex((row) => row.length !== width)
  if (mismatchIndex >= 0) {
    return csvError(`数据行列数与表头不一致（第 ${mismatchIndex + 2} 行）`)
  }

  return {
    success: true,
    table: {
      headers: headers.map((header) => String(header)),
      rows: bodyRows.map((row) => row.map((cell) => String(cell ?? '')))
    },
    message: `已预览 ${bodyRows.length} 行 CSV`
  }
}
