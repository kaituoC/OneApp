import {
  Bot,
  Braces,
  Clock3,
  Code2,
  FileText,
  GitCompareArrows,
  Pilcrow,
  Regex,
  Settings,
  SquareCode,
  WandSparkles
} from 'lucide-vue-next'

export const NAV_GROUPS = [
  {
    key: 'workspace',
    label: '工作区',
    items: [
      {
        key: 'editor',
        label: '编辑器',
        description: 'Markdown / HTML / 纯文本',
        summary: 'MD / HTML / 文本',
        shortcut: 1,
        icon: FileText
      }
    ]
  },
  {
    key: 'transform',
    label: '数据处理',
    items: [
      {
        key: 'json',
        label: '数据工具',
        description: 'JSON / CSV / SQL / XML',
        summary: 'JSON / SQL',
        shortcut: 2,
        icon: Braces
      },
      {
        key: 'time',
        label: '时间工具',
        description: '日期与时间戳转换',
        summary: '日期 / Timestamp',
        shortcut: 5,
        icon: Clock3
      },
      {
        key: 'encode',
        label: '编码',
        description: 'Base64 / URL / JWT / Hash',
        summary: 'Base64 / JWT',
        shortcut: 7,
        icon: SquareCode
      }
    ]
  },
  {
    key: 'inspect',
    label: '文本调试',
    items: [
      {
        key: 'diff',
        label: '文本对比',
        description: '并排与统一差异视图',
        summary: 'Split / Diff',
        shortcut: 3,
        icon: GitCompareArrows
      },
      {
        key: 'text',
        label: '文本处理',
        description: '统计、转换、排序、去重',
        summary: '统计 / 去重',
        shortcut: 4,
        icon: Pilcrow
      },
      {
        key: 'regex',
        label: '正则',
        description: '实时匹配与捕获组检查',
        summary: '匹配 / 捕获组',
        shortcut: 6,
        icon: Regex
      }
    ]
  },
  {
    key: 'generate',
    label: '生成工具',
    items: [
      {
        key: 'generator',
        label: '生成器',
        description: 'UUID / 密码 / Lorem',
        summary: 'UUID / 密码',
        shortcut: 0,
        icon: WandSparkles
      }
    ]
  },
  {
    key: 'ai',
    label: 'AI',
    items: [
      {
        key: 'agent',
        label: 'Agent 研讨室',
        description: '本地 AI 只读研讨工作流',
        summary: '本地 AI workflow',
        shortcut: 8,
        icon: Bot,
        featured: true
      }
    ]
  },
  {
    key: 'system',
    label: '系统',
    items: [
      {
        key: 'settings',
        label: '设置',
        description: '偏好、最近文件与快捷键',
        summary: '偏好 / 快捷键',
        shortcut: 9,
        icon: Settings
      }
    ]
  }
]

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items)

export function getShortcutSortValue(shortcut) {
  return shortcut === 0 ? 10 : shortcut
}

export const TAB_KEYS = NAV_ITEMS
  .slice()
  .sort((a, b) => getShortcutSortValue(a.shortcut) - getShortcutSortValue(b.shortcut))
  .map((item) => item.key)

export const TAB_BY_KEY = Object.fromEntries(NAV_ITEMS.map((item) => [item.key, item]))

export const WORKBENCH_ICON = Code2

// 平台修饰键：进程级常量，单一来源，供各组件复用（带 guard 以便在 node 测试环境安全 import）
export const IS_MAC = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform || '')

export const SHORTCUT_MODIFIER = IS_MAC ? 'Cmd' : 'Ctrl'

export function formatShortcut(item, modifier = SHORTCUT_MODIFIER) {
  if (!item) return ''
  return `${modifier}+${item.shortcut}`
}

export function getNavigationTooltip(item, modifier = SHORTCUT_MODIFIER) {
  if (!item) return ''
  return `${item.label}\n${item.description}\n${formatShortcut(item, modifier)}`
}
