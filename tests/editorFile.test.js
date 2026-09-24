import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

vi.mock('../src/renderer/utils/fileHelper.js', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  saveFile: vi.fn(),
  openFile: vi.fn()
}))

const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

const { readFile, openFile, writeFile, saveFile: dialogSaveFile } = await import('../src/renderer/utils/fileHelper.js')
const { useEditorFile } = await import('../src/renderer/composables/useEditorFile.js')

describe('useEditorFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false when file dialog is canceled', async () => {
    openFile.mockResolvedValue('')

    const editor = useEditorFile({ workDir: ref('/workspace') })
    const opened = await editor.openFileDialog()

    expect(opened).toBe(false)
    expect(readFile).not.toHaveBeenCalled()
    expect(editor.currentFilePath.value).toBe('')
  })

  it('returns false and keeps the previous file when opening fails', async () => {
    readFile.mockResolvedValueOnce('# A')
    readFile.mockRejectedValueOnce(new Error('permission denied'))
    openFile.mockResolvedValue('/workspace/b.md')

    const editor = useEditorFile({ workDir: ref('/workspace') })
    await expect(editor.openFromTree('/workspace/a.md')).resolves.toBe(true)

    const opened = await editor.openFileDialog()

    expect(opened).toBe(false)
    expect(editor.currentFilePath.value).toBe('/workspace/a.md')
    expect(editor.editorContent.value).toBe('# A')
  })
})

it('切换文件保留修改草稿，不在切换时写盘', async () => {
  readFile.mockReset().mockResolvedValueOnce('# A').mockResolvedValueOnce('# B')
  const editor = useEditorFile({ workDir: ref('/workspace') })
  await editor.openFromTree('/workspace/a.md')
  editor.editorContent.value = '# 修改 A'
  await editor.openFromTree('/workspace/b.md')
  await editor.openFromTree('/workspace/a.md')
  expect(editor.editorContent.value).toBe('# 修改 A')
  expect(readFile).toHaveBeenCalledTimes(2)
  expect(writeFile).not.toHaveBeenCalled()
})
it('迟到的文件读取不能覆盖新选择', async () => {
  let finish
  readFile.mockReset().mockImplementationOnce(() => new Promise(resolve => { finish = resolve })).mockResolvedValueOnce('B')
  const editor = useEditorFile()
  const first = editor.openFromTree('/a.md')
  await editor.openFromTree('/b.md')
  finish('A')
  await first
  expect(editor.currentFilePath.value).toBe('/b.md')
  expect(editor.editorContent.value).toBe('B')
})

afterAll(() => {
  consoleError.mockRestore()
})

it('恢复草稿后撤回修改不会再次恢复旧草稿', async () => {
 readFile.mockReset().mockImplementation(path => Promise.resolve(path === '/a.md' ? 'A' : 'B'))
 const editor = useEditorFile()
 await editor.openFromTree('/a.md')
 editor.editorContent.value = 'A 修改'
 await editor.openFromTree('/b.md')
 await editor.openFromTree('/a.md')
 editor.editorContent.value = 'A'
 await editor.openFromTree('/b.md')
 await editor.openFromTree('/a.md')
 expect(editor.editorContent.value).toBe('A')
})
it('新文件保存期间的新输入保持未保存状态', async () => {
 let finish
 dialogSaveFile.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
 const status = vi.fn()
 const editor = useEditorFile({ onSaveStatus: status })
 editor.editorContent.value = '原内容'
 const saving = editor.saveFile()
 editor.editorContent.value = '新内容'
 finish('/a.md')
 await saving
 expect(editor.editorContent.value).toBe('新内容')
 expect(status).toHaveBeenLastCalledWith('未保存')
})
