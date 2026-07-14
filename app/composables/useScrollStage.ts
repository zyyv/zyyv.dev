import type { ShallowRef } from 'vue'

interface ScrollStageOptions {
  duration?: number
  rebuildOnResize?: boolean
  setup: () => Animation[]
}

export function useScrollStage(
  section: Readonly<ShallowRef<HTMLElement | null>>,
  options: ScrollStageOptions,
) {
  const duration = options.duration ?? 1000
  let animations: Animation[] = []
  let frame = 0

  function setupAnimations() {
    for (const animation of animations) animation.cancel()
    animations = options.setup()
    for (const animation of animations) animation.pause()
  }

  function update() {
    frame = 0
    const element = section.value
    if (!element) return

    const rect = element.getBoundingClientRect()
    const distance = Math.max(element.offsetHeight - window.innerHeight, 1)
    const progress = Math.min(Math.max(-rect.top / distance, 0), 1)

    for (const animation of animations) animation.currentTime = progress * duration
  }

  function requestUpdate() {
    if (frame) return
    frame = window.requestAnimationFrame(update)
  }

  function handleResize() {
    if (!options.rebuildOnResize) {
      requestUpdate()
      return
    }

    setupAnimations()
    requestUpdate()
  }

  onMounted(async () => {
    await nextTick()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    setupAnimations()
    update()

    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', requestUpdate)
    window.removeEventListener('resize', handleResize)
    if (frame) window.cancelAnimationFrame(frame)
    for (const animation of animations) animation.cancel()
  })
}
