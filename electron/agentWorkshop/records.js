// 研讨记录的本地 JSON 持久化，存于 app userData 下。
// 支持创建/增量保存/读取最近一条；读失败容错返回 null，绝不抛出阻断主流程。
import fs from 'fs'
import path from 'path'

export function createRecordStore(baseDir) {
  const dir = path.join(baseDir, 'agent-workshop-records')
  const lastPtr = path.join(dir, 'last.json')
  const ensure = () => { try { fs.mkdirSync(dir, { recursive: true }) } catch { /* noop */ } }

  return {
    dir,

    /** 全量写入（增量保存即重复调用，覆盖同一文件） */
    save(record) {
      ensure()
      try {
        fs.writeFileSync(path.join(dir, `${record.id}.json`), JSON.stringify(record, null, 2), 'utf-8')
        fs.writeFileSync(lastPtr, JSON.stringify({ id: record.id }), 'utf-8')
        return { success: true }
      } catch (e) {
        return { success: false, error: e.message }
      }
    },

    /** 读取最近一条记录，损坏/缺失返回 null */
    loadLatest() {
      try {
        const { id } = JSON.parse(fs.readFileSync(lastPtr, 'utf-8'))
        return JSON.parse(fs.readFileSync(path.join(dir, `${id}.json`), 'utf-8'))
      } catch {
        return null
      }
    }
  }
}
