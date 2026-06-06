import { describe, it, expect } from 'vitest'
import {
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  decodeJWT,
  hashAll,
  convertBase,
  unicodeEscape,
  unicodeUnescape
} from '../src/renderer/utils/encodeHelper.js'

describe('Base64', () => {
  it('编解码 UTF-8（含中文/emoji）往返', () => {
    const text = '你好🌍 hello'
    const enc = base64Encode(text)
    expect(enc.success).toBe(true)
    const dec = base64Decode(enc.result)
    expect(dec.success).toBe(true)
    expect(dec.result).toBe(text)
  })

  it('编码结果可被标准解码器还原', () => {
    const enc = base64Encode('你好')
    // "你好" 的 UTF-8 Base64 是 5L2g5aW9
    expect(enc.result).toBe('5L2g5aW9')
  })

  it('容忍换行/空白的 Base64（换行包裹）', () => {
    const r = base64Decode('5L2g\n5aW9')
    expect(r.success).toBe(true)
    expect(r.result).toBe('你好')
  })

  it('非法 Base64 解码报错', () => {
    const r = base64Decode('@@@not-base64@@@')
    expect(r.success).toBe(false)
    expect(r.error).toMatch(/非法/)
  })
})

describe('URL', () => {
  it('编码特殊字符', () => {
    const r = urlEncode('a b&c=d?')
    expect(r.success).toBe(true)
    expect(r.result).toBe('a%20b%26c%3Dd%3F')
  })

  it('解码往返', () => {
    const r = urlDecode('a%20b%26c')
    expect(r.result).toBe('a b&c')
  })

  it('非法转义序列报错', () => {
    const r = urlDecode('%')
    expect(r.success).toBe(false)
    expect(r.error).toMatch(/非法/)
  })
})

describe('JWT 解码', () => {
  // header {"alg":"HS256","typ":"JWT"} / payload {"sub":"123","iat":1516239022,"exp":1516242622}
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
    '.eyJzdWIiOiIxMjMiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjI0MjYyMn0' +
    '.abc123signature'

  it('解码标准三段式 token', () => {
    const r = decodeJWT(token)
    expect(r.success).toBe(true)
    expect(r.result.header.alg).toBe('HS256')
    expect(r.result.payload.sub).toBe('123')
    expect(r.result.signature).toBe('abc123signature')
  })

  it('exp/iat 转可读时间', () => {
    const r = decodeJWT(token)
    expect(r.result.timeFields.iat).toBeTruthy()
    expect(r.result.timeFields.exp).toBeTruthy()
  })

  it('非三段式 token 报错', () => {
    const r = decodeJWT('only.two')
    expect(r.success).toBe(false)
  })

  it('段内非法 base64/JSON 报错', () => {
    const r = decodeJWT('@@@.@@@.sig')
    expect(r.success).toBe(false)
  })
})

describe('Hash', () => {
  it('计算 MD5/SHA-1/SHA-256/SHA-512 已知向量', async () => {
    const r = await hashAll('abc')
    expect(r.success).toBe(true)
    expect(r.result.md5).toBe('900150983cd24fb0d6963f7d28e17f72')
    expect(r.result.sha1).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
    expect(r.result.sha256).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
    expect(r.result.sha512).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a' +
        '2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'
    )
  })

  it('空输入返回各算法摘要', async () => {
    const r = await hashAll('')
    expect(r.success).toBe(true)
    expect(r.result.md5).toBe('d41d8cd98f00b204e9800998ecf8427e')
  })
})

describe('进制转换', () => {
  it('十进制联动到其他三进制', () => {
    const r = convertBase('255', 'dec')
    expect(r.result).toEqual({ dec: '255', hex: 'ff', oct: '377', bin: '11111111' })
  })

  it('大整数不失真（超过 2^53）', () => {
    const r = convertBase('ffffffffffffffff', 'hex')
    expect(r.success).toBe(true)
    expect(r.result.dec).toBe('18446744073709551615')
  })

  it('Hex 框非法字符报错', () => {
    const r = convertBase('G', 'hex')
    expect(r.success).toBe(false)
    expect(r.error).toMatch(/不允许的字符/)
  })

  it('空输入返回空字段', () => {
    const r = convertBase('', 'dec')
    expect(r.result).toEqual({ dec: '', hex: '', oct: '', bin: '' })
  })
})

describe('Unicode 转义', () => {
  it('\\u{} 格式正确转义 emoji（不拆代理对）', () => {
    const r = unicodeEscape('😀', 'u-brace')
    expect(r.result).toBe('\\u{1f600}')
  })

  it('\\u 格式将 emoji 输出为代理对', () => {
    const r = unicodeEscape('😀', 'u')
    expect(r.result).toBe('\\ud83d\\ude00')
  })

  it('HTML 实体格式', () => {
    const r = unicodeEscape('你', 'html')
    expect(r.result).toBe('&#x4f60;')
  })

  it('ASCII 原样保留', () => {
    const r = unicodeEscape('A你B', 'u-brace')
    expect(r.result).toBe('A\\u{4f60}B')
  })

  it('各格式反转义往返', () => {
    expect(unicodeUnescape('\\u{1f600}').result).toBe('😀')
    expect(unicodeUnescape('\\ud83d\\ude00').result).toBe('😀')
    expect(unicodeUnescape('&#x4f60;').result).toBe('你')
    expect(unicodeUnescape('&#20320;').result).toBe('你')
  })
})
