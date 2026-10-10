// 只写剪贴板：不接受路径/URL 图片，不提供读取能力。
export const MAX_CLIPBOARD_TEXT_BYTES = 32 * 1024 * 1024
export const MAX_CLIPBOARD_PNG_BYTES = 2 * 1024 * 1024
export const MAX_CLIPBOARD_IMAGE_SIZE = 1024
const PNG_PREFIX = 'data:image/png;base64,'
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

function decodePng(value) {
  if (typeof value !== 'string' || !value.startsWith(PNG_PREFIX) || value.length > PNG_PREFIX.length + Math.ceil(MAX_CLIPBOARD_PNG_BYTES / 3) * 4) {
    throw new Error('仅支持大小不超过 2 MiB 的 PNG 图片')
  }
  const encoded = value.slice(PNG_PREFIX.length)
  if (encoded.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error('PNG 数据无效')
  const buffer = Buffer.from(encoded, 'base64')
  if (buffer.length > MAX_CLIPBOARD_PNG_BYTES || buffer.length < 33 || buffer.toString('base64') !== encoded || !buffer.subarray(0, 8).equals(PNG_SIGNATURE) || buffer.readUInt32BE(8) !== 13 || buffer.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('PNG 数据无效')
  }
  const width = buffer.readUInt32BE(16), height = buffer.readUInt32BE(20)
  if (!validSize({ width, height })) throw new Error('PNG 尺寸必须在 1–1024 像素之间')
  return buffer
}

function validSize({ width, height }) {
  return Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0 && width <= MAX_CLIPBOARD_IMAGE_SIZE && height <= MAX_CLIPBOARD_IMAGE_SIZE
}

export function createClipboardWriter({ clipboard, nativeImage }) {
  const result = operation => {
    try { operation(); return { success: true } }
    catch (error) { return { success: false, error: error?.message || '剪贴板写入失败' } }
  }
  return {
    writeText: text => result(() => {
      if (typeof text !== 'string' || text.length > MAX_CLIPBOARD_TEXT_BYTES || Buffer.byteLength(text, 'utf8') > MAX_CLIPBOARD_TEXT_BYTES) throw new Error('复制文本无效或超过 32 MiB')
      clipboard.writeText(text)
    }),
    writePng: dataUrl => result(() => {
      const image = nativeImage.createFromBuffer(decodePng(dataUrl))
      if (image.isEmpty() || !validSize(image.getSize())) throw new Error('PNG 图片无法解码或尺寸无效')
      clipboard.writeImage(image)
    })
  }
}
