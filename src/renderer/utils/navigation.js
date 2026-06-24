import {
  Bot,
  Braces,
  Clock3,
  Code2,
  FileText,
  GitCompareArrows,
  Regex,
  Settings,
  SquareCode
} from 'lucide-vue-next'

export const NAV_GROUPS = [
  {
    key: 'workspace',
    label: '工作区',
    items: [
      {
        key: 'editor',
        label: '编辑器',
        shortLabel: '编辑',
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
        label: 'JSON 工具',
        shortLabel: 'JSON',
        description: '格式化、压缩、校验',
        summary: '格式化 / 校验',
        shortcut: 2,
        icon: Braces
      },
      {
        key: 'time',
        label: '时间工具',
        shortLabel: '时间',
        description: '日期与时间戳转换',
        summary: '日期 / Timestamp',
        shortcut: 4,
        icon: Clock3
      },
      {
        key: 'encode',
        label: '编码',
        shortLabel: '编码',
        description: 'Base64 / URL / JWT / Hash',
        summary: 'Base64 / JWT',
        shortcut: 6,
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
        shortLabel: '对比',
        description: '并排与统一差异视图',
        summary: 'Split / Diff',
        shortcut: 3,
        icon: GitCompareArrows
      },
      {
        key: 'regex',
        label: '正则',
        shortLabel: '正则',
        description: '实时匹配与捕获组检查',
        summary: '匹配 / 捕获组',
        shortcut: 5,
        icon: Regex
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
        shortLabel: 'Agent',
        description: '本地 AI 只读研讨工作流',
        summary: '本地 AI workflow',
        shortcut: 7,
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
        shortLabel: '设置',
        description: '偏好、最近文件与快捷键',
        summary: '偏好 / 快捷键',
        shortcut: 8,
        icon: Settings
      }
    ]
  }
]

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.key, groupLabel: group.label }))
)

export const TAB_KEYS = NAV_ITEMS
  .slice()
  .sort((a, b) => a.shortcut - b.shortcut)
  .map((item) => item.key)

export const TAB_BY_KEY = Object.fromEntries(NAV_ITEMS.map((item) => [item.key, item]))

export const WORKBENCH_ICON = Code2

export function getNavigationTooltip(item, modifier = 'Ctrl') {
  if (!item) return ''
  return `${item.label}\n${item.description}\n${modifier}+${item.shortcut}`
}
