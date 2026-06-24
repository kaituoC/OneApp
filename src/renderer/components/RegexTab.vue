<template>
  <div class="regex-tab">
    <!-- ① pattern 行 -->
    <div class="pattern-bar">
      <span class="label">正则</span>
      <span class="slash">/</span>
      <input
        ref="patternInputRef"
        v-model="pattern"
        class="pattern-input"
        spellcheck="false"
        placeholder="输入正则表达式…"
      />
      <span class="slash">/</span>
      <div class="flags">
        <button
          v-for="f in FLAGS"
          :key="f"
          :class="['flag', { on: flagState[f] }]"
          :title="FLAG_TITLES[f]"
          @click="flagState[f] = !flagState[f]"
        >{{ f }}</button>
      </div>
      <button class="cheat-btn" @click="showCheatsheet = !showCheatsheet">
        <BookOpen :size="15" aria-hidden="true" />
        速查
      </button>
    </div>
    <!-- ② 错误位 -->
    <div v-if="error" class="pattern-error">
      <CircleAlert :size="14" aria-hidden="true" />
      {{ error }}
    </div>

    <!-- ③ 左右双区 + 速查抽屉 -->
    <div class="content tool-workspace">
      <div class="editor-pane tool-panel">
        <div class="pane-header tool-panel-header">
          <span>测试文本</span>
          <span :class="['char-count', { warn: nearLimit, over: overLimit }]">
            {{ text.length.toLocaleString() }} / {{ MAX_TEXT_LEN.toLocaleString() }}
          </span>
        </div>
        <EditorWithLineNumbers
          v-model="text"
          :font-size="fontSize"
          placeholder="在此粘贴待测文本…"
        />
      </div>

      <div class="preview-pane tool-panel">
        <div class="pane-header tool-panel-header">匹配高亮</div>
        <pre class="preview" :style="{ fontSize: fontSize + 'px' }"><span
          v-for="(seg, i) in segments"
          :key="i"
          :class="['seg', seg.type, { active: seg.matchIndex === activeMatch }]"
          :style="seg.type === 'group' ? { color: seg.color, borderBottomColor: seg.color } : null"
          @mouseenter="seg.matchIndex != null && (activeMatch = seg.matchIndex)"
          @mouseleave="activeMatch = null"
        >{{ seg.text }}</span></pre>
      </div>

      <aside v-if="showCheatsheet" class="cheatsheet">
        <div class="cheat-section">
          <div class="cheat-title">常用模式</div>
          <button
            v-for="p in COMMON_PATTERNS"
            :key="p.label"
            class="cheat-item"
            :title="p.pattern"
            @click="pattern = p.pattern"
          >{{ p.label }}</button>
        </div>
        <div class="cheat-section">
          <div class="cheat-title">语法元字符</div>
          <button
            v-for="t in SYNTAX_TOKENS"
            :key="t.token"
            class="cheat-item token"
            :title="t.desc"
            @click="insertToken(t.token)"
          ><code>{{ t.token }}</code> {{ t.desc }}</button>
        </div>
        <div class="cheat-section">
          <div class="cheat-title">Flags 说明</div>
          <div v-for="f in FLAGS" :key="f" class="cheat-flag">
            <code>{{ f }}</code> {{ FLAG_TITLES[f] }}
          </div>
        </div>
      </aside>
    </div>

    <!-- ④ 结果列表 -->
    <div class="result-list">
      <div class="result-header">
        <span v-if="matching">匹配中…</span>
        <span v-else>匹配 {{ count }} 处<span v-if="renderTruncated">（仅显示前 {{ RENDER_LIMIT }} 条）</span></span>
        <button v-if="count" class="copy-btn" @click="copyAll">
          <Copy :size="13" aria-hidden="true" />
          复制全部
        </button>
      </div>
      <div class="result-rows">
        <div
          v-for="(m, i) in renderedMatches"
          :key="i"
          :class="['result-row', { active: i === activeMatch }]"
          @mouseenter="activeMatch = i"
          @mouseleave="activeMatch = null"
        >
          <span class="ri">#{{ i + 1 }}</span>
          <span class="rpos">{{ m.index }}–{{ m.end }}</span>
          <span class="rmatch">{{ m.match }}</span>
          <span
            v-for="(g, gi) in m.groups"
            :key="gi"
            class="rgroup"
            :style="{ color: colorFor(gi) }"
          >{{ g.name || ('组' + (gi + 1)) }}={{ g.value === null ? '∅' : g.value }}</span>
        </div>
      </div>
    </div>
    <div v-if="copyMessage" :class="['tool-copy-toast', { error: copyMessage === '复制失败' }]">{{ copyMessage }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { BookOpen, CircleAlert, Copy } from 'lucide-vue-next'
import EditorWithLineNumbers from './EditorWithLineNumbers.vue'
import { useRegexMatcher } from '../composables/useRegexMatcher.js'
import { useCopyToast } from '../composables/useCopyToast.js'

defineProps({
  fontSize: { type: Number, default: 14 }
})

const FLAGS = ['g', 'i', 'm', 's', 'u', 'y']
const FLAG_TITLES = {
  g: '全局匹配（查找所有）',
  i: '忽略大小写',
  m: '多行模式（^ $ 匹配每行）',
  s: '单行模式（. 匹配换行符）',
  u: 'Unicode 模式',
  y: '粘性匹配（从 lastIndex 起）'
}
const COMMON_PATTERNS = [
  { label: '邮箱', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.-]+' },
  { label: 'URL', pattern: 'https?://[\\w./?=&#%-]+' },
  { label: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  { label: '手机号', pattern: '1[3-9]\\d{9}' },
  { label: '日期', pattern: '\\d{4}-\\d{2}-\\d{2}' },
  { label: '十六进制色值', pattern: '#[0-9a-fA-F]{6}\\b' },
  { label: '整数', pattern: '-?\\d+' }
]
const SYNTAX_TOKENS = [
  { token: '\\d', desc: '数字' },
  { token: '\\w', desc: '单词字符' },
  { token: '\\s', desc: '空白' },
  { token: '.', desc: '任意字符' },
  { token: '*', desc: '0 次或多次' },
  { token: '+', desc: '1 次或多次' },
  { token: '?', desc: '0 或 1 次' },
  { token: '^', desc: '行首' },
  { token: '$', desc: '行尾' },
  { token: '[]', desc: '字符集' },
  { token: '()', desc: '捕获组' },
  { token: '|', desc: '或' },
  { token: '\\b', desc: '单词边界' },
  { token: '{n,m}', desc: '重复 n 到 m 次' }
]

const GROUP_COLORS = ['#e06c75', '#61afef', '#98c379', '#c678dd', '#e5c07b', '#56b6c2']
const colorFor = (i) => GROUP_COLORS[i % GROUP_COLORS.length]

const MAX_TEXT_LEN = 100000
const RENDER_LIMIT = 500   // 预览高亮 / 结果列表渲染上限

// 预填示例，打开即见效果（含多捕获组展示配色）
const pattern = ref('(\\d{3})-(\\d{4})')
const text = ref('电话 400-1234，备用 987-6543')
const flagState = reactive(Object.fromEntries(FLAGS.map(f => [f, f === 'g'])))
const flagsString = computed(() => FLAGS.filter(f => flagState[f]).join(''))

const patternInputRef = ref(null)
const showCheatsheet = ref(false)
const activeMatch = ref(null)
const { copyMessage, copyToClipboard } = useCopyToast()

const { matches, count, truncated, error, matching, match } = useRegexMatcher()

const nearLimit = computed(() => text.value.length >= MAX_TEXT_LEN * 0.9)
const overLimit = computed(() => text.value.length >= MAX_TEXT_LEN)
const renderedMatches = computed(() => matches.value.slice(0, RENDER_LIMIT))
const renderTruncated = computed(() => truncated.value || count.value > RENDER_LIMIT)

// 把文本按匹配/捕获组切分为可渲染片段
const segments = computed(() => {
  const t = text.value
  const ms = renderedMatches.value
  const segs = []
  let cursor = 0
  ms.forEach((m, mi) => {
    if (m.index < cursor) return // 跳过异常重叠
    if (m.index > cursor) segs.push({ text: t.slice(cursor, m.index), type: 'plain' })
    // 保留原始索引以确保颜色与结果列表一致；过滤零宽/null 组后按位置排序
    const groups = m.groups
      .map((g, origIdx) => ({ ...g, origIdx }))
      .filter(g => g.index !== null && g.end !== null && g.end > g.index)
      .sort((a, b) => a.index - b.index)
    let inner = m.index
    for (const g of groups) {
      if (g.index < inner) continue // 嵌套/重叠组降级为整体匹配色
      if (g.index > inner) segs.push({ text: t.slice(inner, g.index), type: 'match', matchIndex: mi })
      segs.push({ text: t.slice(g.index, g.end), type: 'group', matchIndex: mi, color: colorFor(g.origIdx) })
      inner = g.end
    }
    if (inner < m.end) segs.push({ text: t.slice(inner, m.end), type: 'match', matchIndex: mi })
    cursor = Math.max(cursor, m.end)
  })
  if (cursor < t.length) segs.push({ text: t.slice(cursor), type: 'plain' })
  return segs
})

// 在 pattern 输入框光标处插入语法片段
function insertToken(token) {
  const el = patternInputRef.value
  if (!el) { pattern.value += token; return }
  const start = el.selectionStart ?? pattern.value.length
  const end = el.selectionEnd ?? pattern.value.length
  pattern.value = pattern.value.slice(0, start) + token + pattern.value.slice(end)
  // 光标移到插入内容之后
  requestAnimationFrame(() => {
    el.focus()
    const pos = start + token.length
    el.setSelectionRange(pos, pos)
  })
}

async function copyAll() {
  const ms = matches.value
  const lines = new Array(ms.length)
  for (let i = 0; i < ms.length; i++) {
    const m = ms[i]
    let line = `#${i + 1} [${m.index}-${m.end}] ${m.match}`
    if (m.groups.length) {
      let gs = '  '
      for (let gi = 0; gi < m.groups.length; gi++) {
        const g = m.groups[gi]
        if (gi > 0) gs += ' '
        gs += `${g.name || '组' + (gi + 1)}=${g.value === null ? '' : g.value}`
      }
      line += gs
    }
    lines[i] = line
  }
  await copyToClipboard(lines.join('\n'))
}

// 实时匹配：debounce 250ms
let debounceTimer = null
function schedule() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    match(pattern.value, flagsString.value, text.value)
  }, 250)
}
watch([pattern, flagsString, text], schedule, { immediate: true })
onUnmounted(() => clearTimeout(debounceTimer))
</script>

<style scoped>
.regex-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}
.pattern-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
}
.label {
  font-size: 13px;
  color: var(--text-secondary);
}
.slash {
  color: var(--text-secondary);
  font-family: monospace;
  font-size: 16px;
}
.pattern-input {
  flex: 1;
  min-width: 220px;
  font-family: monospace;
  font-size: 14px;
  padding: 6px 10px;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}
.flags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.flag {
  width: 28px;
  height: 28px;
  font-family: monospace;
  border: 1px solid var(--border-color);
  background: var(--surface-subtle);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 0;
}
.flag.on {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.cheat-btn {
  padding: 5px 10px;
}
.pattern-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--error);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}
.content {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: 12px;
  padding: 12px;
  min-height: 0;
}
.editor-pane, .preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.preview-pane {
  border-left: 1px solid var(--border-color);
}
.char-count { font-family: monospace; }
.char-count.warn { color: var(--accent); }
.char-count.over { color: var(--error); font-weight: bold; }
.preview {
  flex: 1;
  margin: 0;
  padding: 8px 12px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  line-height: 1.5;
  color: var(--text-primary);
}
.seg.match {
  background: rgba(229, 192, 123, 0.3);
  border-radius: 2px;
}
.seg.group {
  background: rgba(229, 192, 123, 0.15);
  border-bottom: 2px solid;
  border-radius: 2px;
}
.seg.match.active, .seg.group.active {
  background: rgba(229, 192, 123, 0.6);
  outline: 1px solid var(--accent);
}
.cheatsheet {
  width: 240px;
  overflow-y: auto;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 10px;
}
.cheat-section { margin-bottom: 16px; }
.cheat-title {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: 6px;
}
.cheat-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 5px 8px;
  margin-bottom: 2px;
  font-size: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  cursor: pointer;
}
.cheat-item:hover { background: var(--bg-tertiary); }
.cheat-item.token code { color: var(--accent); margin-right: 6px; }
.cheat-flag {
  font-size: 12px;
  padding: 3px 0;
  color: var(--text-secondary);
}
.cheat-flag code {
  color: var(--accent);
  margin-right: 8px;
}
.result-list {
  height: 30%;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-raised);
  font-weight: 700;
}
.result-rows {
  flex: 1;
  overflow-y: auto;
}
.result-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px;
  font-family: monospace;
  font-size: 12px;
  border-bottom: 1px solid var(--border-subtle);
}
.result-row.active { background: var(--accent-soft); }
.ri { color: var(--text-secondary); }
.rpos { color: var(--text-secondary); min-width: 60px; }
.rmatch { color: var(--text-primary); font-weight: bold; }
.rgroup { font-size: 11px; }

@media (max-width: 1040px) {
  .cheatsheet {
    position: absolute;
    z-index: 20;
    top: 58px;
    right: 12px;
    bottom: 32%;
    width: min(320px, calc(100% - 24px));
    box-shadow: var(--shadow-soft);
  }
}

@media (max-width: 820px) {
  .content {
    flex-direction: column;
    overflow: auto;
  }

  .editor-pane,
  .preview-pane {
    flex: 0 0 260px;
  }

  .result-list {
    min-height: 180px;
  }
}
</style>
