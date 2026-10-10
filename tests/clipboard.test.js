import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { createClipboardWriter, MAX_CLIPBOARD_TEXT_BYTES, MAX_CLIPBOARD_PNG_BYTES } from '../electron/clipboard.js'

const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9o0AAAAASUVORK5CYII='
let clipboard, nativeImage, image, writer
beforeEach(() => {
  clipboard = { writeText: vi.fn(), writeImage: vi.fn() }
  image = { isEmpty: () => false, getSize: () => ({ width: 1, height: 1 }) }
  nativeImage = { createFromBuffer: vi.fn(() => image) }
  writer = createClipboardWriter({ clipboard, nativeImage })
})

it('preload 仅暴露固定文本及 PNG 写入接口，无剪贴板读取及通用 invoke', async () => {
  let api
  const invoke=vi.fn().mockResolvedValue({ success:true })
  runInNewContext(readFileSync(new URL('../preload.cjs',import.meta.url),'utf8'), {
    require: () => ({contextBridge:{exposeInMainWorld:(_name,value)=>{api=value}},ipcRenderer:{invoke}})
  })
  expect(Object.keys(api.clipboard).sort()).toEqual(['writePng','writeText'])
  await api.clipboard.writeText('中文\n结果')
  await api.clipboard.writePng(png)
  expect(invoke.mock.calls).toEqual([['clipboard-write-text','中文\n结果'],['clipboard-write-png',png]])
  expect(api.invoke).toBeUndefined()
})

describe('受控剪贴板写入', () => {
  it('保留文本原文和 Unicode，支持空字符串但不隐式转换类型', () => {
    const text = '  中文😀\n{"x":1}\n'
    expect(writer.writeText(text)).toEqual({ success: true })
    expect(clipboard.writeText).toHaveBeenCalledWith(text)
    expect(writer.writeText('')).toEqual({ success: true })
    clipboard.writeText.mockClear()
    for (const invalid of [null, undefined, 123, {}, ['x']]) expect(writer.writeText(invalid).success).toBe(false)
    expect(clipboard.writeText).not.toHaveBeenCalled()
  })

  it('按 UTF-8 字节拒绝过大的文本，不触碰剪贴板', () => {
    expect(writer.writeText('x'.repeat(MAX_CLIPBOARD_TEXT_BYTES + 1)).success).toBe(false)
    expect(writer.writeText('😀'.repeat(MAX_CLIPBOARD_TEXT_BYTES / 4 + 1)).success).toBe(false)
    expect(clipboard.writeText).not.toHaveBeenCalled()
  })

  it('只将有效的 PNG 图片交给原生剪贴板', () => {
    expect(writer.writePng(png)).toEqual({ success: true })
    expect(nativeImage.createFromBuffer).toHaveBeenCalledWith(Buffer.from(png.split(',')[1], 'base64'))
    expect(clipboard.writeImage).toHaveBeenCalledWith(image)
  })

  it('拒绝路径、远端 URL、其他 MIME、非规范 base64 及无 PNG header 的内容', () => {
    for (const invalid of [null, '/tmp/a.png', 'https://example.com/a.png', png.replace('image/png','image/jpeg'), png + '\n', 'data:image/png;base64,AAAA', png.replace('base64,','base64,!')]) {
      expect(writer.writePng(invalid).success).toBe(false)
    }
    expect(nativeImage.createFromBuffer).not.toHaveBeenCalled()
    expect(clipboard.writeImage).not.toHaveBeenCalled()
  })

  it('解码前拒绝过量数据及不合法的声明尺寸', () => {
    expect(writer.writePng('data:image/png;base64,' + Buffer.alloc(MAX_CLIPBOARD_PNG_BYTES + 1).toString('base64')).success).toBe(false)
    for (const width of [0, 1025, 0xffffffff]) {
      const buffer = Buffer.from(png.split(',')[1], 'base64')
      buffer.writeUInt32BE(width,16)
      expect(writer.writePng('data:image/png;base64,' + buffer.toString('base64')).success).toBe(false)
    }
    expect(nativeImage.createFromBuffer).not.toHaveBeenCalled()
    expect(clipboard.writeImage).not.toHaveBeenCalled()
  })

  it('拒绝无法解码和实际尺寸异常的图片', () => {
    nativeImage.createFromBuffer.mockReturnValueOnce({ isEmpty: () => true })
    expect(writer.writePng(png).success).toBe(false)
    nativeImage.createFromBuffer.mockReturnValueOnce({ isEmpty: () => false, getSize: () => ({ width: 2048, height: 1 }) })
    expect(writer.writePng(png).success).toBe(false)
    expect(clipboard.writeImage).not.toHaveBeenCalled()
  })

  it('系统写入及解码异常返回失败，不报告成功', () => {
    clipboard.writeText.mockImplementation(() => { throw new Error('unavailable') })
    expect(writer.writeText('test')).toEqual({ success: false, error: 'unavailable' })
    clipboard.writeImage.mockImplementation(() => { throw new Error('image unavailable') })
    expect(writer.writePng(png)).toEqual({ success: false, error: 'image unavailable' })
    nativeImage.createFromBuffer.mockImplementation(() => { throw new Error('corrupt image') })
    expect(writer.writePng(png)).toEqual({ success: false, error: 'corrupt image' })
  })
})
