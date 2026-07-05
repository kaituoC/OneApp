import { describe, it, expect } from 'vitest'
import { runAgent } from '../electron/agentWorkshop/runner.js'

describe('runAgent env handling', () => {
  it('passes an explicit environment to the child process', async () => {
    const result = await runAgent({
      command: process.execPath,
      args: ['-e', 'process.stdout.write(process.env.ONEAPP_AGENT_PROXY_TEST || "")'],
      cwd: process.cwd(),
      prompt: '',
      env: { ...process.env, ONEAPP_AGENT_PROXY_TEST: 'injected-env' },
      timeoutMs: 5000
    })

    expect(result.ok).toBe(true)
    expect(result.text).toBe('injected-env')
  })
})
