<template>
  <div class="agent-workshop" :style="{ fontSize: fontSize + 'px' }">
    <!-- Windows 暂不支持：本地 CLI 检测与进程组管理尚未适配 -->
    <div v-if="!supported" class="aw-unsupported">
      <div class="aw-unsupported-card">
        <div class="aw-unsupported-title">Agent 研讨室暂不支持 Windows</div>
        <p>该功能依赖本地 Codex / ClaudeCode CLI 的检测与进程管理，目前仅在 macOS 与 Linux 上可用。</p>
      </div>
    </div>

    <template v-if="supported">
      <div class="aw-stage-bar" aria-label="研讨阶段">
        <span
          v-for="stage in WORKSHOP_STAGES"
          :key="stage.key"
          :class="['aw-stage', stageState(stage.key)]"
          :aria-current="workshopStage === stage.key ? 'step' : undefined"
        >
          <span class="aw-stage-index">{{ stage.index }}</span>
          {{ stage.label }}
        </span>
      </div>

      <div :class="['aw-layout', `stage-${workshopStage}`]">
    <!-- 左栏：配置 / 进度 -->
    <aside class="aw-left">
      <section v-if="workshopStage === 'prepare'" class="aw-block">
        <div class="aw-block-title">本地仓库</div>
        <div class="aw-repo">
          <code class="aw-repo-path" :title="config.repoDir">{{ config.repoDir || '未选择目录' }}</code>
          <button class="aw-btn" :disabled="running" @click="chooseRepo">选择目录</button>
        </div>
        <p v-if="repoWarning" class="aw-warn">{{ repoWarning }}</p>
      </section>

      <section v-if="workshopStage === 'prepare'" class="aw-block">
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
          <div class="aw-agent-side">
            <span class="aw-agent-state">{{ stateLabel(id) }}</span>
            <button
              class="aw-link"
              :disabled="running || testingConnection(id) || cardState(id) === 'not-installed' || !config.repoDir || !proxyValidation.ok"
              @click="testConnection(id)"
            >
              {{ testingConnection(id) ? '测试中…' : '测试连接' }}
            </button>
          </div>
        </div>
        <p v-for="id in connectionResultIds" :key="`conn-${id}`" class="aw-hint" :class="{ 'aw-warn': connectionResults[id]?.success === false }">
          {{ connectionResultText(id) }}
        </p>
        <p v-if="loggedOutHint" class="aw-warn">{{ loggedOutHint }}</p>
      </section>

      <section v-if="workshopStage === 'prepare'" class="aw-block">
        <div class="aw-block-title">网络 / 代理</div>
        <label class="aw-toggle-row">
          <input
            type="checkbox"
            v-model="config.proxyConfig.enabled"
            :disabled="running"
            @change="persistProxy"
          />
          <span>启用代理</span>
        </label>
        <input
          v-model="config.proxyConfig.url"
          class="aw-input"
          type="text"
          placeholder="http://127.0.0.1:7897"
          :disabled="running || !config.proxyConfig.enabled"
          @blur="persistProxy"
        />
        <label class="aw-toggle-row">
          <input
            type="checkbox"
            v-model="config.proxyConfig.applyAll"
            :disabled="running || !config.proxyConfig.enabled"
            @change="persistProxy"
          />
          <span>ALL_PROXY</span>
        </label>
        <p v-if="proxyMessage" class="aw-hint" :class="{ 'aw-warn': !proxyValidation.ok || proxySaveError }">{{ proxyMessage }}</p>
      </section>

      <section v-if="workshopStage === 'prepare'" class="aw-block">
        <div class="aw-block-title">主持 Agent</div>
        <select v-model="moderatorModel" class="aw-select" :disabled="running || config.selectedAgents.length === 0">
          <option v-for="id in config.selectedAgents" :key="id" :value="id">{{ AGENTS[id].name }}</option>
        </select>
      </section>

      <section v-if="workshopStage === 'prepare'" class="aw-block aw-start-block">
        <div class="aw-estimate">预计调用 {{ callCount }} 次 agent</div>
        <button class="aw-btn aw-btn-primary" :disabled="!startValidation.ok || starting" :title="startValidation.reason || ''" @click="start">
          {{ starting ? '启动中…' : '开始研讨' }}
        </button>
        <p v-if="!startValidation.ok" class="aw-hint">{{ startValidation.reason }}</p>
      </section>

      <section v-if="workshopStage !== 'prepare'" class="aw-block aw-progress-block">
        <div class="aw-block-title">进度</div>
        <div v-for="ph in phaseList" :key="ph.key" class="aw-phase">
          <div class="aw-phase-name">{{ ph.label }}</div>
          <div class="aw-phase-agents">
            <template v-for="id in agentsForPhase(ph.key)" :key="id">
              <button
                v-if="hasNavigationTarget(ph.key, id)"
                type="button"
                class="aw-pill aw-pill-nav"
                :class="progressStatus(ph.key, id)"
                :title="`跳转到${ph.label} · ${AGENTS[id].name}`"
                :aria-label="`${ph.label} · ${AGENTS[id].name} · ${progressStatusLabel(progressStatus(ph.key, id))}，跳转到消息`"
                @click="scrollToMessage(ph.key, id)"
              >
                {{ AGENTS[id].name }}
              </button>
              <span
                v-else
                class="aw-pill"
                :class="progressStatus(ph.key, id)"
                :aria-label="`${ph.label} · ${AGENTS[id].name} · ${progressStatusLabel(progressStatus(ph.key, id))}`"
              >
                {{ AGENTS[id].name }}
              </span>
            </template>
          </div>
        </div>
        <button v-if="running" class="aw-btn" @click="stop">停止研讨</button>
        <div class="aw-status">状态：{{ statusText }}</div>
      </section>
    </aside>

    <!-- 右栏：想法输入 / 时间线 -->
    <main class="aw-right">
      <div v-if="workshopStage === 'result'" class="aw-record-banner tool-panel">
        <div>
          <div class="aw-record-title">{{ recordBanner.title }}</div>
          <div class="aw-record-copy">{{ recordBanner.copy }}</div>
        </div>
        <div class="aw-record-actions">
          <button class="aw-btn" @click="newDiscussion">新研讨</button>
          <button class="aw-btn" :disabled="!record" @click="exportMd">导出 Markdown</button>
        </div>
      </div>

      <div v-if="workshopStage === 'prepare'" class="aw-idea tool-panel">
        <div class="aw-block-title">你的想法 / 初始方案</div>
        <textarea
          v-model="idea"
          class="aw-textarea"
          placeholder="描述你想让多个 Agent 研讨的需求或初始方案……"
        ></textarea>
        <p class="aw-cost-note">提示：研讨会真实调用本地 Codex / ClaudeCode CLI，需已登录，并可能消耗对应服务用量。</p>
      </div>

      <div v-else class="aw-timeline">
        <article
          v-for="m in record.messages"
          :key="m.id"
          :ref="(el) => setMessageRef(m.id, el)"
          class="aw-msg"
          :class="[m.type, { 'is-navigation-target': activeMessageId === m.id }]"
        >
          <header class="aw-msg-head">
            <span>{{ msgLabel(m) }}</span>
            <button class="aw-link" @click="copy(m.content)">复制</button>
          </header>
          <div class="aw-msg-body" v-html="renderMd(m)"></div>
        </article>
      </div>
    </main>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onUnmounted } from 'vue'
import { safeMarkdown } from '../utils/safeMarkdown.js'
import {
  AGENTS,
  AGENT_IDS,
  agentCardState,
  readyAgents,
  defaultSelectedAgents,
  defaultModerator,
  moderatorFallback,
  DEFAULT_PROXY_CONFIG,
  normalizeProxyConfig,
  validateProxyConfig,
  validateStart,
  estimateCallCount,
  buildMessageNavigationTargets,
  agentsForDiscussionPhase,
  getWorkshopUiStage
} from '../utils/agentWorkshopHelper.js'

const props = defineProps({
  isActive: { type: Boolean, default: false },
  fontSize: { type: Number, default: 14 }
})

const api = window.electronAPI.agentWorkshop

// 平台门控：Windows 上本地 CLI 检测与进程组管理尚未适配，整页显示「暂不支持」
const supported = !/^win/i.test(navigator.platform || '')

const config = reactive({
  repoDir: '',
  selectedAgents: [],
  moderator: null,
  costNoticeAccepted: false,
  proxyConfig: normalizeProxyConfig(DEFAULT_PROXY_CONFIG)
})
const availability = ref(null)
const detecting = ref(false)
const starting = ref(false) // 已发起 start、尚未进入 running 的窗口，防重复点击
const idea = ref('')
const record = ref(null)
const activeRunId = ref(null) // 仅本会话真正启动的运行；恢复的旧记录不算
const repoGitState = ref(null) // 当前所选目录的 Git 探测结果，独立于历史记录
const progress = reactive({})
const connectionTesting = reactive({})
const connectionResults = reactive({})
const initialized = ref(false)
const activeMessageId = ref(null)
const proxySaveError = ref('')
const messageElements = new Map()
let unsubscribe = null
let highlightTimer = null

const phaseList = [
  { key: 'round1', label: '第一轮 · 独立提案' },
  { key: 'round2', label: '第二轮 · 交叉评审' },
  { key: 'final', label: '最终方案' }
]
const WORKSHOP_STAGES = [
  { key: 'prepare', label: '准备', index: 1 },
  { key: 'running', label: '运行', index: 2 },
  { key: 'result', label: '结果', index: 3 }
]

// 仅当记录是本会话启动且仍在运行时，才视为「运行中」；恢复的 running 旧记录按已中断处理
const running = computed(() => record.value?.status === 'running' && record.value?.id === activeRunId.value)
const workshopStage = computed(() => getWorkshopUiStage(record.value, activeRunId.value))
const stageState = (key) => {
  const currentIndex = WORKSHOP_STAGES.findIndex((stage) => stage.key === workshopStage.value)
  const targetIndex = WORKSHOP_STAGES.findIndex((stage) => stage.key === key)
  if (targetIndex === currentIndex) return 'active'
  return targetIndex < currentIndex ? 'complete' : 'pending'
}

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

const proxyValidation = computed(() => validateProxyConfig(config.proxyConfig))
const proxyMessage = computed(() => proxySaveError.value || proxyValidation.value.error || '')

const startValidation = computed(() => {
  const base = validateStart({
    promptText: idea.value,
    repoDirValid: !!config.repoDir,
    selectedAgents: config.selectedAgents,
    moderator: config.moderator,
    detecting: detecting.value
  })
  if (!base.ok) return base
  if (!proxyValidation.value.ok) return { ok: false, reason: proxyValidation.value.error }
  return base
})

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

const agentsForPhase = (phase) => agentsForDiscussionPhase(phase, { record: record.value, config })
const messageNavigationTargets = computed(() => buildMessageNavigationTargets(record.value?.messages))
const navKey = (phase, agentId) => `${phase}:${agentId}`
const hasNavigationTarget = (phase, agentId) => !!messageNavigationTargets.value[navKey(phase, agentId)]
const progressStatus = (phase, agentId) => progress[navKey(phase, agentId)] || (hasNavigationTarget(phase, agentId) ? 'succeeded' : 'pending')
const progressStatusLabel = (status) => ({
  pending: '等待中',
  running: '进行中',
  succeeded: '已完成',
  failed: '失败',
  canceled: '已取消'
}[status] || status)

function clearActiveNavigation() {
  activeMessageId.value = null
  if (highlightTimer) {
    clearTimeout(highlightTimer)
    highlightTimer = null
  }
}

function setMessageRef(messageId, el) {
  if (!messageId) return
  if (el) messageElements.set(messageId, el)
  else messageElements.delete(messageId)
}

async function scrollToMessage(phase, agentId) {
  const messageId = messageNavigationTargets.value[navKey(phase, agentId)]
  if (!messageId) return
  activeMessageId.value = messageId
  if (highlightTimer) clearTimeout(highlightTimer)
  await nextTick()
  messageElements.get(messageId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  highlightTimer = setTimeout(() => {
    if (activeMessageId.value === messageId) activeMessageId.value = null
    highlightTimer = null
  }, 1600)
}

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
  config.proxyConfig = normalizeProxyConfig(cfg.proxyConfig)
  refreshRepoGit()
  if (cfg.availability) {
    availability.value = cfg.availability
    applyDefaults(cfg)
  } else {
    await detect(cfg)
  }
  const last = await api.getLastRun()
  if (last) { record.value = last; mdCache.clear() }
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
  // 代理配置由其自身控件（启用/URL blur/ALL_PROXY）独立持久化，不在通用 persist 里连带保存，
  // 避免无关操作触发代理校验错误与多余 IPC 写入
  api.setConfig({
    repoDir: config.repoDir,
    selectedAgents: JSON.parse(JSON.stringify(config.selectedAgents)),
    moderator: config.moderator,
    costNoticeAccepted: config.costNoticeAccepted
  })
}

async function persistProxy() {
  const valid = proxyValidation.value
  if (!valid.ok) {
    proxySaveError.value = valid.error
    return
  }
  // normalizeProxyConfig 已返回全为原始值的新对象，可直接结构化克隆用于 IPC
  const res = await api.setConfig({ proxyConfig: normalizeProxyConfig(config.proxyConfig) })
  proxySaveError.value = res?.success === false ? (res.error || '代理配置保存失败') : ''
}

const connectionResultIds = computed(() => AGENT_IDS.filter((id) => connectionResults[id]))
const testingConnection = (id) => !!connectionTesting[id]

function connectionResultText(id) {
  const result = connectionResults[id]
  if (!result) return ''
  if (result.success) return `${AGENTS[id].name} 连接测试成功`
  return `${AGENTS[id].name} 连接测试失败：${result.error || '未知错误'}`
}

async function testConnection(id) {
  if (running.value || testingConnection(id) || !proxyValidation.value.ok) return
  await persistProxy()
  if (proxySaveError.value) return
  connectionTesting[id] = true
  connectionResults[id] = null
  try {
    connectionResults[id] = await api.testAgentConnection({ agentId: id, repoDir: config.repoDir })
  } finally {
    connectionTesting[id] = false
  }
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
    mdCache.clear()
    clearActiveNavigation()
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
  await persistProxy()
  if (proxySaveError.value) return
  if (!config.costNoticeAccepted) {
    const res = await window.electronAPI.showMessageBox({
      type: 'warning',
      title: '确认开始研讨',
      message: '研讨将调用本地 AI agent',
      detail: '研讨将真实调用本地 Codex / ClaudeCode CLI，可能消耗对应服务用量。是否继续？',
      buttons: ['继续', '取消'],
      defaultId: 0,
      cancelId: 1
    })
    if (res?.response !== 0) return
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
  mdCache.clear()
  clearActiveNavigation()
  Object.keys(progress).forEach((k) => delete progress[k])
}

async function exportMd() {
  if (record.value) await api.exportMarkdown(JSON.parse(JSON.stringify(record.value)))
}

function copy(text) {
  navigator.clipboard?.writeText(text || '')
}

// 按消息 id 记忆化：消息 content 一旦入列即不可变，避免每次时间线重渲染都重跑 marked+DOMPurify
const mdCache = new Map()
function renderMd(m) {
  let html = mdCache.get(m.id)
  if (html === undefined) {
    html = safeMarkdown(m.content)
    mdCache.set(m.id, html)
  }
  return html
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

// 代理配置或仓库变化后，此前的连接测试结果不再代表当前配置，清空避免误导
watch(
  () => [config.proxyConfig.enabled, config.proxyConfig.url, config.proxyConfig.applyAll, config.repoDir],
  () => { Object.keys(connectionResults).forEach((id) => delete connectionResults[id]) }
)

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  clearActiveNavigation()
  messageElements.clear()
})
</script>

<style scoped>
.agent-workshop {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.aw-stage-bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 7px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}
.aw-stage {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 96px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
}
.aw-stage + .aw-stage::before {
  content: '';
  width: 24px;
  height: 1px;
  margin-right: 1px;
  background: var(--border-color);
}
.aw-stage-index {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 1px solid var(--border-color);
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 11px;
}
.aw-stage.active { color: var(--accent); }
.aw-stage.active .aw-stage-index {
  color: #fff;
  background: var(--accent);
  border-color: var(--accent);
}
.aw-stage.complete { color: var(--success); }
.aw-stage.complete .aw-stage-index { border-color: var(--success); }
.aw-layout {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
}
.aw-layout.stage-prepare {
  align-items: flex-start;
  overflow-y: auto;
}
.aw-layout.stage-running,
.aw-layout.stage-result {
  overflow: hidden;
}
.aw-left {
  width: clamp(300px, 30vw, 380px);
  min-width: 300px;
  flex: none;
  border-right: 1px solid var(--border-color);
  padding: 14px;
  background: var(--bg-secondary);
}
.aw-right {
  flex: 1;
  padding: 16px;
  min-width: 0;
}
.stage-running .aw-right,
.stage-result .aw-right {
  overflow-y: auto;
}
.aw-start-block {
  position: sticky;
  bottom: 0;
  z-index: 4;
  box-shadow: 0 -10px 26px var(--bg-secondary);
}
.aw-progress-block {
  position: sticky;
  top: 14px;
}
.aw-idea {
  padding: 14px;
}
.aw-timeline {
  width: min(100%, 980px);
  margin: 0 auto;
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
.aw-agent-side {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.aw-agent-state { font-size: 12px; color: var(--text-secondary); }
.aw-select, .aw-textarea, .aw-input {
  width: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 8px;
}
.aw-input:disabled { opacity: 0.65; }
.aw-toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 12px;
  margin: 8px 0;
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
  appearance: none;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  line-height: 1.35;
}
.aw-pill-nav {
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.aw-pill-nav:hover,
.aw-pill-nav:focus-visible {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
  outline: none;
  box-shadow: 0 0 0 2px var(--accent-soft);
}
.aw-pill.running { border-color: var(--accent); color: var(--accent); }
.aw-pill.succeeded { border-color: #2ea043; color: #2ea043; }
.aw-pill.failed { border-color: #e05555; color: #e05555; }
.aw-status { margin-top: 8px; font-size: 12px; color: var(--text-secondary); }
.aw-msg {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  margin-bottom: 12px;
  background: var(--bg-secondary);
  box-shadow: 0 8px 22px rgba(0,0,0,0.08);
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.aw-msg.user { border-left: 3px solid var(--accent); }
.aw-msg.moderator { border-left: 3px solid #2ea043; }
.aw-msg.system { border-left: 3px solid #e0a000; }
.aw-msg.is-navigation-target {
  border-color: var(--accent);
  background: var(--accent-soft);
  box-shadow: 0 0 0 2px var(--accent-soft), 0 10px 28px rgba(0,0,0,0.12);
}
.aw-msg-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-weight: 700;
}
.aw-msg-body { max-width: 80ch; line-height: 1.6; word-break: break-word; }
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
  .aw-layout.stage-prepare,
  .aw-layout.stage-running,
  .aw-layout.stage-result {
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .aw-left {
    width: auto;
    min-width: 0;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }

  .aw-right,
  .stage-running .aw-right,
  .stage-result .aw-right {
    flex: none;
    min-height: 0;
    width: 100%;
    overflow: visible;
  }

  .aw-progress-block {
    position: static;
  }

  .aw-repo,
  .aw-record-banner,
  .aw-record-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 760px) {
  .aw-left {
    padding: 10px;
  }

  .aw-stage-bar {
    justify-content: flex-start;
    overflow-x: auto;
  }

  .aw-stage {
    min-width: max-content;
  }

  .aw-stage + .aw-stage::before {
    width: 12px;
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
