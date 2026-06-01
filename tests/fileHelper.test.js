import { describe, it, expect } from 'vitest'
import { isHiddenEntry, filterTreeItems } from '../src/renderer/utils/fileHelper.js'

const dir = (name) => ({ name, path: `/root/${name}`, isDirectory: true })
const file = (name) => ({ name, path: `/root/${name}`, isDirectory: false })

describe('fileHelper - isHiddenEntry', () => {
  it('treats dotfiles as hidden', () => {
    expect(isHiddenEntry(file('.gitignore'))).toBe(true)
    expect(isHiddenEntry(dir('.git'))).toBe(true)
  })

  it('treats node_modules directory as hidden', () => {
    expect(isHiddenEntry(dir('node_modules'))).toBe(true)
  })

  it('does not hide a file literally named node_modules', () => {
    expect(isHiddenEntry(file('node_modules'))).toBe(false)
  })

  it('does not hide normal entries', () => {
    expect(isHiddenEntry(dir('src'))).toBe(false)
    expect(isHiddenEntry(file('readme.md'))).toBe(false)
  })

  it('handles missing/invalid input gracefully', () => {
    expect(isHiddenEntry(null)).toBe(false)
    expect(isHiddenEntry({})).toBe(false)
  })
})

describe('fileHelper - filterTreeItems', () => {
  const items = [
    dir('docs'),
    dir('.git'),
    dir('node_modules'),
    file('intro.md'),
    file('logo.png'),
    file('.env'),
    file('page.html')
  ]

  it('keeps folders and only editable-type files (md)', () => {
    const result = filterTreeItems(items, { editableExtensions: ['md'] })
    const names = result.map(i => i.name)
    expect(names).toEqual(['docs', 'intro.md'])
  })

  it('keeps folders and only editable-type files (html/htm)', () => {
    const result = filterTreeItems(items, { editableExtensions: ['html', 'htm'] })
    const names = result.map(i => i.name)
    expect(names).toEqual(['docs', 'page.html'])
  })

  it('reveals hidden items when showHidden is true', () => {
    const result = filterTreeItems(items, { editableExtensions: ['md'], showHidden: true })
    const names = result.map(i => i.name)
    expect(names).toEqual(['docs', '.git', 'node_modules', 'intro.md'])
  })

  it('matches extensions case-insensitively', () => {
    const result = filterTreeItems([file('NOTES.MD')], { editableExtensions: ['md'] })
    expect(result.map(i => i.name)).toEqual(['NOTES.MD'])
  })

  it('returns empty array for non-array input', () => {
    expect(filterTreeItems(null, { editableExtensions: ['md'] })).toEqual([])
  })
})
