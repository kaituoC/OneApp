// @vitest-environment jsdom
import {it,expect,vi} from 'vitest'
import {handlePreviewLink} from '../src/renderer/utils/previewLinks.js'

it('HTTPS 外链交 main，相对路径和非 HTTPS 明确提示，不触发导航',async()=>{
 const openExternal=vi.fn(),showMessageBox=vi.fn();window.electronAPI={openExternal,showMessageBox}
 for(const href of ['other.md','file:///tmp/private','https://example.com/docs']){
  const link=document.createElement('a');link.setAttribute('href',href);const event={target:link,preventDefault:vi.fn()}
  await handlePreviewLink(event,document);expect(event.preventDefault).toHaveBeenCalledOnce()
 }
 expect(openExternal).toHaveBeenCalledExactlyOnceWith('https://example.com/docs')
 expect(showMessageBox.mock.calls[0][0].detail).toContain('相对文件链接暂不支持')
 expect(showMessageBox.mock.calls[1][0].detail).toContain('仅支持 HTTPS')
})
