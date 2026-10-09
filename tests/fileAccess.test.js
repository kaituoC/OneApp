import {afterEach,describe,it,expect} from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {createFileAccess} from '../electron/fileAccess.js'
const dirs=[]
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'oneapp-grant-'));dirs.push(root);fs.mkdirSync(path.join(root,'work'));fs.mkdirSync(path.join(root,'work-other'));fs.writeFileSync(path.join(root,'work','a.md'),'A');fs.writeFileSync(path.join(root,'work-other','secret.md'),'S');return root}
afterEach(()=>dirs.splice(0).forEach(root=>fs.rmSync(root,{recursive:true,force:true})))
describe('文件授权集合',()=>{
 it('未选择文件不得读写，选择单文件不授权其兄弟文件',()=>{
  const root=fixture(),access=createFileAccess(),file=path.join(root,'work','a.md')
  expect(()=>access.requireAccess(file)).toThrow('未授权')
  access.grantFile(file);expect(access.requireAccess(file)).toBe(fs.realpathSync(file));expect(access.canAccess(path.join(root,'work-other','secret.md'))).toBe(false)
 })
 it('目录边界不用字符串前缀，并拒绝符号链接越界',()=>{
  const root=fixture(),access=createFileAccess();access.grantDirectory(path.join(root,'work'))
  expect(access.canAccess(path.join(root,'work','a.md'))).toBe(true)
  expect(access.canAccess(path.join(root,'work-other','secret.md'))).toBe(false)
  fs.symlinkSync(path.join(root,'work-other'),path.join(root,'work','escape'))
  expect(access.canAccess(path.join(root,'work','escape','secret.md'))).toBe(false)
 })
 it('新保存目标只授权真实父目录中的那个文件',()=>{
  const root=fixture(),access=createFileAccess(),target=path.join(root,'work','new.md')
  access.grantFile(target,true);expect(access.requireAccess(target,{write:true})).toBe(target.replace('/var/','/private/var/'))
  expect(access.canAccess(path.join(root,'work','other.md'),{write:true})).toBe(false)
  expect(()=>access.grantFile(path.join(root,'missing','new.md'),true)).toThrow()
 })
 it('授权后路径被替换成越界链接时重新拒绝',()=>{
  const root=fixture(),access=createFileAccess(),target=path.join(root,'work','a.md')
  access.grantFile(target);fs.unlinkSync(target);fs.symlinkSync(path.join(root,'work-other','secret.md'),target)
  expect(access.canAccess(target)).toBe(false)
 })
 it('选择同一文件的路径别名返回相同身份，保护另存草稿冲突',()=>{
  const root=fixture(),access=createFileAccess(),work=path.join(root,'work'),alias=path.join(root,'alias')
  fs.symlinkSync(work,alias)
  expect(access.grantDirectory(alias)).toBe(fs.realpathSync(work))
  expect(access.grantFile(path.join(alias,'a.md'),true)).toBe(access.grantFile(path.join(work,'a.md')))
  expect(access.grantFile(path.join(alias,'new.md'),true)).toBe(path.join(fs.realpathSync(work),'new.md'))
 })
})
