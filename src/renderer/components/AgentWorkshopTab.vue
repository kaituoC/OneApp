<template>
  <div class="agent-workshop" :style="{ fontSize: fontSize + 'px' }">
    <!-- Windows 暂不支持：本地 CLI 检测与进程组管理尚未适配 -->
    <div v-if="!supported" class="aw-unsupported">
      <div class="aw-unsupported-card">
        <div class="aw-unsupported-title">Agent 研讨室暂不支持 Windows</div>
        <p>该功能依赖本地 Codex / ClaudeCode CLI 的检测与进程管理，目前仅在 macOS 与 Linux 上可用。</p>
      </div>
    </div>

    <!-- 左栏：配置 / 进度 -->
    <aside v-if="supported" class="aw-left">
      <section class="aw-block">
        <div class="aw-block-title">本地仓库</div>
        <div class="aw-repo">
          <code class="aw-repo-path" :title="config.repoDir">{{ config.repoDir || '未选择目录' }}</code>
          <button class="aw-btn" :disabled="running" @click="chooseRepo">选择目录</button>
        </div>
        <p v-if="repoWarning" class="aw-warn">{{ repoWarning }}</p>
      </section>

      <section class="aw-block">
        <div class="aw-block-title">
          Agent 检测
          <button class="aw-link" :disabled="detecting || running" @click="detect">
            {{ detecting ? '检测中…' : '重新检测' }}
          </button>
        </div>
        <div v-for="id in AGENT_IDS" :key="id" class="aw-agent" :class="cardState(id)">
          <label class="aw-agent-main">
            <input
              type="checkbox"
              :disabled="cardState(id) !== 'ready' || running"
              :checked="config.selectedAgents.includes(id)"
              @change="toggleAgent(id)"
            />
            <span class="aw-agent-name">{{ AGENTS[id].name }}</span>
          </label>
          <span class="aw-agent-state">{{ stateLabel(id) }}</span>
        </div>
        <p v-if="loggedOutHint" class="aw-warn">{{ loggedOutHint }}</p>
      </section>

      <section class="aw-block">
        <div class="aw-block-title">主持 Agent</div>
        <select v-model="moderatorModel" class="aw-select" :disabled="running || config.selectedAgents.length === 0">
          <option v-for="id in config.selectedAgents" :key="id" :value="id">{{ AGENTS[id].name }}</option>
        </select>
      </section>

      <section v-if="!running && !finishedRecord" class="aw-block">
        <div class="aw-estimate">预计调用 {{ callCount }} 次 agent</div>
        <button class="aw-btn aw-btn-primary" :disabled="!startValidation.ok || starting" :title="startValidation.reason || ''" @click="start">
          {{ starting ? '启动中…' : '开始研讨' }}
        </button>
        <p v-if="!startValidation.ok" class="aw-hint">{{ startValidation.reason }}</p>
      </section>

      <section v-if="running || finishedRecord" class="aw-block">
        <div class="aw-block-title">进度</div>
        <div v-for="ph in phaseList" :key="ph.key" class="aw-phase">
          <div class="aw-phase-name">{{ ph.label }}</div>
          <div class="aw-phase-agents">
            <span v-for="id in agentsForPhase(ph.key)" :key="id" class="aw-pill" :class="progress[ph.key + ':' + id] || 'pending'">
              {{ AGENTS[id].name }}
            </span>
          </div>
        </div>
        <button v-if="running" class="aw-btn" @click="stop">停止研讨</button>
        <div v-else class="aw-actions">
          <button class="aw-btn" @click="newDiscussion">新研讨</button>
          <button class="aw-btn" :disabled="!record" @click="exportMd">导出 Markdown</button>
        </div>
        <div class="aw-status">状态：{{ statusText }}</div>
      </section>
    </aside>

    <!-- 右栏：想法输入 / 时间线 -->
    <main v-if="supported" class="aw-right">
      <div v-if="record && !running" class="aw-record-banner tool-panel">
        <div>
          <div class="aw-record-title">{{ recordBanner.title }}</div>
          <div class="aw-record-copy">{{ recordBanner.copy }}</div>
        </div>
        <div class="aw-record-actions">
          <button class="aw-btn" @click="newDiscussion">新研讨</button>
          <button class="aw-btn" :disabled="!record" @click="exportMd">导出 Markdown</button>
        </div>
      </div>

      <div v-if="!running && !record" class="aw-idea">
        <div class="aw-block-title">你的想法 / 初始方案</div>
        <textarea
          v-model="idea"
          class="aw-textarea"
          placeholder="描述你想让多个 Agent 研讨的需求或初始方案……"
        ></textarea>
        <p class="aw-cost-note">提示：研讨会真实调用本地 Codex / ClaudeCode CLI，需已登录，并可能消耗对应服务用量。</p>
      </div>

      <div v-else class="aw-timeline">
        <article v-for="m in record.messages" :key="m.id" class="aw-msg" :class="m.type">
          <header class="aw-msg-head">
            <span>{{ msgLabel(m) }}</span>
            <button class="aw-link" @click="copy(m.content)">复制</button>
          </header>
          <div class="aw-msg-body" v-html="renderMd(m.content)"></div>
        </article>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { safeMarkdown } from '../utils/safeMarkdown.js'
import {
  AGENTS,
  AGENT_IDS,
  agentCardState,
  readyAgents,
  defaultSelectedAgents,
  defaultModerator,
  moderatorFallback,
  validateStart,
  estimateCallCount
} from '../utils/agentWorkshopHelper.js'

const props = defineProps({
  isActive: { type: Boolean, default: false },
  fontSize: { type: Number, default: 14 }
})

const api = window.electronAPI.agentWorkshop

// 平台门控：Windows 上本地 CLI 检测与进程组管理尚未适配，整页显示「暂不支持」
const supported = !/^win/i.test(navigator.platform || '')

const config = reactive({ repoDir: '', selectedAgents: [], moderator: null, costNoticeAccepted: false })
const availability = ref(null)
const detecting = ref(false)
const starting = ref(false) // 已发起 start、尚未进入 running 的窗口，防重复点击
const idea = ref('')
const record = ref(null)
const activeRunId = ref(null) // 仅本会话真正启动的运行；恢复的旧记录不算
const repoGitState = ref(null) // 当前所选目录的 Git 探测结果，独立于历史记录
const progress = reactive({})
const initialized = ref(false)
let unsubscribe = null

const phaseList = [
  { key: 'round1', label: '第一轮 · 独立提案' },
  { key: 'round2', label: '第二轮 · 交叉评审' },
  { key: 'final', label: '最终方案' }
]

// 仅当记录是本会话启动且仍在运行时，才视为「运行中」；恢复的 running 旧记录按已中断处理
const running = computed(() => record.value?.status === 'running' && record.value?.id === activeRunId.value)
const finishedRecord = computed(() => !!record.value && !running.value)

const cardState = (id) => agentCardState(availability.value?.[id])
const stateLabel = (id) => ({ 'not-installed': '未安装', 'logged-out': '已安装·未登录', ready: '就绪' }[cardState(id)])

const loggedOutHint = computed(() => {
  const out = AGENT_IDS.filter((id) => cardState(id) === 'logged-out')
  if (out.length === 0) return ''
  return out.map((id) => `${AGENTS[id].name} 未登录，请先运行 ${id === 'claude' ? 'claude /login' : 'codex login'}`).join('；')
})

const repoWarning = computed(() => {
  if (!config.repoDir) return ''
  if (repoGitState.value && repoGitState.value.isGit === false) {
    return '所选目录不是 Git 仓库，将无法检测研讨期间的工作区改动。'
  }
  return ''
})

async function refreshRepoGit() {
  repoGitState.value = config.repoDir ? await api.checkRepo(config.repoDir) : null
}

const callCount = computed(() => estimateCallCount(config.selectedAgents.length))

const startValidation = computed(() => validateStart({
  promptText: idea.value,
  repoDirValid: !!config.repoDir,
  selectedAgents: config.selectedAgents,
  moderator: config.moderator,
  detecting: detecting.value
}))

const moderatorModel = computed({
  get: () => config.moderator,
  set: (v) => { config.moderator = v; persist() }
})

const statusText = computed(() => {
  const s = record.value?.status
  if (s === 'running' && record.value?.id !== activeRunId.value) return '已中断（仅供查看）'
  return ({ running: '进行中', completed: '已完成', failed: '失败', canceled: '已取消' }[s] || '—')
})

const RECORD_BANNERS = {
  completed: { title: '历史研讨记录', copy: '这是上次完成的记录，可继续查看 timeline、导出 Markdown，或开始一轮新研讨。' },
  failed: { title: '失败的研讨记录', copy: '这次研讨未正常完成，已保留已有消息，便于排查或导出。' },
  canceled: { title: '已取消的研讨记录', copy: '这次研讨已取消，已保留取消前产生的内容。' },
  running: { title: '已中断的研讨记录', copy: '这是恢复到本窗口前的运行中记录，当前仅供查看。' }
}
const RECORD_BANNER_DEFAULT = { title: '研讨记录', copy: '可查看已有消息，或开始一轮新研讨。' }

const recordBanner = computed(() => RECORD_BANNERS[record.value?.status] || RECORD_BANNER_DEFAULT)

const agentsForPhase = (phase) => (phase === 'final' ? (config.moderator ? [config.moderator] : []) : config.selectedAgents)

function applyDefaults(cfg) {
  const ready = readyAgents(availability.value)
  const fromCfg = (cfg?.selectedAgents || []).filter((id) => ready.includes(id))
  config.selectedAgents = fromCfg.length ? fromCfg : defaultSelectedAgents(availability.value)
  config.moderator = (cfg?.moderator && config.selectedAgents.includes(cfg.moderator))
    ? cfg.moderator
    : defaultModerator(config.selectedAgents)
}

async function init() {
  const cfg = await api.getConfig()
  config.repoDir = cfg.repoDir || ''
  config.costNoticeAccepted = !!cfg.costNoticeAccepted
  refreshRepoGit()
  if (cfg.availability) {
    availability.value = cfg.availability
    applyDefaults(cfg)
  } else {
    await detect(cfg)
  }
  const last = await api.getLastRun()
  if (last) record.value = last
  unsubscribe = api.onEvent(onEvent)
}

async function detect(cfg) {
  detecting.value = true
  try {
    availability.value = await api.checkAgents()
    applyDefaults(cfg || config)
    persist()
  } finally {
    detecting.value = false
  }
}

function toggleAgent(id) {
  const set = new Set(config.selectedAgents)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  config.selectedAgents = AGENT_IDS.filter((a) => set.has(a))
  config.moderator = moderatorFallback(config.moderator, config.selectedAgents)
  persist()
}

function persist() {
  api.setConfig({
    repoDir: config.repoDir,
    selectedAgents: JSON.parse(JSON.stringify(config.selectedAgents)),
    moderator: config.moderator,
    costNoticeAccepted: config.costNoticeAccepted
  })
}

async function chooseRepo() {
  const res = await window.electronAPI.showDirectoryDialog()
  if (res.canceled || !res.filePaths?.length) return
  config.repoDir = res.filePaths[0]
  persist()
  refreshRepoGit()
}

function onEvent(ev) {
  if (ev.type === 'run-started') {
    record.value = ev.payload.record
    activeRunId.value = ev.payload.record.id
    Object.keys(progress).forEach((k) => delete progress[k])
  } else if (!record.value || ev.runId !== record.value.id) {
    return
  } else if (ev.type === 'message') {
    record.value.messages.push(ev.payload)
  } else if (ev.type === 'invocation') {
    progress[`${ev.payload.phase}:${ev.payload.agentId}`] = ev.payload.status
  } else if (ev.type === 'run-finished') {
    record.value.status = ev.payload.status
  }
}

async function start() {
  if (running.value || starting.value) return
  if (!startValidation.value.ok) return
  if (!config.costNoticeAccepted) {
    const ok = window.confirm('研讨将真实调用本地 Codex / ClaudeCode CLI，可能消耗对应服务用量。是否继续？')
    if (!ok) return
    config.costNoticeAccepted = true
    persist()
  }
  starting.value = true
  Object.keys(progress).forEach((k) => delete progress[k])
  try {
    await api.start({
      repoDir: config.repoDir,
      selectedAgents: JSON.parse(JSON.stringify(config.selectedAgents)),
      moderator: config.moderator,
      idea: idea.value
    })
  } finally {
    starting.value = false
  }
}

function stop() {
  api.stop()
}

function newDiscussion() {
  record.value = null
  idea.value = ''
  Object.keys(progress).forEach((k) => delete progress[k])
}

async function exportMd() {
  if (record.value) await api.exportMarkdown(JSON.parse(JSON.stringify(record.value)))
}

function copy(text) {
  navigator.clipboard?.writeText(text || '')
}

function renderMd(s) {
  return safeMarkdown(s)
}

function msgLabel(m) {
  if (m.type === 'user') return '你的想法'
  if (m.type === 'system') return '系统'
  const phase = { round1: '第一轮', round2: '第二轮', final: '最终方案' }[m.phase] || ''
  return `${m.agentName || m.agentId || ''}${phase ? ' · ' + phase : ''}`
}

watch(() => props.isActive, (v) => {
  if (v && supported && !initialized.value) { initialized.value = true; init() }
}, { immediate: true })

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.agent-workshop {
  display: flex;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-width: 0;
}
.aw-left {
  width: clamp(300px, 30vw, 380px);
  min-width: 300px;
  border-right: 1px solid var(--border-color);
  padding: 14px;
  overflow-y: auto;
  background: var(--bg-secondary);
}
.aw-right {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-width: 0;
}
.aw-record-banner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  padding: 12px 14px;
  border-left: 3px solid var(--accent);
}
.aw-record-title {
  color: var(--text-primary);
  font-weight: 700;
  margin-bottom: 3px;
}
.aw-record-copy {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}
.aw-record-actions {
  flex: none;
  display: flex;
  gap: 6px;
}
.aw-block {
  margin-bottom: 14px;
  padding: 14px;
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.aw-block-title {
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-primary);
}
.aw-repo { display: flex; gap: 6px; align-items: center; }
.aw-repo-path {
  flex: 1;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.aw-agent {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  margin-bottom: 6px;
  background: var(--bg-primary);
}
.aw-agent.ready { border-color: var(--accent-border); background: var(--accent-soft); }
.aw-agent.logged-out, .aw-agent.not-installed { opacity: 0.7; }
.aw-agent-main { display: flex; gap: 6px; align-items: center; cursor: pointer; }
.aw-agent-state { font-size: 12px; color: var(--text-secondary); }
.aw-select, .aw-textarea {
  width: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 8px;
}
.aw-textarea {
  min-height: 260px;
  resize: vertical;
  font-family: inherit;
  line-height: 1.55;
}
.aw-btn {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  cursor: pointer;
}
.aw-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.aw-btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); width: 100%; }
.aw-link { background: none; border: none; color: var(--accent); cursor: pointer; font-size: 12px; }
.aw-link:disabled { opacity: 0.5; cursor: not-allowed; }
.aw-warn { color: #e0a000; font-size: 12px; margin-top: 6px; }
.aw-hint { color: var(--text-secondary); font-size: 12px; margin-top: 6px; }
.aw-estimate { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
.aw-cost-note { color: var(--text-secondary); font-size: 12px; margin-top: 8px; }
.aw-phase { margin-bottom: 8px; }
.aw-phase-name {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 5px;
  font-weight: 700;
}
.aw-phase-agents { display: flex; gap: 4px; flex-wrap: wrap; }
.aw-pill {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
}
.aw-pill.running { border-color: var(--accent); color: var(--accent); }
.aw-pill.succeeded { border-color: #2ea043; color: #2ea043; }
.aw-pill.failed { border-color: #e05555; color: #e05555; }
.aw-actions { display: flex; gap: 6px; }
.aw-status { margin-top: 8px; font-size: 12px; color: var(--text-secondary); }
.aw-msg {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  margin-bottom: 12px;
  background: var(--bg-secondary);
  box-shadow: 0 8px 22px rgba(0,0,0,0.08);
}
.aw-msg.user { border-left: 3px solid var(--accent); }
.aw-msg.moderator { border-left: 3px solid #2ea043; }
.aw-msg.system { border-left: 3px solid #e0a000; }
.aw-msg-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-weight: 700;
}
.aw-msg-body { line-height: 1.6; word-break: break-word; }
.aw-msg-body :deep(pre) {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  padding: 10px;
  border-radius: var(--radius-sm);
  overflow-x: auto;
}
.aw-msg-body :deep(code) {
  font-family: var(--font-mono);
}
.aw-unsupported {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.aw-unsupported-card {
  max-width: 420px;
  text-align: center;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 24px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  box-shadow: var(--shadow-soft);
}
.aw-unsupported-title { font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }

@media (max-width: 1040px) {
  .agent-workshop {
    flex-direction: column;
    overflow: hidden;
  }

  .aw-left {
    width: auto;
    min-width: 0;
    max-height: 38%;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }

  .aw-right {
    min-height: 0;
  }

  .aw-repo,
  .aw-actions,
  .aw-record-banner,
  .aw-record-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 760px) {
  .aw-left {
    max-height: 48%;
    padding: 10px;
  }

  .aw-block {
    padding: 10px;
  }

  .aw-msg-head,
  .aw-agent {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
}
</style>
