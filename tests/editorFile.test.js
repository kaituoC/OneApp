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

it('匿名新建取消与打开失败均保留输入', async()=>{
 const confirm=vi.fn().mockResolvedValue({response:2}),editor=useEditorFile({confirm})
 editor.editorContent.value='匿名草稿';expect(await editor.newFile()).toBe(false)
 expect(editor.editorContent.value).toBe('匿名草稿');expect(editor.dirty.value).toBe(true)
 readFile.mockRejectedValueOnce(new Error('EACCES'));expect(await editor.openFromTree('/fail.md')).toBe(false)
 expect(editor.editorContent.value).toBe('匿名草稿')
})
it('重复保存及保存中点击当前文件不会留下错误 dirty',async()=>{
 readFile.mockResolvedValueOnce('A');const editor=useEditorFile();await editor.openFromTree('/a.md');editor.editorContent.value='B'
 let finish;writeFile.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}))
 const first=editor.saveFile(),second=editor.saveFile();expect(first).toBe(second)
 await editor.openFromTree('/a.md');finish();expect(await first).toBe(true);expect(editor.dirty.value).toBe(false)
})
it('保存中打开失败仍更新当前保存快照',async()=>{
 const editor=useEditorFile();readFile.mockResolvedValueOnce('A');await editor.openFromTree('/a.md');editor.editorContent.value='B'
 let finish;writeFile.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}))
 const saving=editor.saveFile();readFile.mockRejectedValueOnce(new Error('not found'));await editor.openFromTree('/missing.md');finish();await saving;expect(editor.dirty.value).toBe(false)
})
it('匿名 guard 保存到待打开路径不应用旧读取',async()=>{
 const editor=useEditorFile({confirm:async()=>({response:0})});editor.editorContent.value='新草稿'
 readFile.mockResolvedValueOnce('旧磁盘');dialogSaveFile.mockResolvedValueOnce('/target.md')
 expect(await editor.openFromTree('/target.md')).toBe(true);expect(editor.editorContent.value).toBe('新草稿');expect(editor.dirty.value).toBe(false)
})
it('首次保存失败/取消不改变身份且 guard 不替换',async()=>{
 const confirm=vi.fn().mockResolvedValue({response:0}),editor=useEditorFile({confirm});editor.editorContent.value='草稿'
 dialogSaveFile.mockRejectedValueOnce(new Error('EACCES'));expect(await editor.saveFile()).toBe(false);expect(editor.currentFilePath.value).toBe('');expect(editor.dirty.value).toBe(true)
 dialogSaveFile.mockResolvedValueOnce(null);expect(await editor.newFile()).toBe(false);expect(editor.editorContent.value).toBe('草稿')
})
it('批量关闭检查缓存稿，失败稿保留；不保存许可仅作用于相同快照',async()=>{
 const confirm=vi.fn().mockResolvedValue({response:0}),editor=useEditorFile({confirm})
 readFile.mockResolvedValueOnce('A').mockResolvedValueOnce('B');await editor.openFromTree('/a.md');editor.editorContent.value='A+';await editor.openFromTree('/b.md');editor.editorContent.value='B+'
 expect(editor.dirtyFiles.value).toHaveLength(2)
 writeFile.mockResolvedValueOnce().mockRejectedValueOnce(new Error('EACCES'));expect(await editor.prepareClose(1)).toBe(false)
 expect(editor.dirtyFiles.value.map(d=>d.path)).toEqual(['/b.md'])
 confirm.mockResolvedValue({response:1});expect(await editor.prepareClose(2)).toBe(true);const calls=confirm.mock.calls.length
 expect(await editor.prepareClose(2)).toBe(true);expect(confirm).toHaveBeenCalledTimes(calls)
 editor.editorContent.value='B++';expect(await editor.prepareClose(2)).toBe(true);expect(confirm).toHaveBeenCalledTimes(calls+1)
})
it('另存为缓存 dirty 目标在写入前拒绝',async()=>{
 const confirm=vi.fn().mockResolvedValue({response:0}),editor=useEditorFile({confirm})
 readFile.mockResolvedValueOnce('A').mockResolvedValueOnce('B');await editor.openFromTree('/a.md');editor.editorContent.value='A+';await editor.openFromTree('/b.md')
 dialogSaveFile.mockImplementationOnce(async(_content,_name,_type,_directory,beforeWrite)=>{expect(await beforeWrite('/a.md')).toBe(false);return null})
 expect(await editor.saveFile({as:true})).toBe(false);expect(editor.currentFilePath.value).toBe('/b.md');expect(editor.dirtyFiles.value[0].content).toBe('A+')
})
