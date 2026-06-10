export function runTypewriter() {
  const prefersReducedMotion = globalThis.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  document.querySelectorAll<HTMLElement>('[data-typewriter]').forEach((el) => {
    if (el.dataset.typewriterReady === 'true') return
    el.dataset.typewriterReady = 'true'

    const text = el.dataset.text || ''

    if (prefersReducedMotion) {
      el.textContent = text
      return
    }

    const charDelay = Number.parseInt(el.dataset.charDelay || '60', 10)
    const startDelay = Number.parseInt(el.dataset.startDelay || '650', 10)

    const cursor = document.createElement('span')
    cursor.className = 'terminal-cursor'
    cursor.textContent = '▌'
    cursor.setAttribute('aria-hidden', 'true')
    el.append(cursor)

    let i = 0
    setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          el.insertBefore(document.createTextNode(text[i]), cursor)
          i++
        } else {
          clearInterval(interval)
        }
      }, charDelay)
    }, startDelay)
  })
}
