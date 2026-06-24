<template>
  <div class="encode-tab">
    <!-- 左侧菜单 -->
    <nav class="tool-menu">
      <button
        v-for="t in TOOLS"
        :key="t.key"
        :class="['menu-item', { active: tool === t.key }]"
        @click="tool = t.key"
      >{{ t.label }}</button>
    </nav>

    <!-- 右侧工作区 -->
    <section class="work-area" :style="{ fontSize: fontSize + 'px' }">
      <!-- Base64 -->
      <div v-show="tool === 'base64'" class="pane">
        <div class="pane-toolbar">
          <button class="dir-btn" @click="b64Dir = b64Dir === 'encode' ? 'decode' : 'encode'">
            {{ b64Dir === 'encode' ? '文本 → Base64' : 'Base64 → 文本' }}
          </button>
        </div>
        <div class="dual">
          <div class="dual-col">
            <div class="col-head">{{ b64Dir === 'encode' ? '文本' : 'Base64' }}</div>
            <textarea v-model="b64Input" class="io" spellcheck="false" placeholder="输入…"></textarea>
          </div>
          <button class="swap-btn" title="互换" @click="swapB64">⇄</button>
          <div class="dual-col">
            <div class="col-head">
              <span>{{ b64Dir === 'encode' ? 'Base64' : '文本' }}</span>
              <button v-if="b64Result.success" class="copy-btn" @click="copy(b64Result.result)">复制</button>
            </div>
            <textarea :value="b64Result.success ? b64Result.result : ''" class="io" readonly spellcheck="false"></textarea>
            <div v-if="!b64Result.success" class="err">⚠ {{ b64Result.error }}</div>
          </div>
        </div>
      </div>

      <!-- URL -->
      <div v-show="tool === 'url'" class="pane">
        <div class="pane-toolbar">
          <button class="dir-btn" @click="urlDir = urlDir === 'encode' ? 'decode' : 'encode'">
            {{ urlDir === 'encode' ? '文本 → URL 编码' : 'URL 编码 → 文本' }}
          </button>
        </div>
        <div class="dual">
          <div class="dual-col">
            <div class="col-head">{{ urlDir === 'encode' ? '文本' : 'URL 编码' }}</div>
            <textarea v-model="urlInput" class="io" spellcheck="false" placeholder="输入…"></textarea>
          </div>
          <button class="swap-btn" title="互换" @click="swapUrl">⇄</button>
          <div class="dual-col">
            <div class="col-head">
              <span>{{ urlDir === 'encode' ? 'URL 编码' : '文本' }}</span>
              <button v-if="urlResult.success" class="copy-btn" @click="copy(urlResult.result)">复制</button>
            </div>
            <textarea :value="urlResult.success ? urlResult.result : ''" class="io" readonly spellcheck="false"></textarea>
            <div v-if="!urlResult.success" class="err">⚠ {{ urlResult.error }}</div>
          </div>
        </div>
      </div>

      <!-- Unicode -->
      <div v-show="tool === 'unicode'" class="pane">
        <div class="pane-toolbar">
          <button class="dir-btn" @click="uniDir = uniDir === 'encode' ? 'decode' : 'encode'">
            {{ uniDir === 'encode' ? '转义 →' : '← 反转义' }}
          </button>
          <label v-if="uniDir === 'encode'" class="fmt-label">
            格式：
            <select v-model="uniFormat" class="fmt-select">
              <option value="u">\u（BMP）</option>
              <option value="u-brace">\u{ }（码点）</option>
              <option value="html">&amp;#x;（HTML 实体）</option>
            </select>
          </label>
        </div>
        <div class="dual">
          <div class="dual-col">
            <div class="col-head">{{ uniDir === 'encode' ? '原文' : '转义文本' }}</div>
            <textarea v-model="uniInput" class="io" spellcheck="false" placeholder="输入文本…"></textarea>
          </div>
          <button class="swap-btn" title="互换" @click="swapUnicode">⇄</button>
          <div class="dual-col">
            <div class="col-head">
              <span>结果</span>
              <button v-if="uniResult.success" class="copy-btn" @click="copy(uniResult.result)">复制</button>
            </div>
            <textarea :value="uniResult.success ? uniResult.result : ''" class="io" readonly spellcheck="false"></textarea>
            <div v-if="!uniResult.success" class="err">⚠ {{ uniResult.error }}</div>
          </div>
        </div>
      </div>

      <!-- JWT -->
      <div v-show="tool === 'jwt'" class="pane">
        <div class="jwt-input">
          <div class="col-head">JWT Token</div>
          <textarea v-model="jwtInput" class="io" spellcheck="false" placeholder="粘贴 JWT…"></textarea>
        </div>
        <div v-if="jwtResult && !jwtResult.success" class="err">⚠ {{ jwtResult.error }}</div>
        <div v-if="jwtResult && jwtResult.success" class="jwt-out">
          <div class="jwt-seg">
            <div class="col-head"><span>Header</span><button class="copy-btn" @click="copy(jwtHeaderText)">复制</button></div>
            <pre class="jwt-json">{{ jwtHeaderText }}</pre>
          </div>
          <div class="jwt-seg">
            <div class="col-head"><span>Payload</span><button class="copy-btn" @click="copy(jwtPayloadText)">复制</button></div>
            <pre class="jwt-json">{{ jwtPayloadText }}</pre>
            <ul v-if="jwtTimeList.length" class="jwt-times">
              <li v-for="t in jwtTimeList" :key="t.key"><code>{{ t.key }}</code> = {{ t.human }}</li>
            </ul>
          </div>
          <div class="jwt-seg">
            <div class="col-head">Signature <span class="muted">（未验证）</span></div>
            <pre class="jwt-json sig">{{ jwtResult.result.signature }}</pre>
          </div>
        </div>
      </div>

      <!-- Hash -->
      <div v-show="tool === 'hash'" class="pane">
        <div class="col-head">输入文本</div>
        <textarea v-model="hashInput" class="io hash-in" spellcheck="false" placeholder="输入待计算文本…"></textarea>
        <div v-if="hashError" class="err">⚠ {{ hashError }}</div>
        <div v-if="hashResult" class="hash-rows">
          <div v-for="row in HASH_ALGOS" :key="row.key" class="hash-row">
            <span class="hash-name">{{ row.label }}</span>
            <code class="hash-val">{{ hashResult[row.key] }}</code>
            <button class="copy-btn" @click="copy(hashResult[row.key])">复制</button>
          </div>
        </div>
      </div>

      <!-- 进制 -->
      <div v-show="tool === 'base'" class="pane">
        <div class="base-grid">
          <label v-for="b in BASES" :key="b.key" class="base-field">
            <span class="base-name">{{ b.label }}</span>
            <input
              :value="baseVals[b.key]"
              class="base-input"
              spellcheck="false"
              :placeholder="b.placeholder"
              @input="onBaseInput(b.key, $event)"
            />
          </label>
        </div>
        <div v-if="baseError" class="err">⚠ {{ baseError }}</div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  decodeJWT,
  hashAll,
  convertBase,
  unicodeEscape,
  unicodeUnescape
} from '../utils/encodeHelper.js'

defineProps({
  fontSize: { type: Number, default: 14 }
})

const TOOLS = [
  { key: 'base64', label: 'Base64' },
  { key: 'url', label: 'URL' },
  { key: 'jwt', label: 'JWT' },
  { key: 'hash', label: 'Hash' },
  { key: 'base', label: '进制' },
  { key: 'unicode', label: 'Unicode' }
]
const tool = ref('base64')

function copy(text) {
  if (text != null) navigator.clipboard.writeText(String(text)).catch(() => {})
}
// 把当前结果搬入输入框并翻转方向（自然完成往返），3 个编解码工具共用
function makeSwap(inputRef, dirRef, resultRef) {
  return () => {
    if (resultRef.value.success) {
      inputRef.value = resultRef.value.result
      dirRef.value = dirRef.value === 'encode' ? 'decode' : 'encode'
    }
  }
}

// ── Base64 ──
const b64Input = ref('')
const b64Dir = ref('encode')
const b64Result = computed(() =>
  b64Dir.value === 'encode' ? base64Encode(b64Input.value) : base64Decode(b64Input.value)
)
const swapB64 = makeSwap(b64Input, b64Dir, b64Result)

// ── URL ──
const urlInput = ref('')
const urlDir = ref('encode')
const urlResult = computed(() =>
  urlDir.value === 'encode' ? urlEncode(urlInput.value) : urlDecode(urlInput.value)
)
const swapUrl = makeSwap(urlInput, urlDir, urlResult)

// ── Unicode ──
const uniInput = ref('')
const uniDir = ref('encode')
const uniFormat = ref('u-brace')
const uniResult = computed(() =>
  uniDir.value === 'encode'
    ? unicodeEscape(uniInput.value, uniFormat.value)
    : unicodeUnescape(uniInput.value)
)
const swapUnicode = makeSwap(uniInput, uniDir, uniResult)

// ── JWT ──
const jwtInput = ref('')
const jwtResult = computed(() => (jwtInput.value.trim() ? decodeJWT(jwtInput.value) : null))
const jwtHeaderText = computed(() =>
  jwtResult.value?.success ? JSON.stringify(jwtResult.value.result.header, null, 2) : ''
)
const jwtPayloadText = computed(() =>
  jwtResult.value?.success ? JSON.stringify(jwtResult.value.result.payload, null, 2) : ''
)
const jwtTimeList = computed(() => {
  if (!jwtResult.value?.success) return []
  return Object.entries(jwtResult.value.result.timeFields).map(([key, human]) => ({ key, human }))
})

// ── Hash ──
const HASH_ALGOS = [
  { key: 'md5', label: 'MD5' },
  { key: 'sha1', label: 'SHA-1' },
  { key: 'sha256', label: 'SHA-256' },
  { key: 'sha512', label: 'SHA-512' }
]
const hashInput = ref('')
const hashResult = ref(null)
const hashError = ref('')
let hashGen = 0
let hashTimer = null
watch(hashInput, (val) => {
  clearTimeout(hashTimer)
  ++hashGen // 作废任何仍在途的旧请求
  if (val === '') {
    hashResult.value = null
    hashError.value = ''
    return
  }
  hashTimer = setTimeout(async () => {
    const g = ++hashGen
    const r = await hashAll(val)
    if (g !== hashGen) return // 丢弃过期响应
    if (r.success) {
      hashResult.value = r.result
      hashError.value = ''
    } else {
      hashResult.value = null
      hashError.value = r.error
    }
  }, 300)
})

// ── 进制 ──
const BASES = [
  { key: 'dec', label: 'DEC（十进制）', placeholder: '255' },
  { key: 'hex', label: 'HEX（十六进制）', placeholder: 'ff' },
  { key: 'oct', label: 'OCT（八进制）', placeholder: '377' },
  { key: 'bin', label: 'BIN（二进制）', placeholder: '11111111' }
]
const baseVals = reactive({ dec: '', hex: '', oct: '', bin: '' })
const baseError = ref('')
function onBaseInput(key, e) {
  baseVals[key] = e.target.value
  const r = convertBase(e.target.value, key)
  if (r.success) {
    Object.assign(baseVals, r.result) // 覆盖全部四个字段（含当前输入框，幂等）
  } else {
    for (const k of Object.keys(baseVals)) if (k !== key) baseVals[k] = ''
  }
  baseError.value = r.success ? '' : r.error
}
</script>

<style scoped>
.encode-tab {
  display: flex;
  height: 100%;
  background: var(--bg-primary);
}
.tool-menu {
  display: flex;
  flex-direction: column;
  width: 150px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color);
  background: var(--bg-secondary);
  padding: 12px 8px;
  gap: 4px;
}
.menu-item {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  text-align: left;
  justify-content: flex-start;
  padding: 9px 10px;
  cursor: pointer;
  font-size: 13px;
  border-radius: var(--radius-sm);
}
.menu-item:hover {
  color: var(--text-primary);
  background: var(--surface-hover);
}
.menu-item.active {
  color: var(--text-primary);
  border-color: var(--accent-border);
  background: var(--accent-soft);
}
.work-area {
  flex: 1;
  overflow: auto;
  padding: 12px;
  min-width: 0;
}
.pane {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.pane-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  flex-wrap: wrap;
}
.dir-btn {
  padding: 5px 14px;
  font-size: 13px;
  cursor: pointer;
}
.fmt-label {
  font-size: 13px;
  color: var(--text-secondary);
}
.fmt-select {
  font-size: 13px;
  padding: 3px 6px;
}
.dual {
  display: flex;
  align-items: stretch;
  gap: 12px;
  flex: 1;
  min-height: 0;
}
.dual-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.col-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  min-height: 34px;
  padding: 7px 10px;
  background: var(--surface-raised);
  border-bottom: 1px solid var(--border-subtle);
  font-weight: 700;
}
.io {
  flex: 1;
  width: 100%;
  resize: none;
  background: var(--bg-primary);
  border: none;
  border-radius: 0;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: inherit;
  padding: 10px;
  line-height: 1.5;
  box-sizing: border-box;
}
.io[readonly] {
  background: var(--bg-primary);
}
.swap-btn {
  align-self: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 16px;
  padding: 6px 8px;
}
.copy-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 11px;
  padding: 1px 8px;
}
.copy-btn:hover {
  color: var(--text-primary);
  border-color: var(--accent);
}
.err {
  color: #e06c75;
  font-size: 12px;
  margin-top: 6px;
}
/* JWT */
.jwt-input {
  display: flex;
  flex-direction: column;
  height: 110px;
  margin-bottom: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.jwt-out {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.jwt-seg .col-head {
  margin-bottom: 4px;
}
.jwt-json {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 8px;
  margin: 0;
  font-family: var(--font-mono);
  font-size: inherit;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--text-primary);
}
.jwt-json.sig {
  color: var(--text-secondary);
}
.muted {
  color: var(--text-secondary);
  font-size: 11px;
}
.jwt-times {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  font-size: 12px;
  color: var(--text-secondary);
}
.jwt-times code {
  color: var(--accent);
  margin-right: 4px;
}
/* Hash */
.hash-in {
  height: 100px;
  flex: none;
}
.hash-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}
.hash-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.hash-name {
  width: 80px;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-secondary);
}
.hash-val {
  flex: 1;
  font-family: var(--font-mono);
  font-size: inherit;
  word-break: break-all;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 6px 8px;
  color: var(--text-primary);
}
/* 进制 */
.base-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 760px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
}
.base-field {
  display: flex;
  align-items: center;
  gap: 12px;
}
.base-name {
  width: 130px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--text-secondary);
}
.base-input {
  flex: 1;
  font-family: var(--font-mono);
  font-size: inherit;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  color: var(--text-primary);
}

@media (max-width: 900px) {
  .encode-tab {
    flex-direction: column;
  }

  .tool-menu {
    width: auto;
    flex-direction: row;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
    padding: 8px;
  }

  .menu-item {
    flex: 0 0 auto;
    white-space: nowrap;
  }
}

@media (max-width: 760px) {
  .dual {
    flex-direction: column;
    overflow: auto;
  }

  .dual-col {
    flex: 0 0 260px;
  }

  .swap-btn {
    align-self: flex-start;
    transform: rotate(90deg);
  }

  .base-field,
  .hash-row {
    align-items: stretch;
    flex-direction: column;
    gap: 6px;
  }

  .base-name,
  .hash-name {
    width: auto;
  }
}
</style>
