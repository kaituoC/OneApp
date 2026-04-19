<template>
  <div class="time-tab">
    <!-- 实时时间显示区 -->
    <div class="live-section">
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
            <div class="unit-toggle">
              <button :class="{ active: displayMode === 'second' }" @click="displayMode = 'second'">秒</button>
              <button :class="{ active: displayMode === 'millisecond' }" @click="displayMode = 'millisecond'">毫秒</button>
            </div>
          </div>
          <button class="copy-btn" @click="copyLiveTimestamp">复制</button>
        </div>
      </div>
    </div>

    <!-- 时间戳转日期 -->
    <div class="convert-section">
      <div class="section-header">时间戳转日期</div>
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
    <div class="convert-section">
      <div class="section-header">日期转时间戳</div>
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

    <!-- 复制成功提示 -->
    <div v-if="copyMessage" class="copy-toast">{{ copyMessage }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  formatDate,
  parseDate,
  timestampToDate,
  dateToTimestamp,
  getCurrentTimestamp,
  getCurrentFormattedDate
} from '../utils/timeHelper.js'

const props = defineProps({
  fontSize: { type: Number, default: 14 }
})

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
const copyMessage = ref('')

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    copyMessage.value = '已复制'
    setTimeout(() => copyMessage.value = '', 1500)
  } catch {
    copyMessage.value = '复制失败'
    setTimeout(() => copyMessage.value = '', 1500)
  }
}

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

// 启动定时器
onMounted(() => {
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

/* 实时时间显示区 */
.live-section {
  background: var(--bg-secondary);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  padding: 12px 16px;
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
}

.live-label {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 60px;
}

.live-value {
  font-family: var(--font-mono);
  font-size: 14px;
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
  border: 1px solid var(--border-color);
  border-radius: 3px;
}

.unit-toggle button {
  padding: 2px 8px;
  font-size: 11px;
  background: transparent;
  border: none;
  border-radius: 0;
}

.unit-toggle button:first-child {
  border-radius: 2px 0 0 2px;
}

.unit-toggle button:last-child {
  border-radius: 0 2px 2px 0;
  border-left: 1px solid var(--border-color);
}

.unit-toggle button.active {
  background: var(--accent);
  color: white;
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
  background: var(--bg-secondary);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.section-header {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
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
  border-radius: 3px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.convert-input:focus {
  outline: none;
  border-color: var(--accent);
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
  border-radius: 3px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.convert-result {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  padding: 6px 10px;
  border-radius: 3px;
  min-width: 150px;
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
  border-radius: 3px;
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

/* 复制提示 */
.copy-toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent);
  color: white;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1000;
}
</style>