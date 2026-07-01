import QRCode from 'qrcode'

const UUID_BATCH_LIMIT = 1000
const PASSWORD_MAX_LENGTH = 128
const QR_MIN_SIZE = 128
const QR_MAX_SIZE = 1024
const QR_ERROR_LEVELS = new Set(['L', 'M', 'Q', 'H'])
const LOREM_LIMITS = {
  words: 1000,
  sentences: 200,
  paragraphs: 50
}

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?/'
const SIMILAR_CHARS = new Set('Il1O0o')

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et',
  'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis',
  'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex',
  'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'reprehenderit',
  'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur'
]

function success(result, message = '生成成功', extra = {}) {
  return { success: true, result, message, ...extra }
}

function failure(error) {
  return { success: false, error }
}

function normalizeInteger(value, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.trunc(number)
}

function createRandomBytes(length, randomBytes) {
  if (typeof randomBytes === 'function') {
    const bytes = randomBytes(length)
    if (!(bytes instanceof Uint8Array) || bytes.length < length) {
      throw new Error('随机源返回值无效')
    }
    return bytes.slice(0, length)
  }

  const cryptoRef = globalThis.crypto
  if (!cryptoRef || typeof cryptoRef.getRandomValues !== 'function') {
    throw new Error('当前环境不支持安全随机数')
  }
  const bytes = new Uint8Array(length)
  cryptoRef.getRandomValues(bytes)
  return bytes
}

function byteToHex(byte) {
  return byte.toString(16).padStart(2, '0')
}

function formatUuid(bytes) {
  const hex = Array.from(bytes, byteToHex)
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join('')
  ].join('-')
}

export function generateUuidV4(options = {}) {
  const count = normalizeInteger(options.count, 1)
  if (count < 1 || count > UUID_BATCH_LIMIT) {
    return failure(`UUID 数量需在 1-${UUID_BATCH_LIMIT} 之间`)
  }

  try {
    const values = Array.from({ length: count }, () => {
      const bytes = createRandomBytes(16, options.randomBytes)
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      return formatUuid(bytes)
    })
    return success(values.join('\n'), `已生成 ${count.toLocaleString()} 个 UUID`, { values })
  } catch (error) {
    return failure(error.message)
  }
}

function buildPasswordCharset(options) {
  const sets = []
  if (options.useLowercase !== false) sets.push(LOWERCASE)
  if (options.useUppercase !== false) sets.push(UPPERCASE)
  if (options.useDigits !== false) sets.push(DIGITS)
  if (options.useSymbols) sets.push(SYMBOLS)

  const chars = sets.join('').split('')
  const filtered = options.excludeSimilar
    ? chars.filter((char) => !SIMILAR_CHARS.has(char))
    : chars
  return Array.from(new Set(filtered)).join('')
}

export function generatePassword(options = {}) {
  const length = normalizeInteger(options.length, 16)
  if (length < 1 || length > PASSWORD_MAX_LENGTH) {
    return failure(`密码长度需在 1-${PASSWORD_MAX_LENGTH} 之间`)
  }

  const charset = buildPasswordCharset(options)
  if (!charset) return failure('至少选择一种字符集')

  try {
    const bytes = createRandomBytes(length, options.randomBytes)
    const password = Array.from(bytes, (byte) => charset[byte % charset.length]).join('')
    return success(password, `已生成 ${length.toLocaleString()} 位密码`, { charsetLength: charset.length })
  } catch (error) {
    return failure(error.message)
  }
}

function getLoremWord(index) {
  return LOREM_WORDS[index % LOREM_WORDS.length]
}

function createWords(count, startIndex = 0) {
  return Array.from({ length: count }, (_, index) => getLoremWord(startIndex + index))
}

function capitalize(text) {
  return text ? text[0].toUpperCase() + text.slice(1) : text
}

function createSentence(index) {
  const length = 8 + (index % 5)
  return `${capitalize(createWords(length, index * 7).join(' '))}.`
}

export function generateLorem(options = {}) {
  const mode = options.mode || 'paragraphs'
  const limit = LOREM_LIMITS[mode]
  if (!limit) return failure('不支持的 Lorem 生成模式')

  const count = normalizeInteger(options.count, 1)
  if (count < 1 || count > limit) {
    return failure(`${mode === 'words' ? '词数' : mode === 'sentences' ? '句数' : '段数'}需在 1-${limit} 之间`)
  }

  if (mode === 'words') {
    return success(createWords(count).join(' '), `已生成 ${count.toLocaleString()} 个词`)
  }

  if (mode === 'sentences') {
    return success(
      Array.from({ length: count }, (_, index) => createSentence(index)).join(' '),
      `已生成 ${count.toLocaleString()} 个句子`
    )
  }

  const paragraphs = Array.from({ length: count }, (_, paragraphIndex) => {
    return Array.from({ length: 3 }, (_, sentenceIndex) => {
      return createSentence(paragraphIndex * 3 + sentenceIndex)
    }).join(' ')
  })
  return success(paragraphs.join('\n\n'), `已生成 ${count.toLocaleString()} 个段落`)
}

export async function generateQrCode(options = {}) {
  const text = String(options.text || '').trim()
  if (!text) return failure('二维码内容不能为空')

  const size = normalizeInteger(options.size, 256)
  if (size < QR_MIN_SIZE || size > QR_MAX_SIZE) {
    return failure(`二维码尺寸需在 ${QR_MIN_SIZE}-${QR_MAX_SIZE} 之间`)
  }

  const errorCorrectionLevel = String(options.errorCorrectionLevel || 'M').toUpperCase()
  if (!QR_ERROR_LEVELS.has(errorCorrectionLevel)) {
    return failure('纠错级别必须是 L、M、Q 或 H')
  }

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel,
      margin: 2,
      width: size,
      type: 'image/png'
    })
    return success(dataUrl, `已生成 ${size}x${size} 二维码`, {
      dataUrl,
      text,
      size,
      errorCorrectionLevel
    })
  } catch (error) {
    return failure(`二维码生成失败：${error.message || String(error)}`)
  }
}
