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
        description: 'JSONPath / CSV / SQL / XML',
        summary: 'JSONPath / SQL',
        shortcut: 2,
        icon: Braces
      },
      {
        key: 'time',
        label: '时间工具',
        description: '日期、Cron 与多时区',
        summary: 'Cron / 时区',
        shortcut: 3,
        icon: Clock3
      },
      {
        key: 'encode',
        label: '编码',
        description: 'Base64 / URL / JWT / Hash',
        summary: 'Base64 / JWT',
        shortcut: 4,
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
        shortcut: 5,
        icon: GitCompareArrows
      },
      {
        key: 'text',
        label: '文本处理',
        description: '统计、转换、排序、去重',
        summary: '统计 / 去重',
        shortcut: 6,
        icon: Pilcrow
      },
      {
        key: 'regex',
        label: '正则',
        description: '实时匹配与捕获组检查',
        summary: '匹配 / 捕获组',
        shortcut: 7,
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
        description: 'UUID / 密码 / Lorem / 二维码',
        summary: 'UUID / QR',
        shortcut: 8,
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
        shortcut: 9,
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
        shortcut: 0,
        icon: Settings
      }
    ]
  }
]

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items)

// 子工具导航：由左侧 contextual-nav 承载的第二级入口，页面内不再重复渲染
export const SUB_TOOLS = {
  json: [
    { key: 'json', label: 'JSON' },
    { key: 'yaml', label: 'YAML' },
    { key: 'csv', label: 'CSV' },
    { key: 'sql', label: 'SQL' },
    { key: 'xml', label: 'XML' }
  ],
  time: [
    { key: 'current', label: '当前时间' },
    { key: 'convert', label: '时间转换' },
    { key: 'cron', label: 'Cron' },
    { key: 'timezone', label: '多时区' }
  ],
  encode: [
    { key: 'base64', label: 'Base64' },
    { key: 'url', label: 'URL' },
    { key: 'jwt', label: 'JWT' },
    { key: 'hash', label: 'Hash' },
    { key: 'base', label: '进制' },
    { key: 'unicode', label: 'Unicode' }
  ],
  text: [
    { key: 'stats', label: '统计' },
    { key: 'case', label: '大小写' },
    { key: 'sort', label: '排序' },
    { key: 'dedupe', label: '去重' }
  ],
  generator: [
    { key: 'uuid', label: 'UUID' },
    { key: 'password', label: '随机密码' },
    { key: 'lorem', label: 'Lorem' },
    { key: 'qr', label: '二维码' }
  ]
}

export const DEFAULT_SUB_TOOL = Object.fromEntries(
  Object.entries(SUB_TOOLS).map(([tabKey, subs]) => [tabKey, subs[0].key])
)

export function getShortcutSortValue(shortcut) {
  return shortcut === 0 ? 10 : shortcut
}

export const TAB_KEYS = NAV_ITEMS
  .slice()
  .sort((a, b) => getShortcutSortValue(a.shortcut) - getShortcutSortValue(b.shortcut))
  .map((item) => item.key)

export const TAB_BY_KEY = Object.fromEntries(NAV_ITEMS.map((item) => [item.key, item]))

export const WORKBENCH_ICON = Code2

export const GROUP_BY_KEY = Object.fromEntries(
  NAV_GROUPS.map((group) => [group.key, group.items])
)

export const TAB_TO_GROUP_KEY = Object.fromEntries(
  NAV_GROUPS.flatMap((group) => group.items.map((item) => [item.key, group.key]))
)

export function getFirstTabInGroup(groupKey) {
  return GROUP_BY_KEY[groupKey]?.[0]?.key || 'editor'
}

// 平台修饰键：进程级常量，单一来源，供各组件复用（带 guard 以便在 node 测试环境安全 import）
export const IS_MAC = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform || '')

export const SHORTCUT_MODIFIER = IS_MAC ? 'Cmd' : 'Ctrl'

export const CYCLE_SHORTCUTS = Object.freeze({
  next: 'Ctrl+Tab',
  previous: 'Ctrl+Shift+Tab'
})

export function formatShortcut(item, modifier = SHORTCUT_MODIFIER) {
  if (!item) return ''
  return `${modifier}+${item.shortcut}`
}

export function getNavigationTooltip(item, modifier = SHORTCUT_MODIFIER) {
  if (!item) return ''
  return `${item.label}\n${item.description}\n${formatShortcut(item, modifier)}`
}

export function isNumericNavigationEvent(event, isMac = IS_MAC) {
  const numericKey = /^(?:[1-9]|0)$/.test(event?.key || '')
  if (!numericKey || event?.altKey || event?.shiftKey) return false
  return isMac
    ? Boolean(event?.metaKey && !event?.ctrlKey)
    : Boolean(event?.ctrlKey && !event?.metaKey)
}

export function isCycleNavigationEvent(event) {
  return Boolean(
    event?.ctrlKey &&
    !event?.metaKey &&
    !event?.altKey &&
    event?.key === 'Tab'
  )
}
