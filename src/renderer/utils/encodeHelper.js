// 编码工具合集的纯逻辑层：Base64 / URL / JWT 解码 / Hash / 进制 / Unicode 转义。
// 全部为纯函数，可脱离组件单元测试。统一返回 { success, result } 或 { success, error }。

import md5 from 'js-md5'
import { timestampToDate } from './timeHelper.js'

// 标准 Base64 字符串 → UTF-8 文本（非法输入抛错），被 Base64 与 JWT 解码共用
function b64ToText(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

// ───────────────────────── Base64 ─────────────────────────

/** 文本 → Base64（经 UTF-8 字节编码，正确支持中文/emoji） */
export function base64Encode(text) {
  try {
    const bytes = new TextEncoder().encode(text)
    let bin = ''
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
    return { success: true, result: btoa(bin) }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

/** Base64 → 文本（UTF-8 解码，非法输入报错；容忍换行/空白，便于解码换行包裹的 Base64） */
export function base64Decode(str) {
  try {
    return { success: true, result: b64ToText(str.replace(/\s+/g, '')) }
  } catch (e) {
    return { success: false, error: '非法的 Base64 输入' }
  }
}

// ───────────────────────── URL ─────────────────────────

/** 文本 → URL 编码（encodeURIComponent） */
export function urlEncode(text) {
  try {
    return { success: true, result: encodeURIComponent(text) }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

/** URL 编码 → 文本（decodeURIComponent，非法转义报错） */
export function urlDecode(str) {
  try {
    return { success: true, result: decodeURIComponent(str) }
  } catch (e) {
    return { success: false, error: '非法的 URL 转义序列' }
  }
}

// ───────────────────────── JWT ─────────────────────────

// base64url 解码为 UTF-8 文本（复用标准 Base64 解码核心）
function base64UrlDecode(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return b64ToText(s)
}

// 秒级时间戳 → 人类可读时间（无效返回 null）；复用 timeHelper 保持与时间工具一致的格式
function formatTimestamp(sec) {
  const r = timestampToDate(sec, 'second')
  return r.success ? r.result : null
}

/**
 * 解码 JWT（不验签）。
 * @returns {{success:true, result:{header, payload, signature:string, timeFields:Object}} | {success:false, error}}
 *   timeFields：payload 中 exp/iat/nbf 字段对应的可读时间
 */
export function decodeJWT(token) {
  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    return { success: false, error: 'JWT 应为三段（header.payload.signature）' }
  }
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]))
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    const timeFields = {}
    for (const k of ['exp', 'iat', 'nbf']) {
      if (typeof payload[k] === 'number') {
        const t = formatTimestamp(payload[k])
        if (t) timeFields[k] = t
      }
    }
    return { success: true, result: { header, payload, signature: parts[2], timeFields } }
  } catch (e) {
    return { success: false, error: '无法解析 JWT：' + e.message }
  }
}

// ───────────────────────── Hash ─────────────────────────

async function subtleHex(algo, data) {
  const buf = await crypto.subtle.digest(algo, data)
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 一次性计算 MD5 / SHA-1 / SHA-256 / SHA-512（hex 小写）。
 * @returns {Promise<{success:true, result:{md5, sha1, sha256, sha512}} | {success:false, error}>}
 */
export async function hashAll(text) {
  try {
    const data = new TextEncoder().encode(text)
    const [sha1, sha256, sha512] = await Promise.all([
      subtleHex('SHA-1', data),
      subtleHex('SHA-256', data),
      subtleHex('SHA-512', data)
    ])
    return { success: true, result: { md5: md5(text), sha1, sha256, sha512 } }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// ───────────────────────── 进制转换 ─────────────────────────

const RADIX = { dec: 10, hex: 16, oct: 8, bin: 2 }
const RADIX_NAME = { dec: '十', hex: '十六', oct: '八', bin: '二' }
const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

// 按指定进制把字符串解析为 BigInt（仅非负整数；非法字符抛错）
function parseBigIntRadix(str, radix) {
  const valid = DIGITS.slice(0, radix)
  const big = BigInt(radix)
  let result = 0n
  for (const ch of str.toLowerCase()) {
    const d = valid.indexOf(ch)
    if (d === -1) throw new Error('invalid')
    result = result * big + BigInt(d)
  }
  return result
}

/**
 * 进制联动转换：把 `from` 进制的 value 转为 Dec/Hex/Oct/Bin 四种表示。
 * @param {string} value 源数字串
 * @param {'dec'|'hex'|'oct'|'bin'} from 源进制
 * @returns {{success:true, result:{dec, hex, oct, bin}} | {success:false, error}}
 */
export function convertBase(value, from) {
  const v = value.trim()
  if (v === '') {
    return { success: true, result: { dec: '', hex: '', oct: '', bin: '' } }
  }
  const radix = RADIX[from]
  try {
    const n = parseBigIntRadix(v, radix)
    return {
      success: true,
      result: { dec: n.toString(10), hex: n.toString(16), oct: n.toString(8), bin: n.toString(2) }
    }
  } catch (e) {
    return { success: false, error: `包含${RADIX_NAME[from]}进制不允许的字符（仅非负整数）` }
  }
}

// ───────────────────────── Unicode 转义 ─────────────────────────

/**
 * Unicode 转义：仅转义非 ASCII 字符（码点 > 0x7F），ASCII 原样保留。
 * @param {string} text
 * @param {'u'|'u-brace'|'html'} format `\u` / `\u{}` / HTML 实体
 */
export function unicodeEscape(text, format) {
  let out = ''
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (cp <= 0x7f) {
      out += ch
      continue
    }
    if (format === 'u') {
      // 按 UTF-16 码元输出，增补平面字符自动拆为代理对
      for (let i = 0; i < ch.length; i++) {
        out += '\\u' + ch.charCodeAt(i).toString(16).padStart(4, '0')
      }
    } else if (format === 'u-brace') {
      out += '\\u{' + cp.toString(16) + '}'
    } else {
      out += '&#x' + cp.toString(16) + ';'
    }
  }
  return { success: true, result: out }
}

/** Unicode 反转义：兼容 `\u` / `\u{}` / `&#x;` / `&#d;` 混合格式 */
export function unicodeUnescape(str) {
  try {
    let s = str
    s = s.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    s = s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    s = s.replace(/&#x([0-9a-fA-F]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    s = s.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    return { success: true, result: s }
  } catch (e) {
    return { success: false, error: '非法的转义序列' }
  }
}
