const NAVIGATION_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'])

export function handleSegmentedKeydown(event) {
  if (!NAVIGATION_KEYS.has(event?.key)) return

  const group = event.currentTarget
  const options = Array.from(group?.querySelectorAll?.('[role="radio"]:not(:disabled)') || [])
  if (!options.length) return

  const current = event.target?.closest?.('[role="radio"]')
  const currentIndex = Math.max(0, options.indexOf(current))
  let nextIndex = currentIndex

  if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = options.length - 1
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + options.length) % options.length
  else nextIndex = (currentIndex + 1) % options.length

  event.preventDefault()
  options[nextIndex].click()
  options[nextIndex].focus()
}
