import type { ShallowRef } from 'vue'

export function useViewportItemMotion(
  container: Readonly<ShallowRef<HTMLElement | null>>,
  selector: string,
) {
  let frame = 0

  function update() {
    frame = 0
    const root = container.value
    if (!root) return

    const viewportHeight = window.innerHeight
    const items = root.querySelectorAll<HTMLElement>(selector)

    for (const item of items) {
      const media = item.querySelector<HTMLElement>('[data-motion-media]')
      if (!media) continue

      const rect = item.getBoundingClientRect()
      const center = (rect.top + rect.height * 0.5) / viewportHeight
      let opacity = 1

      if (center >= 1.14) opacity = 0
      else if (center > 0.72) opacity = (1.14 - center) / 0.42
      else if (center < -0.28) opacity = 0
      else if (center < 0.16) opacity = (center + 0.28) / 0.44

      opacity = Math.min(Math.max(opacity, 0), 1)
      const translate = (center - 0.45) * 5.5
      const scale = 0.9 + opacity * 0.1
      const inset = (1 - opacity) * 16

      media.style.opacity = String(opacity)
      media.style.clipPath = `inset(${inset}% ${inset}%)`
      media.style.transform = `translate3d(0, ${translate}vh, 0) scale(${scale})`
      item.style.pointerEvents = opacity > 0.12 ? 'auto' : 'none'
    }
  }

  function requestUpdate() {
    if (frame) return
    frame = window.requestAnimationFrame(update)
  }

  onMounted(async () => {
    await nextTick()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', requestUpdate)
    window.removeEventListener('resize', requestUpdate)
    if (frame) window.cancelAnimationFrame(frame)
  })
}
