import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

vi.mock('../src/renderer/utils/fileHelper.js', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  saveFile: vi.fn(),
  openFile: vi.fn()
}))

const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

const { readFile, openFile } = await import('../src/renderer/utils/fileHelper.js')
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

afterAll(() => {
  consoleError.mockRestore()
})
