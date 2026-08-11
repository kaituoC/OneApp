export const TOOL_STATUS_EVENT = 'oneapp:tool-status'

export function publishToolStatus(message, tone = 'default') {
  if (typeof window === 'undefined' || !message) return
  window.dispatchEvent(new CustomEvent(TOOL_STATUS_EVENT, {
    detail: { message, tone }
  }))
}
