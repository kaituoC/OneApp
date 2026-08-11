<template>
  <div class="time-tab">
    <div class="time-navigation tool-segmented" role="radiogroup" aria-label="时间工具" @keydown="handleSegmentedKeydown">
      <button
        v-for="section in TIME_SECTIONS"
        :key="section.key"
        role="radio"
        :aria-checked="activeSection === section.key"
        :class="{ active: activeSection === section.key }"
        @click="activeSection = section.key"
      >{{ section.label }}</button>
    </div>

    <!-- 实时时间显示区 -->
    <div v-show="activeSection === 'current'" class="live-section tool-panel">
      <div class="live-row">
        <div class="live-item">
          <span class="live-label">当前时间</span>
          <span class="live-value">{{ liveDateTime }}</span>
          <button class="copy-btn" @click="copyLiveDateTime">复制</button>
        </div>
        <div class="live-item">
          <span class="live-label">时间戳</span>
          <div class="live-ts-row">
            <span class="live-value">{{ liveTimestamp }}</span>
          <div class="unit-toggle tool-segmented" role="radiogroup" aria-label="当前时间戳单位" @keydown="handleSegmentedKeydown">
              <button role="radio" :aria-checked="displayMode === 'second'" :class="{ active: displayMode === 'second' }" @click="displayMode = 'second'">秒</button>
              <button role="radio" :aria-checked="displayMode === 'millisecond'" :class="{ active: displayMode === 'millisecond' }" @click="displayMode = 'millisecond'">毫秒</button>
            </div>
          </div>
          <button class="copy-btn" @click="copyLiveTimestamp">复制</button>
        </div>
      </div>
    </div>

    <!-- 时间戳转日期 -->
    <div v-show="activeSection === 'convert'" class="convert-section tool-panel">
      <div class="section-header tool-panel-header">时间戳转日期</div>
      <div class="convert-content">
        <div class="convert-row">
          <span class="row-label">时间戳</span>
          <input
            v-model="tsToDateInput"
            type="text"
            placeholder="输入时间戳"
            class="convert-input"
          />
          <button @click="useCurrentTimestamp">当前</button>
          <div class="inline-radio">
            <label><input type="radio" v-model="tsToDateUnit" value="second" /> 秒</label>
            <label><input type="radio" v-model="tsToDateUnit" value="millisecond" /> 毫秒</label>
          </div>
          <button @click="convertTsToDate">转换</button>
        </div>
        <div class="convert-row">
          <span class="row-label">输出格式</span>
          <select v-model="tsToDateFormat" class="format-select">
            <option value="yyyy-MM-dd HH:mm:ss">yyyy-MM-dd HH:mm:ss</option>
            <option value="yyyy/MM/dd HH:mm:ss">yyyy/MM/dd HH:mm:ss</option>
            <option value="yyyyMMdd">yyyyMMdd</option>
            <option value="yyyy-MM-dd">yyyy-MM-dd</option>
            <option value="yyyy/MM/dd">yyyy/MM/dd</option>
            <option value="MM-dd HH:mm:ss">MM-dd HH:mm:ss</option>
            <option value="HH:mm:ss">HH:mm:ss</option>
            <option value="yyyy年MM月dd日HH时mm分ss秒">yyyy年MM月dd日HH时mm分ss秒</option>
            <option value="dd/MM/yyyy HH:mm:ss">dd/MM/yyyy HH:mm:ss</option>
            <option value="MM/dd/yyyy HH:mm:ss">MM/dd/yyyy HH:mm:ss</option>
          </select>
        </div>
        <div class="convert-row">
          <span class="row-label">结果</span>
          <span class="convert-result">{{ tsToDateResult || '--' }}</span>
          <button @click="copyTsToDateResult" :disabled="!tsToDateResult">复制</button>
        </div>
      </div>
    </div>

    <!-- 日期转时间戳 -->
    <div v-show="activeSection === 'convert'" class="convert-section tool-panel">
      <div class="section-header tool-panel-header">日期转时间戳</div>
      <div class="convert-content">
        <div class="convert-row">
          <span class="row-label">日期时间</span>
          <input
            v-model="dateToTsInput"
            type="text"
            placeholder="yyyy-MM-dd HH:mm:ss"
            class="convert-input"
          />
          <button @click="useCurrentDateTime">当前</button>
          <button @click="convertDateToTs">转换</button>
        </div>
        <div class="convert-row">
          <span class="row-label">结果</span>
          <div class="ts-results-inline">
            <div class="ts-item">
              <span class="ts-label">秒:</span>
              <span class="ts-value">{{ dateToTsResultSecond || '--' }}</span>
              <button class="copy-btn small" @click="copySecondTs" :disabled="!dateToTsResultSecond">复制</button>
            </div>
            <div class="ts-item">
              <span class="ts-label">毫秒:</span>
              <span class="ts-value">{{ dateToTsResultMs || '--' }}</span>
              <button class="copy-btn small" @click="copyMsTs" :disabled="!dateToTsResultMs">复制</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-show="activeSection === 'cron'" class="convert-section tool-panel">
      <div class="section-header tool-panel-header">Cron 表达式解释</div>
      <div class="convert-content">
        <div class="convert-row">
          <span class="row-label">表达式</span>
          <input
            v-model="cronInput"
            type="text"
            placeholder="分钟 小时 日 月 星期，例如 */15 9-18 * * 1-5"
            class="convert-input cron-input"
          />
          <button @click="explainCron">解释</button>
        </div>
        <div class="convert-row cron-result-row">
          <span class="row-label">解释</span>
          <span :class="['convert-result', { 'cron-error': cronHasError }]">
            {{ cronDescription || '--' }}
          </span>
        </div>
        <div class="convert-row cron-result-row">
          <span class="row-label">未来 5 次</span>
          <ol v-if="cronRuns.length" class="cron-run-list">
            <li v-for="run in cronRuns" :key="run">{{ run }}</li>
          </ol>
          <span v-else class="convert-result">--</span>
        </div>
      </div>
    </div>

    <div v-show="activeSection === 'timezone'" class="convert-section tool-panel">
      <div class="section-header tool-panel-header">多时区对照</div>
      <div class="convert-content">
        <div class="convert-row">
          <span class="row-label">添加城市</span>
          <select v-model="timezoneToAdd" class="format-select">
            <option value="" disabled>选择城市</option>
            <option v-for="preset in availableTimezones" :key="preset.id" :value="preset.id">
              {{ preset.label }} · {{ preset.timeZone }}
            </option>
          </select>
          <button @click="addTimezone" :disabled="!timezoneToAdd">添加</button>
        </div>
        <table class="timezone-table">
          <thead>
            <tr>
              <th>城市</th>
              <th>日期</th>
              <th>时间</th>
              <th>差异</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in timezoneRows" :key="row.id">
              <td>{{ row.label }}</td>
              <td>{{ row.date }}</td>
              <td>{{ row.time }}</td>
              <td>{{ row.relation }}</td>
              <td><button class="copy-btn small" @click="removeTimezone(row)" :disabled="row.pinned">移除</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 复制成功提示 -->
    <div v-if="copyMessage" :class="['tool-copy-toast', { error: copyMessage === '复制失败' }]">{{ copyMessage }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCopyToast } from '../composables/useCopyToast.js'
import { handleSegmentedKeydown } from '../utils/segmentedControl.js'
import {
  formatDate,
  timestampToDate,
  dateToTimestamp,
  getCurrentTimestamp,
  getCurrentFormattedDate,
  explainCronExpression,
  buildInitialCronPreview,
  buildTimezoneComparison,
  getAvailableTimezonePresets
} from '../utils/timeHelper.js'

defineProps({
  fontSize: { type: Number, default: 14 }
})

const TIME_SECTIONS = [
  { key: 'current', label: '当前时间' },
  { key: 'convert', label: '时间转换' },
  { key: 'cron', label: 'Cron' },
  { key: 'timezone', label: '多时区' }
]
const activeSection = ref('current')

// 显示模式
const displayMode = ref('second')

// 实时时间
const liveTime = ref(Date.now())
let timer = null

const liveDateTime = computed(() => {
  return formatDate(liveTime.value, 'yyyy-MM-dd HH:mm:ss')
})

const liveTimestamp = computed(() => {
  if (displayMode.value === 'second') {
    return Math.floor(liveTime.value / 1000)
  }
  return liveTime.value
})

// 时间戳转日期
const tsToDateInput = ref('')
const tsToDateUnit = ref('second')
const tsToDateFormat = ref('yyyy-MM-dd HH:mm:ss')
const tsToDateResult = ref('')

function useCurrentTimestamp() {
  tsToDateInput.value = getCurrentTimestamp(tsToDateUnit.value).toString()
}

function convertTsToDate() {
  if (!tsToDateInput.value) return

  const result = timestampToDate(tsToDateInput.value, tsToDateUnit.value, tsToDateFormat.value)
  if (result.success) {
    tsToDateResult.value = result.result
  } else {
    tsToDateResult.value = result.error
  }
}

// 日期转时间戳
const dateToTsInput = ref('')
const dateToTsResultSecond = ref('')
const dateToTsResultMs = ref('')

function useCurrentDateTime() {
  dateToTsInput.value = getCurrentFormattedDate('yyyy-MM-dd HH:mm:ss')
}

function convertDateToTs() {
  if (!dateToTsInput.value) return

  const result = dateToTimestamp(dateToTsInput.value)
  if (result.success) {
    dateToTsResultSecond.value = result.second.toString()
    dateToTsResultMs.value = result.millisecond.toString()
  } else {
    dateToTsResultSecond.value = result.error
    dateToTsResultMs.value = ''
  }
}

// 复制功能
const { copyMessage, copyToClipboard } = useCopyToast()

function copyLiveDateTime() {
  copyToClipboard(liveDateTime.value)
}

function copyLiveTimestamp() {
  copyToClipboard(liveTimestamp.value.toString())
}

function copyTsToDateResult() {
  copyToClipboard(tsToDateResult.value)
}

function copySecondTs() {
  copyToClipboard(dateToTsResultSecond.value)
}

function copyMsTs() {
  copyToClipboard(dateToTsResultMs.value)
}

const initialCron = buildInitialCronPreview()
const cronInput = ref(initialCron.expression)
const cronDescription = ref('')
const cronRuns = ref([])
const cronHasError = ref(false)
const selectedTimezoneIds = ref(['local', 'new-york', 'london', 'tokyo'])
const timezoneToAdd = ref('')
const timezoneRows = computed(() => buildTimezoneComparison(selectedTimezoneIds.value, liveTime.value).rows || [])
const availableTimezones = computed(() => getAvailableTimezonePresets(selectedTimezoneIds.value))

function explainCron() {
  const result = explainCronExpression(cronInput.value)
  if (result.success) {
    cronDescription.value = result.description
    cronRuns.value = result.formattedRuns
    cronHasError.value = false
  } else {
    cronDescription.value = result.displayMessage
    cronRuns.value = []
    cronHasError.value = true
  }
}

function addTimezone() {
  if (!timezoneToAdd.value) return
  selectedTimezoneIds.value = [...selectedTimezoneIds.value, timezoneToAdd.value]
  timezoneToAdd.value = ''
}

function removeTimezone(row) {
  if (row.pinned) return
  selectedTimezoneIds.value = selectedTimezoneIds.value.filter((item) => item !== row.id)
}

// 启动定时器
onMounted(() => {
  if (initialCron.success) {
    cronDescription.value = initialCron.description
    cronRuns.value = initialCron.formattedRuns
  } else {
    cronDescription.value = initialCron.displayMessage
    cronHasError.value = true
  }
  timer = setInterval(() => {
    liveTime.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.time-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  gap: 12px;
}

.time-navigation {
  position: sticky;
  top: 0;
  z-index: 5;
  flex: none;
  align-self: flex-start;
  background: var(--bg-secondary);
}

/* 实时时间显示区 */
.live-section {
  padding: 14px 16px;
  box-shadow: var(--shadow-soft);
}

.live-row {
  display: flex;
  gap: 24px;
}

.live-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
}

.live-label {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 60px;
}

.live-value {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.live-ts-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unit-toggle {
  display: flex;
  gap: 0;
}

.unit-toggle button {
  padding: 2px 8px;
  font-size: 11px;
  background: transparent;
  border: none;
  border-radius: 0;
}

.copy-btn {
  padding: 4px 10px;
  font-size: 12px;
}

.copy-btn.small {
  padding: 2px 6px;
  font-size: 11px;
}

/* 转换区域 */
.convert-section {
}

.section-header {
  font-size: 13px;
}

.convert-content {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.convert-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.row-label {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 70px;
}

.convert-input {
  flex: 1;
  min-width: 150px;
  padding: 6px 10px;
  font-family: var(--font-mono);
  font-size: 13px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.convert-input:focus {
  outline: none;
  border-color: var(--accent);
}

.cron-input {
  font-family: var(--font-mono);
}

.cron-result-row {
  align-items: flex-start;
}

.cron-error {
  color: var(--error);
}

.cron-run-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 8px 10px 8px 28px;
  flex: 1;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  background: var(--bg-tertiary);
  font-family: var(--font-mono);
  font-size: 13px;
}

.timezone-table {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.timezone-table th,
.timezone-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-subtle);
  text-align: left;
}

.timezone-table th {
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  font-size: 12px;
}

.timezone-table td {
  color: var(--text-primary);
}

.inline-radio {
  display: flex;
  gap: 12px;
}

.inline-radio label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
}

.format-select {
  flex: 1;
  min-width: 200px;
  padding: 6px 10px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.convert-result {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  min-width: 150px;
  border: 1px solid var(--border-subtle);
}

.ts-results-inline {
  display: flex;
  gap: 16px;
  flex: 1;
}

.ts-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-tertiary);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.ts-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.ts-value {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
}

@media (max-width: 900px) {
  .live-row,
  .convert-row,
  .ts-results-inline {
    align-items: stretch;
    flex-direction: column;
  }

  .live-item,
  .live-ts-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .row-label,
  .live-label {
    min-width: 0;
  }

  .convert-input,
  .format-select,
  .convert-result {
    width: 100%;
    min-width: 0;
  }
}
</style>
