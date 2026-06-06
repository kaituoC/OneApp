import { defineConfig } from 'vitest/config'

// 钉死测试时区，消除依赖运行机器时区的 flaky（如 timeHelper 绝对时间戳断言）。
// 必须在 worker 启动前设置，故置于配置模块顶部。
process.env.TZ = 'Asia/Shanghai'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    globals: true
  }
})